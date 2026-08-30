## Context

See `proposal.md` for motivation and `specs/tasks/spec.md` for the HTTP contract.

The `tasks` table and `TasksEntity` already exist. Action-plans is the parent: create validates the user via an exported `GetUserByIdService`; tasks must do the same for the plan without importing the action-plans repository. `GetActionPlanByIdService` today requires `userId` plus `id` (the GET-by-id route). Tasks must not take `userId`, so that service cannot be reused as-is.

`TasksEntity` does not match the table: missing `@Entity({ name: 'tasks' })`, no `actionPlanId` column (relation only), `PrimaryGeneratedColumn()` without uuid, timestamps not using TypeORM date columns, `TaskStatusEnum` not exported. E2E uses `synchronize: true`, so a bad mapping would create the wrong table in tests while production still uses the migration. List/get need those fields mapped correctly; start/complete need the enum as a shared type.

## Goals / Non-Goals

**Goals:**

- Mirror the existing module layout (thin controller, one use-case per action, DTOs, unit + e2e tests).
- Keep identity on the parent plan so a future auth change can check `plan.userId === currentUser` without removing a task-level `userId`.
- Fix entity mapping to the existing table only — no schema migration.
- Use the full status enum through dedicated start/complete actions, not a generic PATCH.

**Non-Goals:**

- Auth, JWT, guards, or retrofitting action-plans/users.
- Nesting tasks inside `GET /action-plans/:id`.
- Generic `PATCH` of `status` or skipping `IN_PROGRESS`.
- Changing existing action-plan HTTP routes or `GetActionPlanByIdService(userId, id)`.

## Decisions

### 1. Top-level `/tasks` prefix, not nested under action-plans

Each module owns a kebab-case prefix (`/users`, `/action-plans`). Parent id goes in the body or query, same as `userId` on action-plans.

| Method | Path | Success |
|--------|------|---------|
| POST | `/tasks` | 201 `{ id }` |
| GET | `/tasks?actionPlanId=` | 200 task array |
| GET | `/tasks/:id` | 200 task object |
| POST | `/tasks/:id/start` | 200 `{ id, status }` |
| POST | `/tasks/:id/complete` | 200 `{ id, status }` |
| DELETE | `/tasks/:id` | 204 empty |

Declare `@Get()` before `@Get(':id')`. `POST :id/start` and `POST :id/complete` do not conflict with `GET :id` (different methods).

Alternative considered: `/action-plans/:actionPlanId/tasks`. Rejected — would split task HTTP across two controllers or break the one-prefix-per-module rule.

### 2. Status is a lifecycle, not a free PATCH

```
NOT_STARTED --start--> IN_PROGRESS --complete--> DONE
                              |                    ^
                              +-----complete-------+
```

- Create always sets `NOT_STARTED`.
- `POST /tasks/:id/start` sets `IN_PROGRESS`. Already `IN_PROGRESS` is a no-op success. `DONE` is `400` (`Task is already done.`).
- `POST /tasks/:id/complete` sets `DONE` from `IN_PROGRESS`. Already `DONE` is a no-op success. `NOT_STARTED` is `400` (`Task has not been started.`) so clients cannot skip start.

Alternative considered: complete from `NOT_STARTED` (start optional). Rejected — `IN_PROGRESS` would stay unused in practice. Alternative considered: `PATCH /tasks/:id` with `{ status }`. Rejected — would invite arbitrary transitions.

### 3. New action-plan lookup by id only

Add `FindActionPlanByIdService` in the action-plans module: `execute(id)` loads by id, throws `BadRequestException('Action plan does not exists.')` when missing (same 400 pattern as `GetUserByIdService`). Export it from `ActionPlansModule`. `CreateTaskService` and `GetTasksByActionPlanIdService` inject it; do not change `GetActionPlanByIdService`.

Alternative considered: `TypeOrmModule.forFeature([ActionPlansEntity])` inside tasks. Rejected — architecture forbids using another module's repository.

Get-by-id, start, complete, and delete only load the task. They do not re-validate the plan (FK already points at it; cascade delete is existing schema).

### 4. Align `TasksEntity` with the migration, do not migrate

In `src/database/entities/tasks.entity.ts` only (no new migration, no `ActionPlansEntity` reverse `OneToMany`):

- `@Entity({ name: 'tasks' })`
- `@PrimaryGeneratedColumn('uuid')`
- `actionPlanId` column (`action_plan_id`) plus `actionPlan` relation (same dual mapping as `userId` / `user` on action-plans)
- export `TaskStatusEnum`; type `status` with it
- `@CreateDateColumn` / `@UpdateDateColumn` for `created_at` / `updated_at`

Default status is set in `CreateTaskService`, not a new DB default. Map columns 1:1 with `1745024081620-create-tasks-table`.

Alternative considered: new migration for enum type / default / uuid generator. Rejected — the table already matches the intended contract; only the TypeORM class is wrong.

### 5. Response shapes

- Create: `{ id }` — request/response DTOs like users.
- Start / complete: `{ id, status }`.
- List / get: full task object — Swagger response class under `swagger/` (same pattern as action-plans list/detail), not a nested `actionPlan` entity.

### 6. Tests follow the existing harness

- Unit spec per use-case (happy path + primary error; start-when-done and complete-when-not-started included).
- Controller spec delegating to use-cases.
- E2E per route via `setupE2EApp`, entities `[UsersEntity, ActionPlansEntity, TasksEntity]`, seed user + action plan.
- Assert create `id` as a string uuid (do not copy the action-plans e2e `expect.any(Number)` bug).
- List returns `[]` for a plan with no tasks; get/list expose `status` so lifecycle can be asserted without a DB peek when practical.

## Risks / Trade-offs

- **Entity vs migration drift** → e2e `synchronize: true` will not catch a mismatch with the real migration. Mitigation: map columns 1:1 with `1745024081620-create-tasks-table`; no `synchronize` in production.
- **Anyone with an `actionPlanId` or task id can read/write tasks** → same class of gap as today's `userId` query param. Mitigation: no `userId` on the task contract so auth can add parent-plan ownership later without a breaking DTO change.
- **Must start before complete** → extra round-trip versus a two-state API. Accepted so `IN_PROGRESS` is observable via list/get.

## Migration Plan

No schema change. Deploy the module and entity mapping; run the existing tasks migration only in environments that have not applied it yet. Rollback is revert of the application code; the `tasks` table stays.
