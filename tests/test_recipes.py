import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_create_recipe():
    response = client.post(
        "/api/v1/recipes/",
        json={
            "title": "Test Pasta",
            "description": "Yummy pasta",
            "instructions": "Boil pasta and eat",
            "servings": 4,
            "category": "dinner",
            "difficulty": "easy",
            "ingredients": [
                {"name": "Pasta", "quantity": 500, "unit": "g"}
            ]
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Pasta"
    assert len(data["ingredients"]) == 1
    assert data["total_time_minutes"] == 0

def test_duplicate_title_rejection():
    recipe_data = {
        "title": "Unique Pasta",
        "instructions": "Boil",
        "category": "dinner",
        "difficulty": "easy"
    }
    client.post("/api/v1/recipes/", json=recipe_data)
    response = client.post("/api/v1/recipes/", json=recipe_data)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]

def test_get_recipe_not_found():
    response = client.get("/api/v1/recipes/999")
    assert response.status_code == 404

def test_scale_recipe():
    # Create a recipe with 4 servings
    client.post(
        "/api/v1/recipes/",
        json={
            "title": "Scaling Recipe",
            "instructions": "Cook",
            "servings": 4,
            "category": "lunch",
            "difficulty": "easy",
            "ingredients": [
                {"name": "Water", "quantity": 100, "unit": "ml"}
            ]
        }
    )
    # Scale to 8 servings
    response = client.get("/api/v1/recipes/1/scale?servings=8")
    assert response.status_code == 200
    data = response.json()
    assert data["scale_factor"] == 2.0
    assert data["ingredients"][0]["quantity"] == 200.0

def test_filter_and_pagination():
    # Create multiple recipes
    for i in range(5):
        client.post(
            "/api/v1/recipes/",
            json={
                "title": f"Recipe {i}",
                "instructions": "...",
                "category": "breakfast" if i % 2 == 0 else "dinner",
                "difficulty": "easy",
                "is_favorite": i == 0
            }
        )
    
    # Filter by category
    response = client.get("/api/v1/recipes/?category=breakfast")
    assert len(response.json()) == 3
    
    # Filter by favorites
    response = client.get("/api/v1/recipes/?favorites=true")
    assert len(response.json()) == 1
    
    # Pagination
    response = client.get("/api/v1/recipes/?page_size=2")
    assert len(response.json()) == 2
