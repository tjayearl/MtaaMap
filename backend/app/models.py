import enum
import uuid
from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class PointLayer(str, enum.Enum):
    neighborhood = "neighborhood"
    prices = "prices"
    potholes = "potholes"


class UserStatus(str, enum.Enum):
    active = "active"
    warned = "warned"
    suspended = "suspended"


class ReportStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class ContributionType(str, enum.Enum):
    created = "created"
    confirmed = "confirmed"
    disputed = "disputed"


class RewardType(str, enum.Enum):
    free_premium = "free_premium"
    physical_gift = "physical_gift"


class RewardStatus(str, enum.Enum):
    pending = "pending"
    fulfilled = "fulfilled"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str | None] = mapped_column(String(320), unique=True)
    phone: Mapped[str | None] = mapped_column(String(32), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(120))
    trust_score: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    status: Mapped[UserStatus] = mapped_column(Enum(UserStatus, name="user_status"), default=UserStatus.active, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    points: Mapped[list["Point"]] = relationship(back_populates="creator")


class Point(Base):
    __tablename__ = "points"
    __table_args__ = (Index("ix_points_location", "location", postgresql_using="gist"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    layer: Mapped[PointLayer] = mapped_column(Enum(PointLayer, name="point_layer"), nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    area: Mapped[str] = mapped_column(String(160), nullable=False)
    location = mapped_column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(2_048))
    last_comment_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    creator: Mapped[User] = relationship(back_populates="points")
    attributes: Mapped[list["PointAttribute"]] = relationship(back_populates="point", cascade="all, delete-orphan")
    comments: Mapped[list["Comment"]] = relationship(back_populates="point", cascade="all, delete-orphan")


class PointAttribute(Base):
    __tablename__ = "point_attributes"
    __table_args__ = (Index("ix_point_attributes_key_value", "key", "value"),)

    point_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("points.id", ondelete="CASCADE"), primary_key=True)
    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    unit: Mapped[str | None] = mapped_column(String(32))

    point: Mapped[Point] = relationship(back_populates="attributes")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    point_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("points.id", ondelete="CASCADE"), nullable=False)
    submitted_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    proposed_changes: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[ReportStatus] = mapped_column(Enum(ReportStatus, name="report_status"), default=ReportStatus.pending, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Contribution(Base):
    __tablename__ = "contributions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    point_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("points.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[ContributionType] = mapped_column(Enum(ContributionType, name="contribution_type"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = (Index("ix_comments_point_id_created_at", "point_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    point_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("points.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_comment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    flagged_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    point: Mapped[Point] = relationship(back_populates="comments")
    author: Mapped[User] = relationship()
    parent: Mapped["Comment | None"] = relationship(remote_side="Comment.id")


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (Index("ix_ratings_point_user", "point_id", "user_id", unique=True),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    point_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("points.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    point: Mapped[Point] = relationship()
    user: Mapped[User] = relationship()


class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    type: Mapped[RewardType] = mapped_column(Enum(RewardType, name="reward_type"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[RewardStatus] = mapped_column(Enum(RewardStatus, name="reward_status"), default=RewardStatus.pending, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship()


class MatatuRoute(Base):
    __tablename__ = "matatu_routes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    route_number: Mapped[str | None] = mapped_column(String(32))
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    creator: Mapped[User] = relationship()
    stages: Mapped[list["MatatuStage"]] = relationship(back_populates="route", cascade="all, delete-orphan")


class MatatuStage(Base):
    __tablename__ = "matatu_stages"
    __table_args__ = (Index("ix_matatu_stages_location", "lat", "lng"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("matatu_routes.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    lat: Mapped[float] = mapped_column(nullable=False)
    lng: Mapped[float] = mapped_column(nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    route: Mapped[MatatuRoute] = relationship(back_populates="stages")
