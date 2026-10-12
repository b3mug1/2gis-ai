"""merge user language and search session migrations

Revision ID: 0006_merge_user_language_and_result_count
Revises: 0004_user_preferred_language, 0005_search_session_result_count
Create Date: 2026-10-12
"""

from __future__ import annotations

revision = "0006_merge_user_language_and_result_count"
down_revision = (
    "0004_user_preferred_language",
    "0005_search_session_result_count",
)
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
