"""add result count to search sessions

Revision ID: 0005_search_session_result_count
Revises: 0003_optimize_queries_and_oauth_identity
Create Date: 2026-10-12
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0005_search_session_result_count"
down_revision = "0003_optimize_queries_and_oauth_identity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "search_sessions",
        sa.Column("result_count", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("search_sessions", "result_count")
