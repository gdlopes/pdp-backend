## Why

Creating an action plan currently requires a 16-field coaching worksheet (alignment, motivation, skill levels, learning method, review cadence, and more). The product only needs an objective plan — title, goal, deadline, resources, success indicator, and reward — with SMART coaching on the frontend and the existing tasks API as the "what steps will you take?" step. The heavy payload blocks that simpler flow and still has known enum mismatches between DTO and entity.

## What Changes

- **BREAKING**: Shrink the action-plan create/list/get contract to `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, and `rewards` (all required on create). Drop coaching fields (`goal`, `alignmentWithLifeCareer`, `motivation`, `currentLevel`, `expectedLevel`, `developmentImpact`, `learningMethod`, `timeCommitment`, `knowledgeApplication`, `reviewCommitment`).
- Add plan lifecycle `status`: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `ARCHIVED`. Create does not accept `status`; the server sets `NOT_STARTED`.
- Add dedicated user transitions, same style as tasks: `POST /action-plans/:id/start`, `/complete`, `/archive`.
- Tasks remain the action step of the questionnaire. Starting the first task moves a `NOT_STARTED` plan to `IN_PROGRESS`. Completing the last remaining task moves an `IN_PROGRESS` plan to `COMPLETED`.
- `COMPLETED` and `ARCHIVED` are terminal: they cannot return to `NOT_STARTED` or `IN_PROGRESS`. Mutating tasks (create, start, complete, delete) on a terminal plan is rejected. Reads still succeed.
- `IN_PROGRESS` does not revert to `NOT_STARTED` if tasks are deleted.
- Archive is user-only. Archive from `COMPLETED` is allowed (another terminal, not a reverse).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `action-plans`: Replace the coaching payload with the six objective fields plus server-owned `status`. Add start, complete, and archive. `COMPLETED` and `ARCHIVED` are irreversible.
- `tasks`: Reject create/start/complete/delete when the parent plan is `COMPLETED` or `ARCHIVED`. Start and complete may move a mutable parent plan forward (`NOT_STARTED` → `IN_PROGRESS`, last task `DONE` → `COMPLETED`).

## Impact

- `action_plans` table: drop coaching columns; rename `estimated_completion_date` → `deadline` and `progress_tracking_method` → `success_indicator`; add `status`. New TypeORM migration. Destructive; existing rows are not preserved in a meaningful way.
- Entity, create DTO, swagger response, create/list/get use-cases and tests, e2e mocks.
- New action-plan use-cases and routes for start/complete/archive; exported status-transition use-cases for tasks (tasks must not import the action-plans repository).
- Task create/start/complete/delete use-cases, unit specs, and e2e: frozen-plan errors and plan-status sync.
- Docs: `docs/domain.md`, `docs/architecture.md`, `docs/api-conventions.md`, `docs/database.md`.
- Out of scope: generic PATCH of plan fields, unarchive/reopen, due dates on tasks, structured rewards, SMART validation on the backend, pagination.
