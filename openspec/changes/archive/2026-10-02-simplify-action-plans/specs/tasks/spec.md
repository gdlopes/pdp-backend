## MODIFIED Requirements

### Requirement: Create a task for an existing action plan

The system SHALL create a task when given an existing action plan identifier owned by the authenticated user and a description, and when that plan's status is `NOT_STARTED` or `IN_PROGRESS`. The create request MUST include `actionPlanId` and `description` and MUST NOT require a user identifier. The request MUST include a valid access token. A newly created task SHALL have status `NOT_STARTED`. Creating a task MUST NOT change the parent plan status. On success the system SHALL return HTTP 201 with a body containing the new task `id`. If the action plan does not exist or is owned by another user, the system SHALL NOT create a task, SHALL return HTTP 400, and SHALL use the message `Action plan does not exists.` in both cases. If the parent plan is `COMPLETED` or `ARCHIVED`, the system SHALL NOT create a task and SHALL return HTTP 400.

#### Scenario: Successful create

- **WHEN** an authenticated client sends `POST /tasks` with a valid `actionPlanId` they own, a `description`, and a parent plan whose status is `NOT_STARTED` or `IN_PROGRESS`
- **THEN** the system creates a task with status `NOT_STARTED` linked to that action plan
- **AND** the parent plan status is unchanged
- **AND** the response status is 201
- **AND** the response body is `{ id }` where `id` is the created task identifier

#### Scenario: Action plan does not exist

- **WHEN** an authenticated client sends `POST /tasks` with an `actionPlanId` that does not match any action plan
- **THEN** the system does not create a task
- **AND** the response status is 400
- **AND** the response message is `Action plan does not exists.`

#### Scenario: Action plan owned by another user

- **WHEN** an authenticated client sends `POST /tasks` with an `actionPlanId` that exists but is owned by another user
- **THEN** the system does not create a task
- **AND** the response status is 400
- **AND** the response message is `Action plan does not exists.`

#### Scenario: Create on a completed plan

- **WHEN** an authenticated client sends `POST /tasks` with an `actionPlanId` they own whose plan status is `COMPLETED`
- **THEN** the system does not create a task
- **AND** the plan status remains `COMPLETED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is completed.`

#### Scenario: Create on an archived plan

- **WHEN** an authenticated client sends `POST /tasks` with an `actionPlanId` they own whose plan status is `ARCHIVED`
- **THEN** the system does not create a task
- **AND** the plan status remains `ARCHIVED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is archived.`

#### Scenario: Create without a token

- **WHEN** a client sends `POST /tasks` with no Authorization header
- **THEN** the system does not create a task
- **AND** the response status is 401

### Requirement: List tasks for an existing action plan

The system SHALL return all tasks for a given action plan when that plan is owned by the authenticated user. The list request MUST include `actionPlanId` as a query parameter and MUST NOT require a user identifier. The request MUST include a valid access token. On success the system SHALL return HTTP 200 with an array of task objects. Each task object SHALL include `id`, `actionPlanId`, `description`, `status`, `createdAt`, and `updatedAt`. List SHALL succeed when the parent plan is `COMPLETED` or `ARCHIVED`. If the action plan does not exist or is owned by another user, the system SHALL return HTTP 400 and the message `Action plan does not exists.` in both cases.

#### Scenario: Successful list

- **WHEN** an authenticated client sends `GET /tasks?actionPlanId=` with an existing action plan identifier they own
- **THEN** the response status is 200
- **AND** the response body is an array of that plan's tasks (empty if none)

#### Scenario: List tasks of a completed or archived plan

- **WHEN** an authenticated client sends `GET /tasks?actionPlanId=` for a plan they own whose status is `COMPLETED` or `ARCHIVED`
- **THEN** the response status is 200
- **AND** the response body is an array of that plan's tasks

#### Scenario: Action plan does not exist

