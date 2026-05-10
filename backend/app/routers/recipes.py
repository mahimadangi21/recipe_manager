from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
import uuid

from app.database import get_db
from app.models.user import User
from app.models.recipe import Recipe as RecipeModel, CategoryEnum, DifficultyEnum, RecipeStatus
from app.models.ingredient import Ingredient as IngredientModel
from app.schemas.recipe import RecipeCreate, RecipeUpdate, RecipeResponse
from app.middleware.auth_middleware import get_current_user, get_current_admin_user
from app.config import settings
from app.models.favorite import Favorite
from app.utils.responses import api_response
from app.utils.notifications import notify_all_users, create_notification

router = APIRouter(prefix="/recipes", tags=["Recipes"])

@router.get("/public", response_model=List[RecipeResponse])
async def list_public_recipes(
    db: AsyncSession = Depends(get_db)
):
    # Public recipes must be approved and marked public
    query = select(RecipeModel).where(
        RecipeModel.status == RecipeStatus.approved,
        RecipeModel.is_public == True
    ).order_by(RecipeModel.created_at.desc())
    result = await db.execute(query)
    recipes = result.scalars().all()
    return api_response(True, data=[RecipeResponse.model_validate(r).model_dump() for r in recipes])

async def get_optional_user(request: Request, db: AsyncSession = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    from jose import jwt, JWTError
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            return None
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()
    except JWTError:
        return None

@router.get("/", response_model=List[RecipeResponse])
async def list_recipes(
    search: Optional[str] = None,
    category: Optional[CategoryEnum] = None,
    difficulty: Optional[DifficultyEnum] = None,
    favorites: Optional[bool] = None,
    owned: Optional[bool] = None,
    max_cook_time: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = select(RecipeModel)
    
    if search:
        query = query.where(or_(
            RecipeModel.title.ilike(f"%{search}%"),
            RecipeModel.description.ilike(f"%{search}%")
        ))
    if category:
        query = query.where(RecipeModel.category == category)
    if difficulty:
        query = query.where(RecipeModel.difficulty == difficulty)
    if max_cook_time:
        query = query.where(RecipeModel.cook_time_minutes <= max_cook_time)
        
    if current_user:
        if current_user.is_admin:
            # Admin sees everything (including rejected)
            pass
        elif favorites:
            # Join with favorites table
            query = query.join(Favorite, Favorite.recipe_id == RecipeModel.id).where(Favorite.user_id == current_user.id)
        elif owned:
            # User sees all their own recipes (pending/approved/rejected)
            query = query.where(RecipeModel.owner_id == current_user.id)
        else:
            # User sees all approved public recipes OR their own recipes
            from sqlalchemy import and_
            query = query.where(or_(
                and_(RecipeModel.status == RecipeStatus.approved, RecipeModel.is_public == True),
                RecipeModel.owner_id == current_user.id
            ))
    else:
        # Non-logged in users only see approved public recipes
        query = query.where(RecipeModel.status == RecipeStatus.approved, RecipeModel.is_public == True)

    query = query.order_by(RecipeModel.created_at.desc())
    
    # User requested to remove pagination limit to see "all recipes"
    # query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    recipes = result.scalars().all()
    
    # Check favorite status for each recipe if user is logged in
    fav_ids = set()
    if current_user:
        fav_result = await db.execute(select(Favorite.recipe_id).where(Favorite.user_id == current_user.id))
        fav_ids = set(fav_result.scalars().all())
    
    recipe_list = []
    for r in recipes:
        # Convert to dict manually or use Pydantic
        r_data = RecipeResponse.model_validate(r).model_dump()
        r_data["is_favorite"] = r.id in fav_ids
        recipe_list.append(r_data)
        
    return api_response(True, data=recipe_list)

@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(recipe: RecipeCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_recipe = RecipeModel(
        title=recipe.title,
        description=recipe.description,
        instructions=recipe.instructions,
        servings=recipe.servings,
        prep_time_minutes=recipe.prep_time_minutes,
        cook_time_minutes=recipe.cook_time_minutes,
        category=recipe.category,
        difficulty=recipe.difficulty,
        is_public=recipe.is_public,
        status="approved" if current_user.is_admin else "pending",
        owner_id=current_user.id,
        submitted_by=current_user.id
    )
    
    for ing in recipe.ingredients:
        db_ing = IngredientModel(**ing.model_dump())
        db_recipe.ingredients.append(db_ing)
        
    db.add(db_recipe)
    await db.commit()
    await db.refresh(db_recipe)
    
    # Notify admins of new submission
    if not current_user.is_admin:
        from app.utils.notifications import notify_admins
        await notify_admins(
            db,
            title="New Recipe Submitted",
            message=f"User {current_user.username} submitted a new recipe for approval: {db_recipe.title}",
            type="new_recipe_submitted",
            recipe_id=db_recipe.id
        )
    
    # Notify all users if admin adds a public recipe
    if current_user.is_admin and db_recipe.is_public:
        await notify_all_users(
            db,
            title="New Featured Recipe!",
            message=f"Admin has just published a new recipe: {db_recipe.title}. Check it out!",
            type="new_recipe"
        )
        
    return api_response(True, data=RecipeResponse.model_validate(db_recipe).model_dump(), message="Recipe created", status_code=201)

@router.get("/shared/{token}", response_model=RecipeResponse)
async def get_shared_recipe(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecipeModel).where(RecipeModel.share_token == token))
    db_recipe = result.scalar_one_or_none()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return api_response(True, data=RecipeResponse.model_validate(db_recipe).model_dump())

@router.get("/{id}", response_model=RecipeResponse)
async def get_recipe(id: int, current_user: Optional[User] = Depends(get_optional_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecipeModel).where(RecipeModel.id == id))
    db_recipe = result.scalar_one_or_none()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    if not db_recipe.is_public:
        if not current_user or db_recipe.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this recipe")
            
    # Add favorite status
    is_fav = False
    if current_user:
        fav_check = await db.execute(select(Favorite).where(Favorite.user_id == current_user.id, Favorite.recipe_id == id))
        is_fav = fav_check.scalar_one_or_none() is not None
        
    r_data = RecipeResponse.model_validate(db_recipe).model_dump()
    r_data["is_favorite"] = is_fav
    return api_response(True, data=r_data)

@router.put("/{id}", response_model=RecipeResponse)
async def update_recipe(id: int, recipe: RecipeUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecipeModel).where(RecipeModel.id == id))
    db_recipe = result.scalar_one_or_none()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    if not current_user.is_admin:
        if db_recipe.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only admins or owners can update recipes")
        if db_recipe.status == RecipeStatus.approved:
            raise HTTPException(status_code=403, detail="Cannot edit an approved recipe. Please contact admin.")
        
    update_data = recipe.model_dump(exclude_unset=True)
    ingredients_data = update_data.pop("ingredients", None)
    
    for key, value in update_data.items():
        setattr(db_recipe, key, value)
        
    if ingredients_data is not None:
        # clear existing
        db_recipe.ingredients.clear()
        for ing in ingredients_data:
            db_recipe.ingredients.append(IngredientModel(**ing))
            
    await db.commit()
    await db.refresh(db_recipe)
    
    # Notify users who favorited this recipe
    fav_users_result = await db.execute(select(Favorite.user_id).where(Favorite.recipe_id == id))
    fav_user_ids = fav_users_result.scalars().all()
    for uid in fav_user_ids:
        if uid != current_user.id: # don't notify the updater
            await create_notification(
                db,
                user_id=uid,
                title="Favorite Recipe Updated",
                message=f"One of your favorites '{db_recipe.title}' has been updated.",
                type="favorite_update"
            )
            
    return api_response(True, data=RecipeResponse.model_validate(db_recipe).model_dump(), message="Recipe updated")

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecipeModel).where(RecipeModel.id == id))
    db_recipe = result.scalar_one_or_none()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    if not current_user.is_admin:
        if db_recipe.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only admins or owners can delete recipes")
        if db_recipe.status == RecipeStatus.approved:
            raise HTTPException(status_code=403, detail="Cannot delete an approved recipe. Please contact admin.")
        
    await db.delete(db_recipe)
    await db.commit()
    return api_response(True, message="Recipe deleted")

