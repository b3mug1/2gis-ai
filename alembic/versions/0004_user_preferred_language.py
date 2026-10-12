"""add preferred language to users

Revision ID: 0004_user_preferred_language
Revises: 0003_optimize_queries_and_oauth_identity
Create Date: 2026-10-12
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0004_user_preferred_language"
down_revision = "0003_optimize_queries_and_oauth_identity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("preferred_language", sa.String(length=10), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "preferred_language")