- **WHEN** an authenticated client sends `GET /tasks?actionPlanId=` with an identifier that does not match any action plan
- **THEN** the response status is 400
- **AND** the response message is `Action plan does not exists.`

#### Scenario: Action plan owned by another user

- **WHEN** an authenticated client sends `GET /tasks?actionPlanId=` with a plan owned by another user
- **THEN** the response status is 400
- **AND** the response message is `Action plan does not exists.`

#### Scenario: List without a token

- **WHEN** a client sends `GET /tasks?actionPlanId=` with no Authorization header
- **THEN** the response status is 401

### Requirement: Get a task by id

The system SHALL return a single task by identifier when the authenticated user owns the parent action plan. The get request MUST NOT require a user identifier. The request MUST include a valid access token. On success the system SHALL return HTTP 200 with the task object (`id`, `actionPlanId`, `description`, `status`, `createdAt`, `updatedAt`). Get SHALL succeed when the parent plan is `COMPLETED` or `ARCHIVED`. If the task does not exist or its parent plan is owned by another user, the system SHALL return HTTP 404 and the message `Task not found.` in both cases.

#### Scenario: Successful get

- **WHEN** an authenticated client sends `GET /tasks/:id` for an existing task whose action plan they own
- **THEN** the response status is 200
- **AND** the response body is that task object

#### Scenario: Get a task on a completed or archived plan

- **WHEN** an authenticated client sends `GET /tasks/:id` for a task they own whose parent plan status is `COMPLETED` or `ARCHIVED`
- **THEN** the response status is 200
- **AND** the response body is that task object

#### Scenario: Task does not exist

- **WHEN** an authenticated client sends `GET /tasks/:id` with an identifier that does not match any task
- **THEN** the response status is 404
- **AND** the response message is `Task not found.`

#### Scenario: Task owned by another user

- **WHEN** an authenticated client sends `GET /tasks/:id` for a task whose parent plan is owned by another user
- **THEN** the response status is 404
- **AND** the response message is `Task not found.`

#### Scenario: Get without a token

- **WHEN** a client sends `GET /tasks/:id` with no Authorization header
- **THEN** the response status is 401

### Requirement: Start a task

The system SHALL mark a task as in progress through a dedicated start operation, not a generic status update, when the authenticated user owns the parent action plan and that plan's status is `NOT_STARTED` or `IN_PROGRESS`. Starting a task MUST NOT require a user identifier. The request MUST include a valid access token. Start SHALL transition `NOT_STARTED` to `IN_PROGRESS`. Starting a task that is already `IN_PROGRESS` SHALL succeed and leave the task status `IN_PROGRESS`. Starting a task that is `DONE` SHALL fail. When a task is started and the parent plan status is `NOT_STARTED`, the system SHALL set the parent plan status to `IN_PROGRESS`. Starting a task MUST NOT move a plan from `IN_PROGRESS` back to `NOT_STARTED`. If the parent plan is `COMPLETED` or `ARCHIVED`, the system SHALL NOT change the task or plan status and SHALL return HTTP 400. On success the system SHALL return HTTP 200 with a body containing the task `id` and `status` set to `IN_PROGRESS`. If the task does not exist or its parent plan is owned by another user, the system SHALL return HTTP 404 and the message `Task not found.` in both cases.

#### Scenario: Successful start

- **WHEN** an authenticated client sends `POST /tasks/:id/start` for an existing task they own with status `NOT_STARTED` whose parent plan is `NOT_STARTED` or `IN_PROGRESS`
- **THEN** the task status becomes `IN_PROGRESS`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `IN_PROGRESS`

#### Scenario: Starting the first task starts the plan

- **WHEN** an authenticated client sends `POST /tasks/:id/start` for a `NOT_STARTED` task they own whose parent plan status is `NOT_STARTED`
- **THEN** the task status becomes `IN_PROGRESS`
- **AND** the parent plan status becomes `IN_PROGRESS`
- **AND** the response status is 200