@router.post("/{id}/favorite")
async def toggle_favorite(id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Check if recipe exists
    result = await db.execute(select(RecipeModel).where(RecipeModel.id == id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Check if already favorited
    fav_query = await db.execute(select(Favorite).where(Favorite.user_id == current_user.id, Favorite.recipe_id == id))
    existing_fav = fav_query.scalar_one_or_none()
    
    if existing_fav:
        await db.delete(existing_fav)
        await db.commit()
        return api_response(True, data={"is_favorite": False}, message="Removed from favorites")
    else:
        new_fav = Favorite(user_id=current_user.id, recipe_id=id)
        db.add(new_fav)
        await db.commit()
        return api_response(True, data={"is_favorite": True}, message="Added to favorites")

@router.post("/{id}/copy", response_model=RecipeResponse)
async def copy_recipe(id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecipeModel).where(RecipeModel.id == id))
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    if not original.is_public and original.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot copy private recipe")
        
    db_recipe = RecipeModel(
        title=original.title + " (Copy)",
        description=original.description,
        instructions=original.instructions,
        servings=original.servings,
        prep_time_minutes=original.prep_time_minutes,
        cook_time_minutes=original.cook_time_minutes,
        category=original.category,
        difficulty=original.difficulty,
        is_public=False,
        owner_id=current_user.id,
        copied_from_id=original.id
    )
    
    for ing in original.ingredients:
        db_recipe.ingredients.append(IngredientModel(
            name=ing.name,
            quantity=ing.quantity,
            unit=ing.unit,
            notes=ing.notes
        ))
        
    db.add(db_recipe)
    await db.commit()
    await db.refresh(db_recipe)
    return api_response(True, data=RecipeResponse.model_validate(db_recipe).model_dump(), message="Recipe copied")

@router.get("/{id}/scale")
async def scale_recipe(id: int, servings: int = Query(..., ge=1), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecipeModel).where(RecipeModel.id == id))
    db_recipe = result.scalar_one_or_none()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    scale_factor = servings / db_recipe.servings
    scaled_ingredients = []
    for ing in db_recipe.ingredients:
        scaled_ingredients.append({
            "name": ing.name,
            "quantity": round(ing.quantity * scale_factor, 2),
            "unit": ing.unit,
            "notes": ing.notes
        })
        
    return api_response(True, data={
        "id": db_recipe.id,
        "title": db_recipe.title,
        "base_servings": db_recipe.servings,
        "target_servings": servings,
        "ingredients": scaled_ingredients
    })


@router.get("/recommendations/for-me", response_model=List[RecipeResponse])
async def get_recommendations_for_user(
    limit: int = Query(8, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # prefer categories from user's own and favorited recipes
    user_recipe_rows = (
        await db.execute(select(RecipeModel.category).where(RecipeModel.owner_id == current_user.id))
    ).all()
    fav_rows = (
        await db.execute(
            select(RecipeModel.category)
            .join(Favorite, Favorite.recipe_id == RecipeModel.id)
            .where(Favorite.user_id == current_user.id)
        )
    ).all()
    preferred = [r[0] for r in user_recipe_rows + fav_rows if r and r[0] is not None]

    query = select(RecipeModel).where(RecipeModel.is_public == True)
    if preferred:
        query = query.where(RecipeModel.category.in_(preferred))
    query = query.order_by(RecipeModel.updated_at.desc()).limit(limit)
    recipes = (await db.execute(query)).scalars().all()

    if not recipes:
        recipes = (
            await db.execute(
                select(RecipeModel).where(RecipeModel.is_public == True).order_by(RecipeModel.updated_at.desc()).limit(limit)
            )
        ).scalars().all()
        
    return api_response(True, data=[RecipeResponse.model_validate(r).model_dump() for r in recipes])
