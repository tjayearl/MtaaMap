"""Document water attribute split: availability vs potability."""

from alembic import op

revision = "0004_water_attribute_split"
down_revision = "0003_add_ratings_rewards_matatu"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This migration documents the API change for water attributes.
    # No database changes required — the key-value system already supports this.
    #
    # BREAKING CHANGE: The single 'water' attribute is now split into:
    # - water_availability: 'reliable' | 'unreliable' | 'unknown'
    # - water_potability: 'safe_to_drink' | 'needs_treatment' | 'unknown'
    #
    # This allows distinguishing between:
    # 1. "Water flows reliably" — water_availability: reliable
    # 2. "Need a dispenser" — water_potability: needs_treatment
    # 3. vs safe drinking water available directly — water_availability: reliable, water_potability: safe_to_drink
    #
    # Clients should transition to providing both attributes for neighborhood data.
    # The old single 'water' attribute is deprecated but will continue to work during transition.
    pass


def downgrade() -> None:
    # No database changes to revert
    pass