#### Scenario: Start is idempotent while in progress

- **WHEN** an authenticated client sends `POST /tasks/:id/start` for a task they own whose status is already `IN_PROGRESS` and whose parent plan is `NOT_STARTED` or `IN_PROGRESS`
- **THEN** the task status remains `IN_PROGRESS`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `IN_PROGRESS`

#### Scenario: Cannot start a completed task

- **WHEN** an authenticated client sends `POST /tasks/:id/start` for a task they own whose status is `DONE` and whose parent plan is `NOT_STARTED` or `IN_PROGRESS`
- **THEN** the task status remains `DONE`
- **AND** the response status is 400
- **AND** the response message is `Task is already done.`

#### Scenario: Cannot start a task on a completed plan

- **WHEN** an authenticated client sends `POST /tasks/:id/start` for a task they own whose parent plan status is `COMPLETED`
- **THEN** the task status is unchanged
- **AND** the plan status remains `COMPLETED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is completed.`

#### Scenario: Cannot start a task on an archived plan

- **WHEN** an authenticated client sends `POST /tasks/:id/start` for a task they own whose parent plan status is `ARCHIVED`
- **THEN** the task status is unchanged
- **AND** the plan status remains `ARCHIVED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is archived.`

#### Scenario: Task does not exist

- **WHEN** an authenticated client sends `POST /tasks/:id/start` with an identifier that does not match any task
- **THEN** the response status is 404
- **AND** the response message is `Task not found.`

#### Scenario: Task owned by another user

- **WHEN** an authenticated client sends `POST /tasks/:id/start` for a task whose parent plan is owned by another user
- **THEN** the task status is unchanged
- **AND** the response status is 404
- **AND** the response message is `Task not found.`

#### Scenario: Start without a token

- **WHEN** a client sends `POST /tasks/:id/start` with no Authorization header
- **THEN** the task status is unchanged
- **AND** the response status is 401

### Requirement: Complete a task

The system SHALL mark a task as done through a dedicated complete operation, not a generic status update, when the authenticated user owns the parent action plan and that plan's status is `NOT_STARTED` or `IN_PROGRESS`. Completing a task MUST NOT require a user identifier. The request MUST include a valid access token. Complete SHALL transition `IN_PROGRESS` to `DONE`. Completing a task that is already `DONE` SHALL succeed and leave the task status `DONE` when the parent plan is still mutable. Completing a task that is `NOT_STARTED` SHALL fail. When a task becomes `DONE` and every other task on the same plan is `DONE`, and the parent plan status is `IN_PROGRESS`, the system SHALL set the parent plan status to `COMPLETED`. Completing a task MUST NOT move a plan from `IN_PROGRESS` back to `NOT_STARTED`. If the parent plan is `COMPLETED` or `ARCHIVED`, the system SHALL NOT change the task or plan status and SHALL return HTTP 400, including when the task is already `DONE`. On success the system SHALL return HTTP 200 with a body containing the task `id` and `status` set to `DONE`. If the task does not exist or its parent plan is owned by another user, the system SHALL return HTTP 404 and the message `Task not found.` in both cases.

#### Scenario: Successful complete

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` for an existing task they own with status `IN_PROGRESS` whose parent plan is `IN_PROGRESS` and at least one sibling task is not `DONE`
- **THEN** the task status becomes `DONE`
- **AND** the parent plan status remains `IN_PROGRESS`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `DONE`

#### Scenario: Completing the last remaining task completes the plan

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` for an `IN_PROGRESS` task they own whose parent plan is `IN_PROGRESS` and every other task on that plan is already `DONE`
- **THEN** the task status becomes `DONE`
- **AND** the parent plan status becomes `COMPLETED`
- **AND** the response status is 200

