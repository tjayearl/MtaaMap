import json
import math
from datetime import datetime
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from geoalchemy2 import Geography
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.db import get_db
from app.logging_config import get_logger, init_logging
from app.models import Comment, Contribution, ContributionType, Point, PointAttribute, Report, User, UserStatus
from app.schemas import (
    AdminActionRequest,
    CommentCreate,
    CommentResponse,
    ContributionResponse,
    DirectionsRequest,
    DirectionsResponse,
    LoginRequest,
    PointCreate,
    PointResponse,
    RegisterRequest,
    ReportCreate,
    ReportResponse,
    TokenResponse,
    UserAdminResponse,
    UserResponse,
)
from app.security import create_access_token, get_admin_user, get_current_user, hash_password, verify_password

# Initialize logging
init_logging()
logger = get_logger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="MtaaMap API", version="0.1.0")
app.state.limiter = limiter

# CORS configuration for both dev and production
allowed_origins = [
    settings.frontend_origin,
    "http://localhost:3000",
    "http://localhost:5173",
    "https://mtaa-map.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def point_response(point: Point, db: Session) -> PointResponse:
    coordinates = db.scalar(select(func.ST_AsGeoJSON(point.location)))
    geometry = json.loads(coordinates)
    return PointResponse(
        id=point.id,
        layer=point.layer,
        name=point.name,
        area=point.area,
        lng=geometry["coordinates"][0],
        lat=geometry["coordinates"][1],
        photo_url=point.photo_url,
        attributes=[{"key": item.key, "value": item.value, "unit": item.unit} for item in point.attributes],
        created_at=point.created_at,
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    filters = [User.email == payload.email] if payload.email else [User.phone == payload.phone]
    if db.scalar(select(User).where(*filters)):
        raise HTTPException(status_code=409, detail="An account with that contact already exists")
    user = User(email=payload.email, phone=payload.phone, password_hash=hash_password(payload.password), display_name=payload.display_name)
    db.add(user)
    db.flush()
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id), user=user)


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where((User.email == payload.identifier) | (User.phone == payload.identifier)))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid identifier or password")
    return TokenResponse(access_token=create_access_token(user.id), user=user)


