# Docker Setup

Root Docker Compose runs the current stack: PostgreSQL, Redis, Spring backend, and React frontend.

## Start

```bash
docker compose up -d --build
```

## Access

- Frontend: `http://localhost:3005`
- Backend: `http://localhost:9000`
- Swagger UI: `http://localhost:9000/swagger-ui.html`

## Logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## Stop

```bash
docker compose down
```

Clean volumes:

```bash
docker compose down -v
```
