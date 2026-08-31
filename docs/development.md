# Development

Guide for running and operating the PDP Backend locally.

## Prerequisites

- **Node.js 24+** — version pinned in [`.nvmrc`](../.nvmrc)
- **npm** — comes with Node
- **Docker** — required for `docker compose` and e2e tests (Testcontainers)

## Environment variables

Copy the example file and adjust values for your environment:

```bash
cp .env.example .env
```

| Variable | Description | Docker Compose default |
|----------|-------------|------------------------|
| `DATABASE_HOST` | PostgreSQL host | `postgres` (inside compose) or `localhost` (local API) |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USERNAME` | Database user | `postgres` |
| `DATABASE_PASSWORD` | Database password | `root` |
| `DATABASE_NAME` | Database name | `pdp-api` |

When running the API **inside** Docker Compose, use `DATABASE_HOST=postgres` (the service name). When running the API **on the host** against the compose database, use `DATABASE_HOST=localhost`.

## Running with Docker Compose (recommended)

Starts PostgreSQL and the API with hot reload:

```bash
docker compose -f docker-compose.dev.yml up
```

The compose file:

- Starts Postgres 16 on port `5432`
- Builds the API from the `development` Docker target
- Runs `npm install`, `migration:run`, and `start:dev` on startup
- Exposes the API on port `3000`

## Running locally (without Docker for the API)

1. Start only the database:

```bash
docker compose -f docker-compose.dev.yml up postgres -d
```

2. Install dependencies and run migrations:

```bash
npm ci
npm run migration:run
```

3. Start the dev server:

```bash
npm run start:dev
```

The API listens on `http://localhost:3000`.

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with watch mode |
| `npm run start:debug` | Start with debugger |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled app (`node dist/main`) |
| `npm test` | Unit tests |
| `npm run test:e2e` | E2E tests (requires Docker) |
| `npm run test:cov` | Unit tests with coverage |
| `npm run lint` | ESLint (check only; does not rewrite files) |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run format` | Prettier |

## Database migrations

```bash
# Create a new migration (replace <name> with a descriptive slug)
npm run migration:create --name=<name>

# Apply pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

See [database.md](./database.md) for conventions and workflow details.

## API documentation

Swagger UI is available at runtime:

```
http://localhost:3000/api/docs
```

There is no committed OpenAPI file — the spec is generated from decorators at startup.

## Commits

This repository uses [Conventional Commits](https://www.conventionalcommits.org/). Use `git commit` as usual. A `commit-msg` hook (installed by `npm ci` / `npm install` via `simple-git-hooks`) runs commitlint and rejects subjects that do not match `type(optional-scope): summary`. Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Do not skip the hook (`--no-verify`). After a fresh clone, run `npm ci` so the hook is present.

## CI

Pull requests to `main` trigger [`.github/workflows/ci.yaml`](../.github/workflows/ci.yaml). Jobs run in parallel:

1. `npm run lint` (check only; does not rewrite files)
2. `npm test` (unit tests)
3. `npm run test:e2e` (Testcontainers; Docker on the runner)
4. `npm run build`

Any failing job fails the workflow.

## Production build

Multi-stage [Dockerfile](../Dockerfile):

- `development` — hot reload for local/docker dev
- `builder` — compiles TypeScript
- `production` — minimal image running `node dist/main.js`

```bash
docker build --target production -t pdp-backend .
```
