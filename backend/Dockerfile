FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# build-essential/libpq-dev -> psycopg2 ; libjpeg-dev/zlib1g-dev -> Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libjpeg-dev \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pas de COPY . . : le code est monté en volume par docker-compose (./backend:/app)
# pour le hot-reload. L'image ne contient que les dépendances Python installées.

EXPOSE 8000