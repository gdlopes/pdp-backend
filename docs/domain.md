# Domain Model

Business concepts, data relationships, and current API behavior for the PDP (Personal Development Plan) system.

## Glossary

| Term | Description |
|------|-------------|
| **PDP / Action Plan** | A personal development plan with a title, specific goal, deadline, resources, success indicator, reward, and lifecycle status |
| **User** | Account owner who creates and owns action plans |
| **Task** | A concrete action item linked to an action plan, tracked by status |

## Entity relationships

```mermaid
erDiagram
  Users ||--o{ ActionPlans : owns
  Users ||--o{ RefreshTokens : has
  ActionPlans ||--o{ Tasks : contains

  Users {
    uuid id PK
    string email UK
    string password_hash
    timestamp created_at
    timestamp updated_at
  }

  RefreshTokens {
    uuid id PK
    uuid user_id FK
    string token_hash UK
    uuid family_id
    timestamp expires_at
    timestamp revoked_at
    uuid replaced_by_id
    timestamp created_at
  }

  ActionPlans {
    uuid id PK
    uuid user_id FK
    string title
    string specific_goal
    timestamp deadline
    string resources
    string success_indicator
    string rewards
    enum status
    timestamp created_at
    timestamp updated_at
  }

  Tasks {
    uuid id PK
    uuid action_plan_id FK
    string description
    enum status
    timestamp created_at
    timestamp updated_at
  }
```

Foreign keys:

- `action_plans.user_id` → `users.id`
- `tasks.action_plan_id` → `action_plans.id` (CASCADE on delete)
- `refresh_tokens.user_id` → `users.id` (CASCADE on delete)

## Enums

### ActionPlanStatusEnum

Lifecycle of an action plan. `COMPLETED` and `ARCHIVED` are terminal.

| Value | Meaning |
|-------|---------|
| `NOT_STARTED` | Created; no work started |
| `IN_PROGRESS` | User started the plan or the first task was started |
| `COMPLETED` | User completed the plan or every task is `DONE` |
| `ARCHIVED` | User archived the plan (from any prior status) |

Defined in: `src/database/entities/action-plans.entity.ts` (reused by swagger; not accepted on create)

### TaskStatusEnum

| Value | Meaning |
|-------|---------|
| `NOT_STARTED` | Task not yet begun |
| `IN_PROGRESS` | Task in active work |
| `DONE` | Task completed |

Defined in: `src/database/entities/tasks.entity.ts`

## Domain rules (current behavior)

### Users

| Rule | Detail |
|------|--------|
| Email uniqueness | Duplicate email returns `409 Conflict` with message `User already exists.` |
| Password storage | Hashed with async bcrypt (cost 12) on create; never returned in API responses |
| Create response | Returns `{ id, email }` only |
| Public lookups | `GET /users/:id`, `GET /users/email/:email`, and `GET /users/me` are not exposed |
| Identity for the SPA | Returned as `user: { id, email }` on `POST /auth/login` and `POST /auth/refresh` |

### Auth

