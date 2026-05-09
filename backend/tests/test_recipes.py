import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_read_main():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Recipe Manager API", "docs": "/docs"}

@pytest.mark.asyncio
async def test_create_and_get_recipe():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create recipe
        response = await ac.post("/api/v1/recipes/", json={
            "title": "Test Recipe",
            "instructions": "Test instructions",
            "servings": 2,
            "ingredients": [{"name": "Test Ingredient", "quantity": 1, "unit": "cup"}]
        })
        assert response.status_code == 201
        recipe_id = response.json()["id"]

        # Get recipe
        response = await ac.get(f"/api/v1/recipes/{recipe_id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Test Recipe"
