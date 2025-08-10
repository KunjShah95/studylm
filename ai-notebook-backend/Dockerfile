## Note: For production, prefer docker-compose with Dockerfile.backend and frontend-react/Dockerfile.frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend-react/package.json frontend-react/package-lock.json* ./
RUN npm ci || npm install
COPY frontend-react/ .
RUN npm run build

FROM python:3.11-slim AS backend
ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1
WORKDIR /app
# System deps for PyMuPDF/faiss and healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential libglib2.0-0 libxrender1 libxext6 libsm6 curl tesseract-ocr \
	&& rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Copy built frontend into expected dist path expected by the app
COPY --from=frontend /app/frontend/dist ./frontend-react/dist
# Ensure runtime dirs exist and are writable
RUN mkdir -p /app/uploads /app/vector_store
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -fsS http://127.0.0.1:8000/health || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
