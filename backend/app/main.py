import json
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from geoalchemy2 import Geography
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.db import get_db
from app.models import Comment, Contribution, ContributionType, Point, PointAttribute, Report, User
from app.schemas import (
    CommentCreate,
    CommentResponse,
    ContributionResponse,
    LoginRequest,
    PointCreate,
    PointResponse,
    RegisterRequest,
    ReportCreate,
    ReportResponse,
    TokenResponse,
    UserResponse,
)
from app.security import create_access_token, get_current_user, hash_password, verify_password

app = FastAPI(title="MtaaMap API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
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
def create_point(payload: PointCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
    return point_response(point, db)


@app.get("/points/{point_id}", response_model=PointResponse)
def get_point(point_id: UUID, db: Session = Depends(get_db)):
    point = db.scalar(select(Point).options(joinedload(Point.attributes)).where(Point.id == point_id))
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    return point_response(point, db)


@app.post("/points/{point_id}/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def report_point(point_id: UUID, payload: ReportCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.get(Point, point_id):
        raise HTTPException(status_code=404, detail="Point not found")
    report = Report(point_id=point_id, submitted_by=current_user.id, reason=payload.reason, proposed_changes=payload.proposed_changes)
    db.add(report)
    db.commit()
    db.refresh(report)
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
def create_comment(point_id: UUID, payload: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
    return comment


@app.get("/users/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/users/me/contributions", response_model=list[ContributionResponse])
def get_contributions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Contribution).where(Contribution.user_id == current_user.id).order_by(Contribution.created_at.desc())).all()