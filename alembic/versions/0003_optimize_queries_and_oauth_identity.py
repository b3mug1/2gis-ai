"""optimize query indexes and oauth identity uniqueness

Revision ID: 0003_optimize_queries_and_oauth_identity
Revises: 0002_add_oauth_support
Create Date: 2026-09-18
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0003_optimize_queries_and_oauth_identity"
down_revision = "0002_add_oauth_support"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint("uq_users_oauth_identity", "users", ["oauth_provider", "oauth_id"])
    op.create_index(
        "ix_search_history_user_created",
        "search_history",
        ["user_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_favorite_places_user_created",
        "favorite_places",
        ["user_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_search_statistics_user_date",
        "search_statistics",
        ["user_id", sa.text("stat_date DESC")],
    )
    op.create_index("ix_cached_ai_results_expires_at", "cached_ai_results", ["expires_at"])
    op.create_index("ix_search_sessions_created_at", "search_sessions", ["created_at"])
    op.create_index(
        "ix_search_sessions_status_created",
        "search_sessions",
        ["status", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_search_sessions_status_created", table_name="search_sessions")
    op.drop_index("ix_search_sessions_created_at", table_name="search_sessions")
    op.drop_index("ix_cached_ai_results_expires_at", table_name="cached_ai_results")
    op.drop_index("ix_search_statistics_user_date", table_name="search_statistics")
    op.drop_index("ix_favorite_places_user_created", table_name="favorite_places")
    op.drop_index("ix_search_history_user_created", table_name="search_history")
    op.drop_constraint("uq_users_oauth_identity", "users", type_="unique")
