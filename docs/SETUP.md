# Setup Guide

Current setup uses Spring Boot for the backend and Create React App for the frontend.

## Prerequisites

- Java 11
- Maven 3.8+
- Node.js 18+
- PostgreSQL 12+
- Docker optional

## Database

```bash
createdb case_management
```

Liquibase creates and updates tables when the backend starts with `RUN_MIGRATIONS_ON_STARTUP=true`.

## Backend

```bash
cd law-server
cp .env.example .env
set -a && source .env && set +a
mvn spring-boot:run
```

## Frontend

```bash
cd law-web
npm install
REACT_APP_API_BASE_URL=http://localhost:9000 PORT=3005 npm start
```

## Verify

```bash
cd law-server && mvn -q -DskipTests compile
cd ../law-web && npm run build
```
