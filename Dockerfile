# ---- Stage 1: Build the React frontend ----
FROM node:20 AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Use npm install instead of npm ci to handle cross-platform lockfile differences
RUN npm install

# Copy source and build
COPY frontend/ ./
ENV VITE_API_URL="/api/v1"
RUN npm run build

# ---- Stage 2: Build the Python backend ----
FROM python:3.11 AS backend

WORKDIR /app

# Install Python dependencies using the production requirements (no PostgreSQL/dev packages)
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Set environment variables for the container (overrides .env file Windows paths)
ENV DATABASE_URL="sqlite+aiosqlite:////app/data/recipes.db"
ENV UPLOAD_DIR="/app/uploads"
ENV CORS_ORIGINS="*"
ENV SECRET_KEY="hf-spaces-recipe-manager-secret-key-change-me"
ENV COOKIE_SECURE="False"
ENV COOKIE_SAMESITE="lax"

# Copy backend source code
COPY backend/ ./

# Create required directories
RUN mkdir -p /app/static /app/data/uploads /app/data /app/uploads
COPY --from=frontend-builder /app/frontend/dist /app/static/

# HF Spaces requires port 7860
EXPOSE 7860

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
