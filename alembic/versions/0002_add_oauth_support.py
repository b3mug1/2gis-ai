"""add oauth support

Revision ID: 0002_add_oauth_support
Revises: 0001_initial_schema
Create Date: 2026-08-10
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0002_add_oauth_support"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)
    op.add_column("users", sa.Column("oauth_provider", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("oauth_id", sa.String(length=255), nullable=True))
    op.create_index(op.f("ix_users_oauth_provider"), "users", ["oauth_provider"], unique=False)
    op.create_index(op.f("ix_users_oauth_id"), "users", ["oauth_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_oauth_id"), table_name="users")
    op.drop_index(op.f("ix_users_oauth_provider"), table_name="users")
    op.drop_column("users", "oauth_id")
    op.drop_column("users", "oauth_provider")
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
