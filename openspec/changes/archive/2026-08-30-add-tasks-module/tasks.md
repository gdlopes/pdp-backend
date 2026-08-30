## 1. Persistence mapping

- [x] 1.1 Align `TasksEntity` with table `tasks` (`@Entity({ name: 'tasks' })`, uuid PK, `actionPlanId` column plus relation, exported `TaskStatusEnum`, `@CreateDateColumn` / `@UpdateDateColumn`) and verify the class maps 1:1 to `1745024081620-create-tasks-table` with no new migration

## 2. Action-plan lookup

- [x] 2.1 Add `FindActionPlanByIdService` (`execute(id)`, `400` + `Action plan does not exists.` when missing), export it from `ActionPlansModule` without changing `GetActionPlanByIdService`, and verify a unit spec covers found and missing

## 3. Tasks module skeleton

- [x] 3.1 Create `src/modules/tasks/` (module, controller stub, `CreateTaskDto`, create/start/complete response DTOs, swagger task response class, use-cases barrel), register `TypeOrmModule.forFeature([TasksEntity])`, import `ActionPlansModule`, and verify `TasksModule` compiles as a Nest module
- [x] 3.2 Import `TasksModule` in `AppModule` and verify the app module still compiles

## 4. Create task

- [x] 4.1 Implement `CreateTaskService` (validate plan via `FindActionPlanByIdService`, save with `NOT_STARTED`, return `{ id }`) and verify the unit spec covers success (no `save` on missing plan) and `400` when the plan does not exist

## 5. List and get task

- [x] 5.1 Implement `GetTasksByActionPlanIdService` (validate plan, return tasks for that `actionPlanId`) and verify the unit spec covers success (including empty list) and `400` when the plan does not exist
- [x] 5.2 Implement `GetTaskByIdService` (return the task, `404` + `Task not found.` when missing) and verify the unit spec covers success and not-found

## 6. Start task

- [x] 6.1 Implement `StartTaskService` (`NOT_STARTED` → `IN_PROGRESS`, idempotent if already `IN_PROGRESS`, `400` + `Task is already done.` if `DONE`, `404` + `Task not found.` when missing) and verify the unit spec covers success, idempotent start, already-done, and not-found

## 7. Complete task

- [x] 7.1 Implement `CompleteTaskService` (`IN_PROGRESS` → `DONE`, idempotent if already `DONE`, `400` + `Task has not been started.` if `NOT_STARTED`, `404` + `Task not found.` when missing) and verify the unit spec covers success, idempotent complete, not-started, and not-found

## 8. Delete task

- [x] 8.1 Implement `DeleteTaskService` (delete by id, `404` + `Task not found.` when missing) and verify the unit spec covers success and the not-found path

## 9. HTTP layer

- [x] 9.1 Wire `POST /tasks`, `GET /tasks?actionPlanId=`, `GET /tasks/:id`, `POST /tasks/:id/start`, `POST /tasks/:id/complete`, and `DELETE /tasks/:id` (`204`) on `TasksController` with Swagger decorators, `@Get()` before `@Get(':id')`, and no `userId`, and verify the controller spec asserts each use-case is called with the right arguments

## 10. End-to-end tests

- [x] 10.1 Add `test/tasks/` harness (setup, seed user + action plan, mocks) with entities `[UsersEntity, ActionPlansEntity, TasksEntity]` and verify setup boots like the action-plans e2e harness
- [x] 10.2 Add e2e for `POST /tasks` (201 `{ id }` as string uuid plus persisted `NOT_STARTED`; 400 `Action plan does not exists.`) and verify `npm run test:e2e -- test/tasks/create-tasks.e2e-spec.ts` passes
- [x] 10.3 Add e2e for `GET /tasks?actionPlanId=` (200 array including empty; 400 when plan missing) and `GET /tasks/:id` (200 task object; 404 `Task not found.`) and verify those e2e specs pass
- [x] 10.4 Add e2e for `POST /tasks/:id/start` (200 `IN_PROGRESS`; idempotent 200; 400 `Task is already done.`; 404) and verify the start e2e spec passes
- [x] 10.5 Add e2e for `POST /tasks/:id/complete` (200 `DONE` from `IN_PROGRESS`; idempotent 200; 400 `Task has not been started.`; 404) and verify the complete e2e spec passes
- [x] 10.6 Add e2e for `DELETE /tasks/:id` (204 empty body; 404 `Task not found.`) and verify the delete e2e spec passes

## 11. Documentation

- [x] 11.1 Update `docs/domain.md`, `docs/architecture.md`, and `docs/api-conventions.md` with the tasks API surface (create, list, get, start, complete, delete; lifecycle; no `userId`) and verify those docs match the shipped routes