@app.get("/points", response_model=list[PointResponse])
def list_points(
    layer: str | None = None,
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    radius_km: float = Query(default=2, gt=0, le=100),
    filter: str | None = None,
    has_comments: bool = False,
    sort: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(Point).options(joinedload(Point.attributes))

    if layer is not None:
        query = query.where(Point.layer == layer)

    if has_comments:
        query = query.join(Comment).where(Comment.point_id == Point.id)
        query = query.group_by(Point.id)

    if lat is not None and lng is not None:
        origin = ST_SetSRID(ST_MakePoint(lng, lat), 4326).cast(Geography)
        distance = ST_Distance(Point.location, origin)
        query = query.where(distance <= radius_km * 1000)
        order_by = distance
    else:
        order_by = Point.created_at.desc()

    if has_comments:
        if sort == "recent_activity":
            order_by = func.coalesce(Point.last_comment_at, Point.created_at).desc()
        elif sort == "popular":
            order_by = func.count(Comment.id).desc()
        else:
            order_by = func.coalesce(Point.last_comment_at, Point.created_at).desc()

    if filter:
        query = query.join(PointAttribute).where(PointAttribute.key.ilike(f"%{filter}%") | PointAttribute.value.ilike(f"%{filter}%"))

    query = query.order_by(order_by)
    points = db.scalars(query.distinct()).all()
    return [point_response(point, db) for point in points]


@app.post("/points", response_model=PointResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def create_point(request, payload: PointCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    point = Point(
        layer=payload.layer,
        name=payload.name,
        area=payload.area,
        location=f"SRID=4326;POINT({payload.lng} {payload.lat})",
        created_by=current_user.id,
        photo_url=payload.photo_url,
        attributes=[PointAttribute(key=item.key, value=item.value, unit=item.unit) for item in payload.attributes],
    )
    db.add(point)
    db.flush()
    db.add(Contribution(user_id=current_user.id, point_id=point.id, type=ContributionType.created))
    db.commit()
    db.refresh(point)
    logger.info("point_created", point_id=str(point.id), user_id=str(current_user.id))
    return point_response(point, db)


@app.get("/points/{point_id}", response_model=PointResponse)
def get_point(point_id: UUID, db: Session = Depends(get_db)):
    point = db.scalar(select(Point).options(joinedload(Point.attributes)).where(Point.id == point_id))
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    return point_response(point, db)


@app.post("/points/{point_id}/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def report_point(request, point_id: UUID, payload: ReportCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(Point, point_id):
        raise HTTPException(status_code=404, detail="Point not found")
    report = Report(point_id=point_id, submitted_by=current_user.id, reason=payload.reason, proposed_changes=payload.proposed_changes)
    db.add(report)
    db.commit()
    db.refresh(report)
    logger.info("report_created", report_id=str(report.id), point_id=str(point_id))
    return report


@app.post("/points/{point_id}/confirm", response_model=ContributionResponse, status_code=status.HTTP_201_CREATED)
def confirm_point(point_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(Point, point_id):
        raise HTTPException(status_code=404, detail="Point not found")
    contribution = Contribution(user_id=current_user.id, point_id=point_id, type=ContributionType.confirmed)
    db.add(contribution)
    db.commit()
    db.refresh(contribution)
    return contribution


@app.get("/points/{point_id}/comments", response_model=list[CommentResponse])
def list_comments_for_point(point_id: UUID, db: Session = Depends(get_db)):
    if not db.get(Point, point_id):
        raise HTTPException(status_code=404, detail="Point not found")
    return db.scalars(
        select(Comment).where(Comment.point_id == point_id).order_by(Comment.created_at.asc())
    ).all()


@app.post("/points/{point_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def create_comment(request, point_id: UUID, payload: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(Point, point_id):
        raise HTTPException(status_code=404, detail="Point not found")

    if payload.parent_comment_id is not None:
        parent = db.get(Comment, payload.parent_comment_id)
        if parent is None or parent.point_id != point_id:
            raise HTTPException(status_code=400, detail="Parent comment not found for this point")

    comment = Comment(
        point_id=point_id,
        parent_comment_id=payload.parent_comment_id,
        user_id=current_user.id,
        body=payload.body,
    )
    db.add(comment)
    db.flush()

    point = db.get(Point, point_id)
    point.last_comment_at = comment.created_at

    db.commit()
    db.refresh(comment)
    logger.info("comment_created", comment_id=str(comment.id), point_id=str(point_id))
    return comment


@app.get("/users/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/users/me/contributions", response_model=list[ContributionResponse])
def get_contributions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Contribution).where(Contribution.user_id == current_user.id).order_by(Contribution.created_at.desc())).all()


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@app.get("/admin/users", response_model=list[UserAdminResponse])
def list_users_for_review(status: UserStatus | None = None, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """List users for moderation. Filters by status (warned, suspended, etc.)."""
    query = select(User)
    if status:
        query = query.where(User.status == status)
    
    users = db.scalars(query.order_by(User.created_at.desc())).all()
    logger.info("admin_list_users", admin_id=str(admin.id), count=len(users))
    return users


@app.post("/admin/users/{user_id}/warn", response_model=UserAdminResponse)
def warn_user(user_id: UUID, payload: AdminActionRequest, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Issue a warning to a user (sets status to 'warned')."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.status = UserStatus.warned
    db.commit()
    db.refresh(user)
    logger.info("user_warned", user_id=str(user_id), admin_id=str(admin.id), reason=payload.reason)
    return user


@app.post("/admin/users/{user_id}/suspend", response_model=UserAdminResponse)
def suspend_user(user_id: UUID, payload: AdminActionRequest, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Suspend a user (sets status to 'suspended')."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.status = UserStatus.suspended
    db.commit()
    db.refresh(user)
    logger.info("user_suspended", user_id=str(user_id), admin_id=str(admin.id), reason=payload.reason)
    return user


@app.get("/admin/comments/flagged", response_model=list[CommentResponse])
def list_flagged_comments(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """List flagged comments for review."""
    comments = db.scalars(
        select(Comment).where(Comment.flagged_count > 0).order_by(Comment.flagged_count.desc())
    ).all()
    logger.info("admin_list_flagged_comments", admin_id=str(admin.id), count=len(comments))
    return comments


@app.post("/admin/comments/{comment_id}/flag/review", response_model=CommentResponse)
def review_flagged_comment(
    comment_id: UUID,
    action: str = Query(..., regex="^(accept|reject)$"),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Review a flagged comment. Action: 'accept' (delete) or 'reject' (restore)."""
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if action == "accept":
        # Delete the comment
        db.delete(comment)
        db.commit()
        logger.info("comment_removed", comment_id=str(comment_id), admin_id=str(admin.id))
        raise HTTPException(status_code=200, detail="Comment removed")
    else:
        # Reset flagged count (restore)
        comment.flagged_count = 0
        db.commit()
        db.refresh(comment)
        logger.info("comment_flag_rejected", comment_id=str(comment_id), admin_id=str(admin.id))
        return comment


# ============================================================================
# DIRECTIONS ENDPOINT (using haversine distance + basic routing)
# ============================================================================

def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in km using haversine formula."""
    R = 6371  # Earth's radius in km
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def estimate_duration(distance_km: float, speed_kmh: float = 40) -> float:
    """Estimate duration in minutes assuming average speed."""
    return (distance_km / speed_kmh) * 60


@app.post("/directions", response_model=DirectionsResponse)
@limiter.limit("30/minute")
def get_directions(request, payload: DirectionsRequest):
    """Get basic directions (haversine distance + estimated duration)."""
    distance = haversine_distance(payload.start_lat, payload.start_lng, payload.end_lat, payload.end_lng)
    duration = estimate_duration(distance)
    
    logger.info(
        "directions_requested",
        from_lat=payload.start_lat,
        from_lng=payload.start_lng,
        to_lat=payload.end_lat,
        to_lng=payload.end_lng,
        distance_km=distance
    )
    
    return DirectionsResponse(
        distance_km=round(distance, 2),
        duration_minutes=round(duration, 2),
        instructions=[]
    )