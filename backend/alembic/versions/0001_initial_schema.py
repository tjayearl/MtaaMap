"""Create the initial MtaaMap schema."""

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geography
from sqlalchemy.dialects.postgresql import JSONB

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    point_layer = sa.Enum("neighborhood", "prices", "potholes", name="point_layer")
    user_status = sa.Enum("active", "warned", "suspended", name="user_status")
    report_status = sa.Enum("pending", "accepted", "rejected", name="report_status")
    contribution_type = sa.Enum("created", "confirmed", "disputed", name="contribution_type")
    for enum in (point_layer, user_status, report_status, contribution_type):
        enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("email", sa.String(320), unique=True),
        sa.Column("phone", sa.String(32), unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(120), nullable=False),
        sa.Column("trust_score", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("status", user_status, nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "points",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("layer", point_layer, nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("area", sa.String(160), nullable=False),
        sa.Column("location", Geography(geometry_type="POINT", srid=4326), nullable=False),
        sa.Column("created_by", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("photo_url", sa.String(2048)),
    )
    op.create_index("ix_points_location", "points", ["location"], postgresql_using="gist")
    op.create_table(
        "point_attributes",
        sa.Column("point_id", sa.UUID(), sa.ForeignKey("points.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("key", sa.String(80), primary_key=True),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("unit", sa.String(32)),
    )
    op.create_index("ix_point_attributes_key_value", "point_attributes", ["key", "value"])
    op.create_table(
        "reports",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("point_id", sa.UUID(), sa.ForeignKey("points.id", ondelete="CASCADE"), nullable=False),
        sa.Column("submitted_by", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("proposed_changes", JSONB()),
        sa.Column("status", report_status, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        "contributions",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("point_id", sa.UUID(), sa.ForeignKey("points.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", contribution_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    for table in ("contributions", "reports", "point_attributes", "points", "users"):
        op.drop_table(table)
    op.execute("DROP TYPE IF EXISTS contribution_type")
    op.execute("DROP TYPE IF EXISTS report_status")
    op.execute("DROP TYPE IF EXISTS user_status")
    op.execute("DROP TYPE IF EXISTS point_layer")