"""initial postgresql schema

Revision ID: 20260506_01
Revises:
Create Date: 2026-05-06 18:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260506_01"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


category_enum = sa.Enum(
    "breakfast", "lunch", "dinner", "dessert", "snack", "beverage", "other",
    name="categoryenum",
)
difficulty_enum = sa.Enum("easy", "medium", "hard", name="difficultyenum")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("avatar_url", sa.String(length=1000), nullable=True),
        sa.Column("bio", sa.String(length=300), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("is_admin", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
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
        sa.Column("is_favorite", sa.Boolean(), nullable=True),
        sa.Column("is_public", sa.Boolean(), nullable=True),
        sa.Column("share_token", sa.String(length=36), nullable=True),
        sa.Column("owner_id", sa.Integer(), nullable=True),
        sa.Column("copied_from_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["copied_from_id"], ["recipes.id"], ),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("share_token"),
    )
    op.create_index(op.f("ix_recipes_id"), "recipes", ["id"], unique=False)

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
        sa.Column("uploaded_at", sa.DateTime(), nullable=True),
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
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("recipe_id", "user_id", name="uix_recipe_user_review"),
    )
    op.create_index(op.f("ix_reviews_id"), "reviews", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_reviews_id"), table_name="reviews")
    op.drop_table("reviews")
    op.drop_index(op.f("ix_recipe_images_id"), table_name="recipe_images")
    op.drop_table("recipe_images")
    op.drop_index(op.f("ix_ingredients_id"), table_name="ingredients")
    op.drop_table("ingredients")
    op.drop_table("collection_recipes")
    op.drop_index(op.f("ix_collections_id"), table_name="collections")
    op.drop_table("collections")
    op.drop_index(op.f("ix_recipes_id"), table_name="recipes")
    op.drop_table("recipes")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    category_enum.drop(op.get_bind(), checkfirst=True)
    difficulty_enum.drop(op.get_bind(), checkfirst=True)
