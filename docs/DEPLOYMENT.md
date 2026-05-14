# Deployment Guide

Deploy backend and frontend as separate services.

## Backend

Build:

```bash
cd law-server
mvn clean package
```

Run:

```bash
java -jar target/law-server-1.0.0.jar
```

Production must configure PostgreSQL, stable RSA JWT keys, CORS origins, upload storage, and HTTPS.

## Frontend

Build with the production API URL:

```bash
cd law-web
REACT_APP_API_BASE_URL=https://api.example.com npm run build
```

Publish the `build/` directory to your static host.

## Docker

```bash
docker compose up -d --build
```

The root compose file starts PostgreSQL, Redis, backend, and frontend.
