"""update statuses

Revision ID: 003
Revises: 002
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename existing statuses to new names
    op.execute("UPDATE statuses SET name = 'Todo', color = '#64748b', position = 0 WHERE name = 'Planning / Backlog'")
    op.execute("UPDATE statuses SET name = 'In Process', color = '#0ea5e9', position = 1 WHERE name = 'Yet to Start'")
    op.execute("UPDATE statuses SET name = 'Finished', color = '#22c55e', position = 2 WHERE name = 'In Process'")
    op.execute("UPDATE statuses SET name = 'Test', color = '#f59e0b', position = 3 WHERE name = 'Blocked'")
    op.execute("UPDATE statuses SET name = 'Closed', color = '#8b5cf6', position = 4 WHERE name = 'Finished'")


def downgrade() -> None:
    op.execute("UPDATE statuses SET name = 'Planning / Backlog', color = '#8b5cf6', position = 0 WHERE name = 'Todo'")
    op.execute("UPDATE statuses SET name = 'Yet to Start', color = '#64748b', position = 1 WHERE name = 'In Process' AND position = 1")
    op.execute("UPDATE statuses SET name = 'In Process', color = '#0ea5e9', position = 2 WHERE name = 'Finished' AND position = 2")
    op.execute("UPDATE statuses SET name = 'Blocked', color = '#ef4444', position = 3 WHERE name = 'Test'")
    op.execute("UPDATE statuses SET name = 'Finished', color = '#22c55e', position = 4 WHERE name = 'Closed'")
