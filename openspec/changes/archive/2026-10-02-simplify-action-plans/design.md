## Context

See `proposal.md` for motivation and `specs/action-plans/spec.md` plus `specs/tasks/spec.md` for the HTTP contract.

Action plans today persist a 16-field coaching worksheet (`CreateActionPlanDto` / `ActionPlansEntity` / `action_plans`). List and get return that full entity. There is no plan `status` and no start/complete/archive routes. Tasks already use dedicated `POST /tasks/:id/start` and `/complete`, own `TaskStatusEnum` on the entity, and validate the parent plan through exported `FindActionPlanByIdService` (they must not import the action-plans repository). `GetTaskByIdService` loads `actionPlan` for ownership then strips it so GET `/tasks/:id` does not nest the plan. Global `ValidationPipe` uses `whitelist` and `forbidNonWhitelisted`, so unknown create fields (including `status` and dropped coaching keys) already become HTTP 400.

## Goals / Non-Goals

**Goals:**

- One exported `ActionPlanStatusEnum` on the entity, reused by DTO and swagger, so the old DTO-vs-entity enum split is not repeated.
- Plan status transitions live in action-plans use-cases. Tasks call those use-cases; they never write `action_plans` through TypeORM.
- Sibling-task counting for "last task done" stays in the tasks module (it already owns `TasksEntity`).
- Keep GET `/tasks/:id` free of a nested `actionPlan` without a second lookup style for HTTP vs mutations.

**Non-Goals:**

- PATCH/PUT of plan fields, unarchive, task due dates, structured rewards, SMART validation.
- Importing `TasksModule` into `ActionPlansModule` (would cycle: tasks already import action-plans).
- Data-preserving migration of existing coaching columns.

## Decisions

### 1. Destructive schema reshape in one migration

Replace the worksheet columns with the six objective fields plus `status`.

| Work | Detail |
|------|--------|
| Drop | `goal`, `alignment_with_life_career`, `motivation`, `current_level`, `expected_level`, `development_impact`, `learning_method`, `time_commitment`, `knowledge_application`, `review_commitment` |
| Rename | `estimated_completion_date` → `deadline`; `progress_tracking_method` → `success_indicator` |
| Add | `status` varchar, NOT NULL, default `'NOT_STARTED'` |

Use varchar for `status` (same as existing `current_level` in the original migration), not a Postgres enum type. Map it with `ActionPlanStatusEnum` on the entity (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `ARCHIVED`). Export that enum from `action-plans.entity.ts` the way `TaskStatusEnum` is exported.

Create DTO keeps only the six writable fields. `status` is not on the DTO; `forbidNonWhitelisted` rejects a client-supplied `status`. Create use-case sets `status` to `NOT_STARTED` before save.

Alternative considered: nullable dropped columns and a compatibility shim. Rejected — the payload is intentionally breaking and existing rows are not kept.

### 2. Dedicated plan transitions, shared with tasks

Mirror tasks. HTTP:

- `POST /action-plans/:id/start`
- `POST /action-plans/:id/complete`
- `POST /action-plans/:id/archive`

Each has a use-case that loads the owned plan via `GetActionPlanByIdService` (already `404` + `Action plan not found.` for missing/foreign) and returns `{ id, status }`.

Export the start and complete use-cases from `ActionPlansModule` so tasks can call `execute(userId, planId)` after a successful task mutation:

```
StartTaskService
  GetTaskByIdService (ownership)
  FindActionPlanByIdService(task.actionPlanId)  // status, after strip
  reject COMPLETED / ARCHIVED
  save task IN_PROGRESS
  if plan was NOT_STARTED -> StartActionPlanService.execute(userId, planId)

CompleteTaskService
  same load + reject terminal
  save task DONE
  if plan is IN_PROGRESS and no sibling remains not DONE
    -> CompleteActionPlanService.execute(userId, planId)
```

`CompleteActionPlanService` MUST NOT query tasks. If it did, action-plans would need the tasks repository or `TasksModule`, which is forbidden. "All tasks DONE" is decided in `CompleteTaskService` with `TasksEntity`.

`ArchiveActionPlanService` is not exported to tasks. Archive is user-only.

Idempotent HTTP complete on an already `COMPLETED` plan stays 200 (not a reverse). Task complete on a `COMPLETED` plan is 400 — the plan is frozen, including no-op retries.

Alternative considered: a single `SetActionPlanStatusService`. Rejected — start/complete/archive have different illegal-source statuses; separate use-cases match the tasks module and keep HTTP 400 messages local.

### 3. Frozen-plan check uses the existing plan lookup

Do not stop stripping `actionPlan` in `GetTaskByIdService` (GET would start returning a nested plan). Mutation use-cases already have `task.actionPlanId`; they reload with `FindActionPlanByIdService` (create already does this). Shared helper in action-plans, e.g. throw `400` + `Action plan is completed.` / `Action plan is archived.`, used by create/start/complete/delete tasks and by plan start/complete.

Create a task never calls start/complete on the plan.

Delete never calls start/complete on the plan; an `IN_PROGRESS` plan with zero tasks stays `IN_PROGRESS`.

### 4. Route order on the action-plans controller

Register `POST :id/start`, `:id/complete`, and `:id/archive` on the same controller as `GET :id`. Static suffixes on `:id` do not collide with `GET /action-plans` if `GET()` stays before `GET(':id')`. Follow the tasks controller pattern (`:id/start` before any overly greedy param if added later).

## Risks / Trade-offs

- **Last-task complete races two requests** → both may try to complete the plan; `CompleteActionPlanService` is idempotent on `COMPLETED`, so the second call is 200 at the plan layer. Task complete is sequenced after save; a unique constraint is unnecessary.
- **Idempotent task complete after the last task already completed the plan** → 400 `Action plan is completed.` instead of the old 200 no-op. SPA must treat that as "already done," not as a failed complete. Spec is explicit.
- **Destructive migration** → cannot roll back to coaching columns with data. Mitigation: no compatibility layer; revert is code + migration down only in environments without data that matters.
- **`forbidNonWhitelisted` rejects the old 16-field body** → intended breaking change; frontend must ship with the new contract.

## Migration Plan

1. Land API, entity, migration, and tests together.
2. Run the new TypeORM migration in each environment before traffic hits the new DTO.
3. Deploy backend before any SPA that still posts coaching fields (those requests will 400).
4. Down migration restores dropped columns as empty NOT NULL varchars only if the down script recreates them; treat down as dev-only.

## Open Questions

None. Reward remains a required string until a later change.
