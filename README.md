---
title: Recipe Manager
emoji: 🍔
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
---
# Recipe Manager Full-Stack Application

A comprehensive, full-stack Recipe Manager application featuring JWT authentication, social sharing capabilities, image uploads, and customizable recipe collections.

## Features
- **User Authentication**: Secure registration and login with JWT access and refresh tokens.
- **Recipe Management**: Create, read, update, and delete your own recipes. Include detailed instructions, cooking times, and categories.
- **Image Uploads**: Upload multiple images for your recipes.
- **Social Features**:
  - Review recipes and rate them out of 5 stars.
  - Favorite recipes to save them for later.
  - Copy public recipes into your own account to modify them.
  - Share unique links for public viewing.
- **Recipe Collections**: Organize recipes into public or private collections.
- **Dynamic Ingredient Scaling**: Easily scale ingredient quantities based on the number of servings.

## Tech Stack
### Backend
- **Python 3.11+**
- **FastAPI**
- **SQLAlchemy ORM** (with PostgreSQL backend)
- **Pydantic v2**
- **Alembic** (for database migrations)
- **python-jose** & **passlib[bcrypt]** (for JWT & Password Hashing)

### Frontend
- **React 18** (with Vite)
- **React Router v6**
- **Zustand** (Global state management)
- **Tailwind CSS v4**
- **Axios** (Configured with token refresh interceptors)
- **React Hook Form + Zod** (Validation)

---

## Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (Optional)

---

## Quick Start (Docker Compose)

1. Clone the repository and navigate to `recipe-manager/`.
2. Start the application:
   ```bash
   docker-compose up --build
   ```
3. Access the frontend at `http://localhost:5173`.
4. Access the backend API docs at `http://localhost:8000/docs`.

---

## Manual Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env if necessary

uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will be running at `http://localhost:5173`.

---

## API Endpoints Overview

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `PUT /api/v1/auth/me`

### Recipes
- `GET /api/v1/recipes/`
- `POST /api/v1/recipes/`
- `GET /api/v1/recipes/{id}`
- `PUT /api/v1/recipes/{id}`
- `DELETE /api/v1/recipes/{id}`
- `PATCH /api/v1/recipes/{id}/favorite`
- `POST /api/v1/recipes/{id}/copy`
- `GET /api/v1/recipes/shared/{token}`

### Images
- `POST /api/v1/recipes/{id}/images/`
- `GET /api/v1/recipes/{id}/images/`
- `DELETE /api/v1/recipes/{id}/images/{image_id}`
- `PATCH /api/v1/recipes/{id}/images/{image_id}/primary`

### Reviews
- `POST /api/v1/recipes/{id}/reviews/`
- `GET /api/v1/recipes/{id}/reviews/`
- `GET /api/v1/recipes/{id}/reviews/summary`

### Collections
- `GET /api/v1/collections/`
- `POST /api/v1/collections/`
- `POST /api/v1/collections/{id}/recipes?recipe_id={recipe_id}`

### Example cURL (Login)
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=yourpassword"
```

---

## Pages Overview

- **`/login` & `/register`**: Authentication entry points.
- **`/recipes`**: Home page to browse recipes.
- **`/recipes/:id`**: View full recipe details, reviews, and instructions.
- **`/recipes/new`**: Form to create a new recipe.
- **`/profile`**: Update username, bio, and avatar.
- **`/favorites`**: View saved recipes.
- **`/collections`**: Browse collections and create new ones.
- **`/r/:token`**: Public recipe share page.

---

## Environment Variables

| Variable | Location | Default / Description |
|---|---|---|
| `DATABASE_URL` | backend/.env | `postgresql+asyncpg://...` |
| `SECRET_KEY` | backend/.env | Used for JWT signing |
| `IMAGE_STORAGE` | backend/.env | `local` |
| `VITE_API_URL` | frontend/.env | `http://localhost:8000/api/v1` |

---

## Image Storage Setup
By default, the application uses local storage to save images inside `backend/uploads/`.
If you wish to switch to S3, set `IMAGE_STORAGE=s3` in your `.env` file and supply the necessary AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`).

---

## Running Tests
To run backend tests, activate the virtual environment and run:
```bash
cd backend
pytest
```

## Database Migrations (PostgreSQL)
Run Alembic migrations before starting the backend:
```bash
alembic upgrade head
```

---

## Contributing
Pull requests are welcome! Please ensure that any new features are covered by basic tests and adhere to the existing code style.
