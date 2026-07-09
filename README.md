# PDP Backend

API NestJS for **Personal Development Plans (PDP)** — create and manage development action plans and tasks.

## Documentation

- [Development](docs/development.md) — setup, commands, CI
- [Architecture](docs/architecture.md) — module structure and request flow
- [Domain Model](docs/domain.md) — business entities, enums, API surface
- [API Conventions](docs/api-conventions.md) — REST patterns, DTOs, Swagger
- [Database](docs/database.md) — TypeORM, migrations, naming
- [Testing](docs/testing.md) — unit and e2e test patterns

## Quick start

```bash
cp .env.example .env
npm ci
docker compose -f docker-compose.dev.yml up
```

API: `http://localhost:3000` · Swagger: `http://localhost:3000/api/docs`

## Stack

NestJS 11 · TypeScript · Fastify · PostgreSQL · TypeORM · Node 24