Sequence diagrams for login, protected requests, refresh/reuse, and logout are in [architecture.md](./architecture.md#authentication-flow).

| Rule | Detail |
|------|--------|
| Login | `POST /auth/login` with email/password; 200 with access JWT + `user`; refresh cookie set |
| Invalid login | Unknown email and wrong password both return `401` with `Invalid credentials.` |
| Access token | Bearer JWT, at most 900 seconds, payload `sub`/`iss`/`aud`/`iat`/`exp` |
| Refresh cookie | HttpOnly, `Path=/auth`, SameSite/Secure from env, opaque (not a JWT), max 7 days |
| Refresh | `POST /auth/refresh` rotates the cookie and returns a new access token + `user` |
| Reuse | Replaying a rotated refresh token revokes the family and returns 401 |
| Logout | `POST /auth/logout` revokes the family, clears the cookie, returns 204 |
| Public routes | `GET /healthcheck`, `POST /users`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |

### Action Plans

| Rule | Detail |
|------|--------|
| Owner | Taken from the access token; the body/query must not supply `userId` |
| Create fields | `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, `rewards` (all required). `status` is not accepted |
| Create status | Server sets `NOT_STARTED`; response is `{ id }` |
| List / get | Return `id`, `userId`, `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, `rewards`, `status`, `createdAt`, `updatedAt` |
| Get by id | Missing and foreign plans both `404` with `Action plan not found.` Reads succeed for `COMPLETED` and `ARCHIVED` |
| Start | `POST /action-plans/:id/start` sets `IN_PROGRESS`; already `IN_PROGRESS` is idempotent; `COMPLETED`/`ARCHIVED` return `400` |
| Complete | `POST /action-plans/:id/complete` sets `COMPLETED` from `IN_PROGRESS` even if tasks remain; already `COMPLETED` is idempotent; `NOT_STARTED` returns `400` `Action plan has not been started.`; `ARCHIVED` returns `400` |
| Archive | `POST /action-plans/:id/archive` sets `ARCHIVED` from any status; already `ARCHIVED` is idempotent |
| Terminal | `COMPLETED` and `ARCHIVED` cannot return to `NOT_STARTED` or `IN_PROGRESS` |

### Tasks

| Rule | Detail |
|------|--------|
| Parent plan must exist and be owned | `actionPlanId` is validated; foreign plans use the same errors as missing |
| Missing or foreign plan | Create/list return `400` with `Action plan does not exists.` |
| No user identifier | Task endpoints do not accept `userId`; ownership is the parent plan + access token |
| Create | Status is `NOT_STARTED`; response is `{ id }`; does not change plan status |
| Frozen parent | Create/start/complete/delete on `COMPLETED` or `ARCHIVED` plans return `400` (`Action plan is completed.` / `Action plan is archived.`). List/get still succeed |
| Start | `POST /tasks/:id/start` sets task `IN_PROGRESS`; already `IN_PROGRESS` is idempotent; `DONE` returns `400` with `Task is already done.`; first start on a `NOT_STARTED` plan sets the plan to `IN_PROGRESS` |
| Complete | `POST /tasks/:id/complete` sets `DONE` from `IN_PROGRESS`; already `DONE` is idempotent only while the plan is mutable; `NOT_STARTED` returns `400` with `Task has not been started.`; last remaining `DONE` task on an `IN_PROGRESS` plan sets the plan to `COMPLETED` |
| Missing or foreign task | Get, start, complete, and delete return `404` with `Task not found.` |
| Delete | Returns `204 No Content`; does not revert an `IN_PROGRESS` plan to `NOT_STARTED` |

### Healthcheck

| Rule | Detail |
|------|--------|
| Response | `GET /healthcheck` returns `{ health: 'ok' }` |

## API surface (as-is)

| Domain | Method | Route | Status codes |
|--------|--------|-------|--------------|
| healthcheck | `GET` | `/healthcheck` | `200` |
| users | `POST` | `/users` | `201`, `409`, `429` |
| auth | `POST` | `/auth/login` | `200`, `400`, `401`, `429` |
| auth | `POST` | `/auth/refresh` | `200`, `401`, `429` |
| auth | `POST` | `/auth/logout` | `204` |
| action-plans | `POST` | `/action-plans` | `201`, `400`, `401` |
| action-plans | `GET` | `/action-plans` | `200`, `401` |
| action-plans | `GET` | `/action-plans/:id` | `200`, `401`, `404` |
| action-plans | `POST` | `/action-plans/:id/start` | `200`, `400`, `401`, `404` |
| action-plans | `POST` | `/action-plans/:id/complete` | `200`, `400`, `401`, `404` |
| action-plans | `POST` | `/action-plans/:id/archive` | `200`, `401`, `404` |
| tasks | `POST` | `/tasks` | `201`, `400`, `401` |
| tasks | `GET` | `/tasks?actionPlanId=` | `200`, `400`, `401` |
| tasks | `GET` | `/tasks/:id` | `200`, `401`, `404` |
| tasks | `POST` | `/tasks/:id/start` | `200`, `400`, `401`, `404` |
| tasks | `POST` | `/tasks/:id/complete` | `200`, `400`, `401`, `404` |
| tasks | `DELETE` | `/tasks/:id` | `204`, `401`, `404` |

Interactive documentation: `http://localhost:3000/api/docs`

## Known inconsistencies

Document these so agents do not copy incorrect patterns:

| Issue | Location | Detail |
|-------|----------|--------|
| Action plan `id` mapping | Entity vs migration | Entity uses `@PrimaryGeneratedColumn()` without uuid; migrations use UUID |

## Planned areas (not yet specified)

These are implied by the schema or product direction but have no API or OpenSpec requirements yet:

- Pagination for list endpoints

When implementing any of these, start with a focused change spec (future OpenSpec workflow) rather than expanding this document with implementation details.

## Related docs

- [Architecture](./architecture.md) — how modules implement this domain
- [API Conventions](./api-conventions.md) — endpoint and response patterns
- [Database](./database.md) — table and migration details
