# ---- Stage 1: Build the React frontend ----
FROM node:20 AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Run the Python backend ----
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies for PostgreSQL and image processing
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Set environment variables
ENV DATABASE_URL=""
ENV DB_SSL="true"
ENV UPLOAD_DIR="/app/uploads"
ENV CORS_ORIGINS="*"
ENV SECRET_KEY="hf-spaces-recipe-manager-default-secret"
ENV COOKIE_SECURE="False"
ENV COOKIE_SAMESITE="lax"
ENV PORT=7860

# Copy backend source code
COPY backend/ ./

# Create required directories and copy frontend build
RUN mkdir -p /app/static /app/uploads
COPY --from=frontend-builder /app/frontend/dist /app/static/

# HF Spaces requires port 7860
EXPOSE 7860

# Start the application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
