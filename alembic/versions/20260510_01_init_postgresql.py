"""initial postgresql schema

Revision ID: 20260510_01
Revises:
Create Date: 2026-05-10 10:00:00
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260510_01"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums
    category_enum = postgresql.ENUM('breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'beverage', 'other', name='categoryenum')
    category_enum.create(op.get_bind())
    difficulty_enum = postgresql.ENUM('easy', 'medium', 'hard', name='difficultyenum')
    difficulty_enum.create(op.get_bind())

    # Tables
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("avatar_url", sa.String(length=1000), nullable=True),
        sa.Column("bio", sa.String(length=300), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=True),
        sa.Column("failed_login_attempts", sa.Integer(), nullable=True),
        sa.Column("account_locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=False),
        sa.Column("servings", sa.Integer(), nullable=False),
        sa.Column("prep_time_minutes", sa.Integer(), nullable=True),
        sa.Column("cook_time_minutes", sa.Integer(), nullable=True),
        sa.Column("category", category_enum, nullable=True),
        sa.Column("difficulty", difficulty_enum, nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=True),
        sa.Column("share_token", sa.String(length=36), nullable=True),
        sa.Column("owner_id", sa.Integer(), nullable=True),
        sa.Column("submitted_by", sa.Integer(), nullable=True),
        sa.Column("copied_from_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["copied_from_id"], ["recipes.id"], ),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"], ),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("share_token"),
    )
    op.create_index(op.f("ix_recipes_id"), "recipes", ["id"], unique=False)

    op.create_table(
        "favorites",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "recipe_id", name="uq_user_recipe_favorite"),
    )
    op.create_index(op.f("ix_favorites_id"), "favorites", ["id"], unique=False)

    op.create_table(
        "ingredients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(length=50), nullable=False),
        sa.Column("notes", sa.String(length=300), nullable=True),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ingredients_id"), "ingredients", ["id"], unique=False)

    op.create_table(
        "recipe_images",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=True),
        sa.Column("url", sa.String(length=1000), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=True),
        sa.Column("order", sa.Integer(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recipe_images_id"), "recipe_images", ["id"], unique=False)

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("recipe_id", "user_id", name="uix_recipe_user_review"),
    )
    op.create_index(op.f("ix_reviews_id"), "reviews", ["id"], unique=False)

    op.create_table(
        "otp_verifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("otp", sa.String(length=6), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("payload", sa.String(length=2000), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_otp_verifications_email"), "otp_verifications", ["email"], unique=False)
    op.create_index(op.f("ix_otp_verifications_id"), "otp_verifications", ["id"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=True),
        sa.Column("recipe_id", sa.Integer(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)

    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_comments_id"), "comments", ["id"], unique=False)

    op.create_table(
        "recipe_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("submitter_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("admin_notes", sa.String(length=500), nullable=True),
        sa.Column("reviewed_by", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], ),
        sa.ForeignKeyConstraint(["submitter_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recipe_submissions_id"), "recipe_submissions", ["id"], unique=False)
    op.create_index(op.f("ix_recipe_submissions_status"), "recipe_submissions", ["status"], unique=False)
    op.create_index(op.f("ix_recipe_submissions_submitter_id"), "recipe_submissions", ["submitter_id"], unique=False)

    op.create_table(
        "collections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("owner_id", sa.Integer(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_collections_id"), "collections", ["id"], unique=False)

    op.create_table(
        "collection_recipes",
        sa.Column("collection_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("added_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["collection_id"], ["collections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("collection_id", "recipe_id"),
    )

    op.create_table(
        "meal_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=False),
        sa.Column("planned_date", sa.Date(), nullable=False),
        sa.Column("meal_type", sa.String(length=20), nullable=False),
        sa.Column("servings", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_meal_plans_id"), "meal_plans", ["id"], unique=False)
    op.create_index(op.f("ix_meal_plans_recipe_id"), "meal_plans", ["recipe_id"], unique=False)
    op.create_index(op.f("ix_meal_plans_user_id"), "meal_plans", ["user_id"], unique=False)

    op.create_table(
        "shopping_list",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("recipe_id", sa.Integer(), nullable=True),
        sa.Column("ingredient_name", sa.String(length=255), nullable=False),
        sa.Column("quantity", sa.String(length=100), nullable=True),
        sa.Column("checked", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_shopping_list_user_id"), "shopping_list", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_table("shopping_list")
    op.drop_table("meal_plans")
    op.drop_table("collection_recipes")
    op.drop_table("collections")
    op.drop_table("recipe_submissions")
    op.drop_table("comments")
    op.drop_table("notifications")
    op.drop_table("otp_verifications")
    op.drop_table("reviews")
    op.drop_table("recipe_images")
    op.drop_table("ingredients")
    op.drop_table("favorites")
    op.drop_table("recipes")
    op.drop_table("users")
    sa.Enum(name='categoryenum').drop(op.get_bind())
    sa.Enum(name='difficultyenum').drop(op.get_bind())
