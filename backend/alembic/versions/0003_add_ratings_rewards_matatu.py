"""Add ratings, rewards, and matatu data tables."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "0003_add_ratings_rewards_matatu"
down_revision = "0002_add_is_admin_to_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ratings table
    op.create_table(
        "ratings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("point_id", UUID(as_uuid=True), sa.ForeignKey("points.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),  # 1-5
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_ratings_point_user", "ratings", ["point_id", "user_id"], unique=True)

    # Rewards table
    reward_type = sa.Enum("free_premium", "physical_gift", name="reward_type")
    reward_type.create(op.get_bind(), checkfirst=True)
    reward_status = sa.Enum("pending", "fulfilled", name="reward_status")
    reward_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "rewards",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("type", reward_type, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("period_start", sa.DateTime(timezone=True)),
        sa.Column("period_end", sa.DateTime(timezone=True)),
        sa.Column("status", reward_status, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Matatu routes table
    op.create_table(
        "matatu_routes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("route_number", sa.String(32)),
        sa.Column("created_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Matatu stages table
    op.create_table(
        "matatu_stages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("route_id", UUID(as_uuid=True), sa.ForeignKey("matatu_routes.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_matatu_stages_location", "matatu_stages", ["lat", "lng"])


def downgrade() -> None:
    for table in ("matatu_stages", "matatu_routes", "rewards", "ratings"):
        op.drop_table(table)
    op.execute("DROP TYPE IF EXISTS reward_status")
    op.execute("DROP TYPE IF EXISTS reward_type")
