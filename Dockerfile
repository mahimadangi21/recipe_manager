# ---- Stage 1: Build the React frontend ----
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Install dependencies first (cached layer)
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
ENV VITE_API_URL="/api/v1"
RUN npm run build

# ---- Stage 2: Build the Python backend ----
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system build tools needed for compiling Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Copy the built frontend into the static folder
RUN mkdir -p /app/static
COPY --from=frontend-builder /app/frontend/dist /app/static/

# Create uploads directory for images
RUN mkdir -p /app/uploads

# HF Spaces requires port 7860
EXPOSE 7860

# Start the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1"]
