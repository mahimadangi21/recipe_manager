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
