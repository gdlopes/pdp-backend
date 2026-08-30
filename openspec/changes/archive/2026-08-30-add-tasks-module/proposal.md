## Why

Action plans cannot be executed as a PDP: the `tasks` table already exists, but there is no API to add, inspect, start, complete, or remove work items. Auth is out of scope; tasks should still be born without copying the existing `userId`-in-the-request identity pattern, so a later auth change can add ownership checks instead of ripping a fake user id off the contract.

## What Changes

- Add a `tasks` NestJS module (controller, use-cases, DTOs, tests) following users and action-plans.
- Expose create, list, get-by-id, start, complete, and delete.
- Drive status through dedicated actions: create → `NOT_STARTED`, start → `IN_PROGRESS`, complete → `DONE`.
- Align `TasksEntity` with the existing `tasks` table (no new migration): table name, uuid PK, `actionPlanId` column plus relation, exported `TaskStatusEnum`, create/update date columns.
- Validate that the parent action plan exists on create and list; do not accept `userId` on any task endpoint.
- Export an action-plan lookup-by-id use-case from `ActionPlansModule` for that validation (no change to existing action-plan HTTP routes).

## Capabilities

### New Capabilities

- `tasks`: Create, list, get, start, complete, and delete tasks that belong to an action plan. Identity is the parent plan (`actionPlanId`), not a client-supplied `userId`. Status follows `NOT_STARTED` → `IN_PROGRESS` → `DONE`.

### Modified Capabilities

- None. There are no existing OpenSpec specs. Action-plan HTTP behavior is unchanged.

## Impact

- New module `src/modules/tasks/`, registered in `AppModule`.
- New public API: `POST /tasks`, `GET /tasks?actionPlanId=`, `GET /tasks/:id`, `POST /tasks/:id/start`, `POST /tasks/:id/complete`, `DELETE /tasks/:id`.
- `TasksEntity` mapping fixes in `src/database/entities/tasks.entity.ts`; existing migration `1745024081620-create-tasks-table` is reused.
- `ActionPlansModule` exports a by-id lookup so tasks does not reach the action-plans repository directly.
- Unit, controller, and e2e tests under `src/modules/tasks/` and `test/tasks/`.
- Docs (`docs/domain.md`, `docs/architecture.md`, `docs/api-conventions.md`) should list the new surface after implementation.
- No auth, login, JWT, or generic status PATCH.
