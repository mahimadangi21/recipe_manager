# Build frontend
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ENV VITE_API_URL="/api/v1"
RUN npm run build

# Build backend
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Create static directory and copy frontend build
RUN mkdir -p /app/static
COPY --from=frontend-builder /app/frontend/dist /app/static/

# The application must listen on port 7860 for Hugging Face Spaces
EXPOSE 7860

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
