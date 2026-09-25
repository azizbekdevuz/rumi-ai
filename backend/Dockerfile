# RUMI AI Backend Dockerfile
# RAG pipeline: FAISS + Ollama (nomic-embed-text)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies.
# libgomp1 is required by faiss-cpu at runtime. gosu drops privileges after migrations.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        libgomp1 \
        gosu \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Root-owned entrypoint so the application user cannot replace it.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh

# Copy application code
COPY . .

# book_verse data is mounted via docker-compose volume at /app/book_verse

# Create media directory
RUN mkdir -p /app/media /app/logs \
    && chmod -R 755 /app/media /app/logs

# Create non-root user. The entrypoint starts as root, then execs uvicorn as appuser.
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app

# Expose port
EXPOSE 8000

# Readiness includes the database. RAG indexing continues in the background.
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD curl -f http://127.0.0.1:8000/health/ready || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
