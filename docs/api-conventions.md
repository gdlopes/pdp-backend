# API Conventions

REST endpoint patterns, naming, Swagger usage, and error handling for the PDP Backend.

## Route prefixes

Each feature module owns a top-level route prefix matching the domain name:

| Module | Controller prefix | Example |
|--------|-------------------|---------|
| users | `/users` | `POST /users` |
| auth | `/auth` | `POST /auth/login` |
| action-plans | `/action-plans` | `POST /action-plans` |
| tasks | `/tasks` | `POST /tasks` |
| healthcheck | `/healthcheck` | `GET /healthcheck` |

Use kebab-case for multi-word resources in URLs.

## Naming conventions

| Artifact | Pattern | Example |
|----------|---------|---------|
| Request DTO | `CreateXDto`, `UpdateXDto` | `CreateUserDto` |
| Response DTO (simple) | `CreateXResponseDto` | `CreateUserResponseDto` |
| Swagger response class | `CreateXResponse`, `GetXByIdResponse` | `CreateActionPlanResponse` |
| Use-case service | `CreateXService`, `GetXByIdService` | `CreateActionPlansService` |
| Controller | `XController` | `UsersController` |
| Module | `XModule` | `ActionPlansModule` |

Use-case files use kebab-case: `get-action-plan-by-id.service.ts`.

## HTTP methods and status codes

| Operation | Method | Success code | Notes |
|-----------|--------|--------------|-------|
| Create | `POST` | `201 Created` | Return created resource or `{ id }` |
| Read one | `GET` | `200 OK` | |
| Read list | `GET` | `200 OK` | Return array |
| Update | `PUT` or `PATCH` | `200 OK` | Not used yet |
| Delete | `DELETE` | `204 No Content` | Used by `DELETE /tasks/:id` |

### Error responses

Use NestJS built-in HTTP exceptions with **English** messages:

| Exception | Code | Example message |
|-----------|------|-----------------|
| `BadRequestException` | 400 | `User does not exists.` |
| `NotFoundException` | 404 | Action plan not found |
| `ConflictException` | 409 | `User already exists.` |
| `UnauthorizedException` | 401 | `Invalid credentials.` |

NestJS returns errors in the shape:

```json
{
  "statusCode": 409,
  "message": "User already exists."
}
```

## Response shapes

Return only fields the client needs. Never expose passwords or internal hashes.

| Endpoint | Response |
|----------|----------|
| `POST /users` | `{ id, email }` |
| `POST /auth/login` | `{ accessToken, tokenType: Bearer, expiresIn, user: { id, email } }` plus HttpOnly `refresh_token` cookie (`Path=/auth`) |
| `POST /auth/refresh` | Same JSON shape as login; rotates the refresh cookie |
| `POST /auth/logout` | Empty body (`204`) |
| `POST /action-plans` | `{ id }` |
| `GET /action-plans` | Array of the authenticated user's action plan objects |
| `GET /action-plans/:id` | Single action plan object |
| `POST /tasks` | `{ id }` |
| `GET /tasks?actionPlanId=` | Array of task objects (`id`, `actionPlanId`, `description`, `status`, `createdAt`, `updatedAt`) |
| `GET /tasks/:id` | Single task object |
| `POST /tasks/:id/start` | `{ id, status }` (`IN_PROGRESS`) |
| `POST /tasks/:id/complete` | `{ id, status }` (`DONE`) |
| `DELETE /tasks/:id` | Empty body (`204`) |

There is no `GET /users/me`, `GET /users/:id`, or `GET /users/email/:email`. The SPA gets `id` and `email` from login and refresh. Action-plan create/list/get do not accept a client `userId`; ownership comes from the access token.

For list/detail endpoints that return entities, define Swagger response classes in `swagger/` to document the full shape.

## Swagger / OpenAPI

### Controller decorators

Every controller should have:

```typescript
@Controller('resource-name')
@ApiTags('resource-name')
export class ResourceController {}
```

Every endpoint should have:

```typescript
@ApiOperation({ summary: 'Short description.' })
@ApiCreatedResponse({ ... })  // or ApiOkResponse, ApiNotFoundResponse, etc.
```

### DTO documentation

Request DTOs use `@ApiProperty` on every field with `description`, `example`, and `type` or `enum`:

```typescript
@ApiProperty({
  description: 'User e-mail.',
  example: 'user@email.com',
  type: String,
  required: true,
})
email: string;
```

### Response classes

For complex responses, create dedicated classes under `swagger/` (see `src/modules/action-plans/swagger/`):

- Base shape: `action-plan-response.swagger.ts`
- Per-endpoint wrappers: `create-action-plan-response.swagger.ts`, etc.
- Barrel export: `swagger/index.ts`

The users module uses inline `CreateUserResponseDto` in `dto/` — both patterns exist; prefer dedicated `swagger/` classes for responses with many fields.

### Runtime docs

Swagger UI: `http://localhost:3000/api/docs`

Configured in `src/main.ts` via `DocumentBuilder` and `SwaggerModule.setup('api/docs', ...)`.

## Validation

A global `ValidationPipe` is enabled in `configureApp` with `whitelist`, `forbidNonWhitelisted`, and `transform`. Request DTOs use `class-validator` decorators. Extra fields such as a spoofed `userId` on `POST /action-plans` are rejected with HTTP 400.

Protected routes require `Authorization: Bearer <accessToken>`. Swagger documents this via `addBearerAuth()`.

Login, refresh, and registration are rate-limited per IP (`429` when exceeded).

## New module checklist

When adding a new API domain (e.g. tasks):

### Files to create

```
src/database/entities/<name>.entity.ts
src/database/migrations/<timestamp>-create-<name>-table.ts
src/modules/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts
├── dto/
│   └── create-<domain>.dto.ts
├── swagger/                    # if responses are complex
│   └── ...
└── use-cases/
    ├── create-<domain>.service.ts
    ├── create-<domain>.service.spec.ts
    └── index.ts
```

### Wiring

- [ ] Register entity in `TypeOrmModule.forFeature()` in the module
- [ ] Add entity to `typeOrm.migration-config.ts` entities array
- [ ] Import module in `app.module.ts`
- [ ] Export use-cases needed by other modules

### Tests

- [ ] Unit spec per use-case (`src/modules/<domain>/use-cases/*.spec.ts`)
- [ ] Controller spec (`<domain>.controller.spec.ts`)
- [ ] E2E spec (`test/<domain>/*.e2e-spec.ts`) with shared harness

See [testing.md](./testing.md) for patterns.

### Documentation

- [ ] Update [domain.md](./domain.md) API surface table
- [ ] Swagger decorators on controller and DTOs

## Route ordering note

In NestJS, static path segments must be declared **before** parameterized routes to avoid conflicts.

Current action-plans routes:

```
POST /users
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /action-plans
GET  /action-plans
GET  /action-plans/:id
```

Current tasks routes:

```
POST   /tasks
GET    /tasks?actionPlanId=
GET    /tasks/:id
POST   /tasks/:id/start
POST   /tasks/:id/complete
DELETE /tasks/:id
```

The list endpoint is the collection (`GET /action-plans` / `GET /tasks`); the detail endpoint is `GET /:id`. Declare `@Get()` before `@Get(':id')`. When adding new routes, consider ordering carefully.

## Related docs

- [Architecture](./architecture.md) — module and use-case structure
- [Domain Model](./domain.md) — business rules and enums
- [Testing](./testing.md) — API test patterns
