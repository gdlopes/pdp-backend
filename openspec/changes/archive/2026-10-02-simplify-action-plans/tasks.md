## 1. Persistence

- [x] 1.1 Reshape `ActionPlansEntity`: export `ActionPlanStatusEnum` (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `ARCHIVED`); keep `title`, `specificGoal`, `resources`, `rewards`; rename `estimatedCompletionDate` → `deadline` and `progressTrackingMethod` → `successIndicator`; add `status`; drop coaching columns and the old level/review enums; verify the entity maps 1:1 to the new columns with no leftover worksheet fields
- [x] 1.2 Add a TypeORM migration that drops the coaching columns, renames `estimated_completion_date` → `deadline` and `progress_tracking_method` → `success_indicator`, and adds `status` varchar NOT NULL default `'NOT_STARTED'`; verify the migration up/down matches the entity and is picked up by the migration config

## 2. Create, list, and get payload

- [x] 2.1 Shrink `CreateActionPlanDto` to required `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, and `rewards` (no `status`, no coaching fields, no duplicated enums) and verify a unit or pipe-level check that a body with `status` or a dropped field is rejected
- [x] 2.2 Update `ActionPlanResponse` swagger to the six fields plus `id`, `userId`, `status`, `createdAt`, `updatedAt` using `ActionPlanStatusEnum` from the entity, and verify create/list/get swagger classes no longer document coaching fields
- [x] 2.3 Update `CreateActionPlansService` to persist only the new fields and set `status` to `NOT_STARTED`, and verify the unit spec covers success (`{ id }`, stored `NOT_STARTED`) and does not write a client `status`
- [x] 2.4 Update action-plan test mocks and `test/action-plans/seed.ts` (and any task seed that builds a plan) to the new fields with default `NOT_STARTED`, and verify create/list/get unit specs compile and assert the new shape

## 3. Plan start, complete, and archive

- [x] 3.1 Add a shared writable-plan assertion (400 `Action plan is completed.` / `Action plan is archived.`) in the action-plans module and verify a unit spec covers both terminal statuses
- [x] 3.2 Implement `StartActionPlanService` (`NOT_STARTED` → `IN_PROGRESS`, idempotent `IN_PROGRESS`, 400 on `COMPLETED`/`ARCHIVED` with the messages above, 404 via `GetActionPlanByIdService`) returning `{ id, status }`, export it from `ActionPlansModule`, and verify the unit spec covers those cases
- [x] 3.3 Implement `CompleteActionPlanService` (`IN_PROGRESS` → `COMPLETED` even when tasks remain, idempotent `COMPLETED`, 400 `Action plan has not been started.` from `NOT_STARTED`, 400 archived, 404 missing/foreign) with no tasks repository, export it from `ActionPlansModule`, and verify the unit spec covers those cases
- [x] 3.4 Implement `ArchiveActionPlanService` (`NOT_STARTED` / `IN_PROGRESS` / `COMPLETED` → `ARCHIVED`, idempotent `ARCHIVED`, 404 missing/foreign) and verify the unit spec covers archive from each source status plus missing/foreign; do not export it for tasks
- [x] 3.5 Wire `POST /action-plans/:id/start`, `/complete`, and `/archive` on `ActionPlansController` (keep `GET()` before `GET(':id')`) with Swagger and `{ id, status }` responses, and verify the controller spec delegates to the three use-cases

## 4. Task writes against plan status

- [x] 4.1 Update `CreateTaskService` to reject `COMPLETED`/`ARCHIVED` parents (400 messages above) without changing plan status on success, and verify the unit spec covers success on `NOT_STARTED`/`IN_PROGRESS` plus both terminal failures
- [x] 4.2 Update `StartTaskService` to load the plan via `FindActionPlanByIdService`, reject terminal plans, start the task, and call `StartActionPlanService` when the plan is `NOT_STARTED`; verify the unit spec covers first-task plan start, start on `IN_PROGRESS` (plan unchanged), terminal 400, and existing task-status cases
- [x] 4.3 Update `CompleteTaskService` to reject terminal plans (including already-`DONE` tasks), complete the task, count siblings, and call `CompleteActionPlanService` only when the plan is `IN_PROGRESS` and every task on that plan is `DONE`; verify the unit spec covers last-task plan complete, remaining siblings (plan stays `IN_PROGRESS`), terminal 400, and existing task-status cases
- [x] 4.4 Update `DeleteTaskService` to reject terminal plans and leave an `IN_PROGRESS` plan `IN_PROGRESS` when the last task is removed, and verify the unit spec covers success with unchanged plan status, last-task delete, and both terminal 400s

## 5. End-to-end tests

- [x] 5.1 Update `POST /action-plans` e2e for the six-field body, persisted `NOT_STARTED`, 400 when `status` or a coaching field is sent, and 401 without a token, and verify `npm run test:e2e -- test/action-plans/create-action-plans.e2e-spec.ts` passes
- [x] 5.2 Update list and get-by-id e2e so each plan object includes `id`, `userId`, `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, `rewards`, `status`, `createdAt`, and `updatedAt` (and get still 200 for completed/archived when seeded), and verify those e2e specs pass
- [x] 5.3 Add e2e for `POST /action-plans/:id/start`, `/complete`, and `/archive` (happy path, idempotent cases, illegal transitions, 404 missing/foreign, 401) and verify those specs pass
- [x] 5.4 Extend task e2e: create/start/complete/delete 400 on completed and archived plans; start of the first task sets the plan to `IN_PROGRESS`; complete of the last remaining task sets the plan to `COMPLETED`; delete of the last task leaves the plan `IN_PROGRESS`; list/get still 200 on terminal plans; and verify `npm run test:e2e -- test/tasks` and `npm run test:e2e -- test/action-plans` pass

## 6. Documentation

- [x] 6.1 Update `docs/domain.md`, `docs/architecture.md`, `docs/api-conventions.md`, and `docs/database.md` with the new plan fields, `ActionPlanStatusEnum`, start/complete/archive routes, terminal freeze, and task-driven forward transitions, and verify those docs match the shipped API (no coaching fields, no DTO/entity enum mismatch)
