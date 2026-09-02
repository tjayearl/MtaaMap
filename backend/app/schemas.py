from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models import ContributionType, PointLayer, ReportStatus, RewardStatus, RewardType, UserStatus


class RegisterRequest(BaseModel):
    email: str | None = None
    phone: str | None = None
    password: str = Field(min_length=8)
    display_name: str = Field(min_length=1, max_length=120)

    @model_validator(mode="after")
    def has_contact(self):
        if not self.email and not self.phone:
            raise ValueError("email or phone is required")
        return self


class LoginRequest(BaseModel):
    identifier: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    display_name: str
    email: str | None
    phone: str | None
    trust_score: int
    status: UserStatus
    is_admin: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AttributeInput(BaseModel):
    key: str = Field(min_length=1, max_length=80)
    value: str
    unit: str | None = None


class PointCreate(BaseModel):
    layer: PointLayer
    name: str
    area: str
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    photo_url: str | None = None
    attributes: list[AttributeInput] = Field(default_factory=list)


class PointResponse(BaseModel):
    id: UUID
    layer: PointLayer
    name: str
    area: str
    lat: float
    lng: float
    photo_url: str | None
    attributes: list[AttributeInput]
    created_at: datetime


class ReportCreate(BaseModel):
    reason: str = Field(min_length=1)
    proposed_changes: dict | None = None


class ReportResponse(BaseModel):
    id: UUID
    point_id: UUID
    reason: str
    proposed_changes: dict | None
    status: ReportStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class ContributionResponse(BaseModel):
    id: UUID
    point_id: UUID
    type: ContributionType
    created_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    parent_comment_id: UUID | None = None


class CommentResponse(BaseModel):
    id: UUID
    point_id: UUID
    parent_comment_id: UUID | None
    user_id: UUID
    body: str
    created_at: datetime
    flagged_count: int

    model_config = {"from_attributes": True}


class UserAdminResponse(BaseModel):
    """Extended user response for admin endpoints."""
    id: UUID
    display_name: str
    email: str | None
    phone: str | None
    trust_score: int
    status: UserStatus
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminActionRequest(BaseModel):
    """Request body for admin actions on users."""
    reason: str = Field(min_length=1, max_length=500)


class DirectionsRequest(BaseModel):
    """Request for directions to a point."""
    start_lat: float = Field(ge=-90, le=90)
    start_lng: float = Field(ge=-180, le=180)
    end_lat: float = Field(ge=-90, le=90)
    end_lng: float = Field(ge=-180, le=180)


class DirectionsResponse(BaseModel):
    """Response with directions/route information."""
    distance_km: float
    duration_minutes: float
    polyline: str | None = None
    instructions: list[str] = Field(default_factory=list)


class RatingCreate(BaseModel):
    """Create a rating for a point."""
    score: int = Field(ge=1, le=5)


class RatingResponse(BaseModel):
    """Rating response."""
    id: UUID
    point_id: UUID
    user_id: UUID
    score: int
    created_at: datetime

    model_config = {"from_attributes": True}


class RatingAverage(BaseModel):
    """Average rating for a point."""
    point_id: UUID
    average_score: float
    total_ratings: int


class RewardResponse(BaseModel):
    """Reward response."""
    id: UUID
    user_id: UUID
    type: RewardType
    description: str
    period_start: datetime | None
    period_end: datetime | None
    status: RewardStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class MatatuStageResponse(BaseModel):
    """Matatu stage response."""
    id: UUID
    route_id: UUID
    name: str
    lat: float
    lng: float
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MatatuRouteCreate(BaseModel):
    """Create a matatu route."""
    name: str = Field(min_length=1, max_length=160)
    route_number: str | None = Field(None, max_length=32)
    stages: list["MatatuStageCreate"] = Field(default_factory=list)


class MatatuStageCreate(BaseModel):
    """Create a matatu stage."""
    name: str = Field(min_length=1, max_length=160)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    notes: str | None = None


class MatatuRouteResponse(BaseModel):
    """Matatu route response."""
    id: UUID
    name: str
    route_number: str | None
    created_by: UUID
    stages: list[MatatuStageResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class MatatuRouteSearchResult(BaseModel):
    """Search result for matatu routes/stages."""
    route_id: UUID
    route_name: str
    stage_id: UUID
    stage_name: str
    lat: float
    lng: float
    distance_km: float | None = None


class HeatmapDataPoint(BaseModel):
    """Single point in heatmap data."""
    lat: float
    lng: float
    intensity: float  # 0-1, based on severity/density


class HeatmapResponse(BaseModel):
    """Heatmap data response."""
    layer: str
    metric: str
    data: list[HeatmapDataPoint]


class LeaderboardEntryResponse(BaseModel):
    """Leaderboard entry."""
    rank: int
    user_id: UUID
    display_name: str
    confirmed_contributions: int
    average_rating: float
    trust_score: int