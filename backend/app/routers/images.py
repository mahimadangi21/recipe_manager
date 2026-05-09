import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.recipe import Recipe as RecipeModel
from app.models.image import RecipeImage
from app.schemas.recipe import RecipeImageResponse
from app.middleware.auth_middleware import get_current_user
from app.utils.responses import api_response
from app.config import settings

router = APIRouter(prefix="/recipes/{recipe_id}/images", tags=["Images"])

@router.post("/", response_model=List[RecipeImageResponse])
async def upload_images(
    recipe_id: int, 
    files: List[UploadFile] = File(...), 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images allowed")
        
    result = await db.execute(select(RecipeModel).where(RecipeModel.id == recipe_id))
    recipe = result.scalar_one_or_none()
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    if recipe.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add images to this recipe")
        
    # Check current images count
    if len(recipe.images) + len(files) > 5:
        raise HTTPException(status_code=400, detail="Adding these images would exceed the limit of 5")
        
    uploaded_images = []
    
    for file in files:
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES.split(","):
            raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")
            
        file_ext = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        
        # Local storage handling
        user_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id), str(recipe_id))
        os.makedirs(user_dir, exist_ok=True)
        
        file_path = os.path.join(user_dir, file_name)
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            if len(content) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
                raise HTTPException(status_code=413, detail=f"File too large. Max {settings.MAX_IMAGE_SIZE_MB}MB")
            await out_file.write(content)
            
        # URL for frontend
        url = f"/uploads/{current_user.id}/{recipe_id}/{file_name}"
        
        is_primary = len(recipe.images) == 0 and len(uploaded_images) == 0
        
        db_image = RecipeImage(
            recipe_id=recipe_id,
            url=url,
            is_primary=is_primary,
            order=len(recipe.images) + len(uploaded_images)
        )
        db.add(db_image)
        uploaded_images.append(db_image)
        
    await db.commit()
    for img in uploaded_images:
        await db.refresh(img)
        
    return api_response(True, data=[RecipeImageResponse.model_validate(img).model_dump() for img in uploaded_images], message=f"Successfully uploaded {len(uploaded_images)} images")

@router.get("/", response_model=List[RecipeImageResponse])
async def list_images(recipe_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecipeImage).where(RecipeImage.recipe_id == recipe_id).order_by(RecipeImage.order))
    images = result.scalars().all()
    return api_response(True, data=[RecipeImageResponse.model_validate(img).model_dump() for img in images])

@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(recipe_id: int, image_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RecipeImage).where(RecipeImage.id == image_id, RecipeImage.recipe_id == recipe_id))
    image = result.scalar_one_or_none()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    result_recipe = await db.execute(select(RecipeModel).where(RecipeModel.id == recipe_id))
    recipe = result_recipe.scalar_one()
    
    if recipe.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this image")
        
    # Optional: Delete file from local storage
    if image.url.startswith("/uploads/"):
        file_path = image.url.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)
            
    await db.delete(image)
    await db.commit()
    return api_response(True, message="Image deleted")

@router.patch("/{image_id}/primary", response_model=RecipeImageResponse)
async def set_primary_image(recipe_id: int, image_id: int, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result_recipe = await db.execute(select(RecipeModel).where(RecipeModel.id == recipe_id))
    recipe = result_recipe.scalar_one_or_none()
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    if recipe.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(RecipeImage).where(RecipeImage.recipe_id == recipe_id))
    images = result.scalars().all()
    
    target_image = None
    for img in images:
        if img.id == image_id:
            img.is_primary = True
            target_image = img
        else:
            img.is_primary = False
            
    if not target_image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    await db.commit()
    await db.refresh(target_image)
    return api_response(True, data=RecipeImageResponse.model_validate(target_image).model_dump(), message="Primary image set")