#### Scenario: Complete is idempotent

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` for a task they own whose status is already `DONE` and whose parent plan is `NOT_STARTED` or `IN_PROGRESS`
- **THEN** the task status remains `DONE`
- **AND** the parent plan status is unchanged
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `DONE`

#### Scenario: Cannot complete a task that has not been started

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` for a task they own whose status is `NOT_STARTED` and whose parent plan is `NOT_STARTED` or `IN_PROGRESS`
- **THEN** the task status remains `NOT_STARTED`
- **AND** the response status is 400
- **AND** the response message is `Task has not been started.`

#### Scenario: Cannot complete a task on a completed plan

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` for a task they own whose parent plan status is `COMPLETED`
- **THEN** the task status is unchanged
- **AND** the plan status remains `COMPLETED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is completed.`

#### Scenario: Cannot complete a task on an archived plan

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` for a task they own whose parent plan status is `ARCHIVED`
- **THEN** the task status is unchanged
- **AND** the plan status remains `ARCHIVED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is archived.`

#### Scenario: Task does not exist

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` with an identifier that does not match any task
- **THEN** the response status is 404
- **AND** the response message is `Task not found.`

#### Scenario: Task owned by another user

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` for a task whose parent plan is owned by another user
- **THEN** the task status is unchanged
- **AND** the response status is 404
- **AND** the response message is `Task not found.`

#### Scenario: Complete without a token

- **WHEN** a client sends `POST /tasks/:id/complete` with no Authorization header
- **THEN** the task status is unchanged
- **AND** the response status is 401

### Requirement: Delete a task

The system SHALL delete a task by identifier when the authenticated user owns the parent action plan and that plan's status is `NOT_STARTED` or `IN_PROGRESS`. The delete request MUST NOT require a user identifier. The request MUST include a valid access token. Deleting a task MUST NOT change the parent plan status, including when no tasks remain on an `IN_PROGRESS` plan. On success the system SHALL return HTTP 204 with an empty body. If the parent plan is `COMPLETED` or `ARCHIVED`, the system SHALL NOT remove the task and SHALL return HTTP 400. If the task does not exist or its parent plan is owned by another user, the system SHALL return HTTP 404 and the message `Task not found.` in both cases.

#### Scenario: Successful delete

- **WHEN** an authenticated client sends `DELETE /tasks/:id` for an existing task they own whose parent plan is `NOT_STARTED` or `IN_PROGRESS`
- **THEN** the system removes that task
- **AND** the parent plan status is unchanged
- **AND** the response status is 204
- **AND** the response body is empty

#### Scenario: Delete does not revert an in-progress plan

- **WHEN** an authenticated client sends `DELETE /tasks/:id` for the last remaining task on an `IN_PROGRESS` plan they own
- **THEN** the system removes that task
- **AND** the parent plan status remains `IN_PROGRESS`
- **AND** the response status is 204

#### Scenario: Cannot delete a task on a completed plan

- **WHEN** an authenticated client sends `DELETE /tasks/:id` for a task they own whose parent plan status is `COMPLETED`
- **THEN** the system does not remove that task
- **AND** the plan status remains `COMPLETED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is completed.`

#### Scenario: Cannot delete a task on an archived plan

- **WHEN** an authenticated client sends `DELETE /tasks/:id` for a task they own whose parent plan status is `ARCHIVED`
- **THEN** the system does not remove that task
- **AND** the plan status remains `ARCHIVED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is archived.`

#### Scenario: Task does not exist

- **WHEN** an authenticated client sends `DELETE /tasks/:id` with an identifier that does not match any task
- **THEN** the response status is 404
- **AND** the response message is `Task not found.`

#### Scenario: Task owned by another user

- **WHEN** an authenticated client sends `DELETE /tasks/:id` for a task whose parent plan is owned by another user
- **THEN** the system does not remove that task
- **AND** the response status is 404
- **AND** the response message is `Task not found.`

#### Scenario: Delete without a token

- **WHEN** a client sends `DELETE /tasks/:id` with no Authorization header
- **THEN** the system does not remove that task
- **AND** the response status is 401
