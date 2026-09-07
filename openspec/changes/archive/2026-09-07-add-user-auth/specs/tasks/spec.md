## MODIFIED Requirements

### Requirement: Create a task for an existing action plan

The system SHALL create a task when given an existing action plan identifier owned by the authenticated user and a description. The create request MUST include `actionPlanId` and `description` and MUST NOT require a user identifier. The request MUST include a valid access token. A newly created task SHALL have status `NOT_STARTED`. On success the system SHALL return HTTP 201 with a body containing the new task `id`. If the action plan does not exist or is owned by another user, the system SHALL NOT create a task, SHALL return HTTP 400, and SHALL use the message `Action plan does not exists.` in both cases.

#### Scenario: Successful create

- **WHEN** an authenticated client sends `POST /tasks` with a valid `actionPlanId` they own and a `description`
- **THEN** the system creates a task with status `NOT_STARTED` linked to that action plan
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

#### Scenario: Create without a token

- **WHEN** a client sends `POST /tasks` with no Authorization header
- **THEN** the system does not create a task
- **AND** the response status is 401

### Requirement: List tasks for an existing action plan

The system SHALL return all tasks for a given action plan when that plan is owned by the authenticated user. The list request MUST include `actionPlanId` as a query parameter and MUST NOT require a user identifier. The request MUST include a valid access token. On success the system SHALL return HTTP 200 with an array of task objects. Each task object SHALL include `id`, `actionPlanId`, `description`, `status`, `createdAt`, and `updatedAt`. If the action plan does not exist or is owned by another user, the system SHALL return HTTP 400 and the message `Action plan does not exists.` in both cases.

#### Scenario: Successful list

- **WHEN** an authenticated client sends `GET /tasks?actionPlanId=` with an existing action plan identifier they own
- **THEN** the response status is 200
- **AND** the response body is an array of that plan's tasks (empty if none)

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

The system SHALL return a single task by identifier when the authenticated user owns the parent action plan. The get request MUST NOT require a user identifier. The request MUST include a valid access token. On success the system SHALL return HTTP 200 with the task object (`id`, `actionPlanId`, `description`, `status`, `createdAt`, `updatedAt`). If the task does not exist or its parent plan is owned by another user, the system SHALL return HTTP 404 and the message `Task not found.` in both cases.

#### Scenario: Successful get

- **WHEN** an authenticated client sends `GET /tasks/:id` for an existing task whose action plan they own
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

The system SHALL mark a task as in progress through a dedicated start operation, not a generic status update, when the authenticated user owns the parent action plan. Starting a task MUST NOT require a user identifier. The request MUST include a valid access token. Start SHALL transition `NOT_STARTED` to `IN_PROGRESS`. Starting a task that is already `IN_PROGRESS` SHALL succeed and leave the status `IN_PROGRESS`. Starting a task that is `DONE` SHALL fail. On success the system SHALL return HTTP 200 with a body containing the task `id` and `status` set to `IN_PROGRESS`. If the task does not exist or its parent plan is owned by another user, the system SHALL return HTTP 404 and the message `Task not found.` in both cases.

#### Scenario: Successful start

- **WHEN** an authenticated client sends `POST /tasks/:id/start` for an existing task they own with status `NOT_STARTED`
- **THEN** the task status becomes `IN_PROGRESS`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `IN_PROGRESS`

#### Scenario: Start is idempotent while in progress

- **WHEN** an authenticated client sends `POST /tasks/:id/start` for a task they own whose status is already `IN_PROGRESS`
- **THEN** the task status remains `IN_PROGRESS`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `IN_PROGRESS`

#### Scenario: Cannot start a completed task

- **WHEN** an authenticated client sends `POST /tasks/:id/start` for a task they own whose status is `DONE`
- **THEN** the task status remains `DONE`
- **AND** the response status is 400
- **AND** the response message is `Task is already done.`

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

The system SHALL mark a task as done through a dedicated complete operation, not a generic status update, when the authenticated user owns the parent action plan. Completing a task MUST NOT require a user identifier. The request MUST include a valid access token. Complete SHALL transition `IN_PROGRESS` to `DONE`. Completing a task that is already `DONE` SHALL succeed and leave the status `DONE`. Completing a task that is `NOT_STARTED` SHALL fail. On success the system SHALL return HTTP 200 with a body containing the task `id` and `status` set to `DONE`. If the task does not exist or its parent plan is owned by another user, the system SHALL return HTTP 404 and the message `Task not found.` in both cases.

#### Scenario: Successful complete

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` for an existing task they own with status `IN_PROGRESS`
- **THEN** the task status becomes `DONE`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `DONE`

#### Scenario: Complete is idempotent

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` for a task they own whose status is already `DONE`
- **THEN** the task status remains `DONE`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `DONE`

#### Scenario: Cannot complete a task that has not been started

- **WHEN** an authenticated client sends `POST /tasks/:id/complete` for a task they own whose status is `NOT_STARTED`
- **THEN** the task status remains `NOT_STARTED`
- **AND** the response status is 400
- **AND** the response message is `Task has not been started.`

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

The system SHALL delete a task by identifier when the authenticated user owns the parent action plan. The delete request MUST NOT require a user identifier. The request MUST include a valid access token. On success the system SHALL return HTTP 204 with an empty body. If the task does not exist or its parent plan is owned by another user, the system SHALL return HTTP 404 and the message `Task not found.` in both cases.

#### Scenario: Successful delete

- **WHEN** an authenticated client sends `DELETE /tasks/:id` for an existing task they own
- **THEN** the system removes that task
- **AND** the response status is 204
- **AND** the response body is empty

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
