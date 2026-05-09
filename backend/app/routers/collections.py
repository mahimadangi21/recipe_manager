from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.recipe import Recipe as RecipeModel
from app.models.collection import Collection as CollectionModel, collection_recipes
from app.schemas.collection import CollectionCreate, CollectionUpdate, CollectionResponse
from app.middleware.auth_middleware import get_current_user
from app.utils.responses import api_response

router = APIRouter(prefix="/collections", tags=["Collections"])

@router.get("/", response_model=List[CollectionResponse])
async def list_collections(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CollectionModel)
        .options(
            selectinload(CollectionModel.recipes).selectinload(RecipeModel.ingredients),
            selectinload(CollectionModel.recipes).selectinload(RecipeModel.images)
        )
        .where(CollectionModel.owner_id == current_user.id)
    )
    collections = result.scalars().unique().all()
    return api_response(True, data=[CollectionResponse.model_validate(c).model_dump() for c in collections])

@router.post("/", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(collection: CollectionCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    db_collection = CollectionModel(
        name=collection.name,
        description=collection.description,
        is_public=collection.is_public,
        owner_id=current_user.id
    )
    db.add(db_collection)
    await db.commit()
    result = await db.execute(
        select(CollectionModel)
        .options(
            selectinload(CollectionModel.recipes).selectinload(RecipeModel.ingredients),
            selectinload(CollectionModel.recipes).selectinload(RecipeModel.images)
        )
        .where(CollectionModel.id == db_collection.id)
    )
    return api_response(True, data=CollectionResponse.model_validate(result.scalar_one()).model_dump(), status_code=201)

@router.get("/{id}", response_model=CollectionResponse)
async def get_collection(id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CollectionModel).options(selectinload(CollectionModel.recipes).selectinload(RecipeModel.ingredients), selectinload(CollectionModel.recipes).selectinload(RecipeModel.images)).where(CollectionModel.id == id))
    collection = result.scalar_one_or_none()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    if not collection.is_public and collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this collection")
        
    return api_response(True, data=CollectionResponse.model_validate(collection).model_dump())

@router.put("/{id}", response_model=CollectionResponse)
async def update_collection(id: int, update_data: CollectionUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CollectionModel).options(selectinload(CollectionModel.recipes).selectinload(RecipeModel.ingredients), selectinload(CollectionModel.recipes).selectinload(RecipeModel.images)).where(CollectionModel.id == id))
    collection = result.scalar_one_or_none()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    if not current_user.is_admin and collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this collection")
        
    if update_data.name is not None:
        collection.name = update_data.name
    if update_data.description is not None:
        collection.description = update_data.description
    if update_data.is_public is not None:
        collection.is_public = update_data.is_public
        
    await db.commit()
    await db.refresh(collection)
    return api_response(True, data=CollectionResponse.model_validate(collection).model_dump(), message="Collection updated")

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CollectionModel).options(selectinload(CollectionModel.recipes).selectinload(RecipeModel.ingredients), selectinload(CollectionModel.recipes).selectinload(RecipeModel.images)).where(CollectionModel.id == id))
    collection = result.scalar_one_or_none()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    if not current_user.is_admin and collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this collection")
        
    await db.delete(collection)
    await db.commit()
    return api_response(True, message="Collection deleted")

@router.post("/{id}/recipes", status_code=status.HTTP_201_CREATED)
async def add_recipe_to_collection(id: int, recipe_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CollectionModel).options(selectinload(CollectionModel.recipes).selectinload(RecipeModel.ingredients), selectinload(CollectionModel.recipes).selectinload(RecipeModel.images)).where(CollectionModel.id == id))
    collection = result.scalar_one_or_none()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    if not current_user.is_admin and collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this collection")
        
    recipe_result = await db.execute(select(RecipeModel).where(RecipeModel.id == recipe_id))
    recipe = recipe_result.scalar_one_or_none()
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    if recipe in collection.recipes:
        raise HTTPException(status_code=409, detail="Recipe already in collection")
        
    collection.recipes.append(recipe)
    await db.commit()
    return api_response(True, message="Recipe added to collection")

@router.delete("/{id}/recipes/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_recipe_from_collection(id: int, recipe_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CollectionModel).options(selectinload(CollectionModel.recipes).selectinload(RecipeModel.ingredients), selectinload(CollectionModel.recipes).selectinload(RecipeModel.images)).where(CollectionModel.id == id))
    collection = result.scalar_one_or_none()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    if not current_user.is_admin and collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this collection")
        
    recipe_to_remove = next((r for r in collection.recipes if r.id == recipe_id), None)
    if not recipe_to_remove:
        raise HTTPException(status_code=404, detail="Recipe not in collection")
        
    collection.recipes.remove(recipe_to_remove)
    await db.commit()
    return api_response(True, message="Recipe removed from collection")

