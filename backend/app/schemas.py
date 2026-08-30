from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models import ContributionType, PointLayer, ReportStatus, UserStatus


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