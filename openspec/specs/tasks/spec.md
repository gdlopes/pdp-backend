# tasks Specification

## Purpose

Lets a client attach concrete work items to an action plan, inspect them, move them through not-started / in-progress / done, and remove them so a personal development plan can be executed.

## Requirements

### Requirement: Create a task for an existing action plan

The system SHALL create a task when given an existing action plan identifier and a description. The create request MUST include `actionPlanId` and `description` and MUST NOT require a user identifier. A newly created task SHALL have status `NOT_STARTED`. On success the system SHALL return HTTP 201 with a body containing the new task `id`.

#### Scenario: Successful create

- **WHEN** a client sends `POST /tasks` with a valid `actionPlanId` and a `description`
- **THEN** the system creates a task with status `NOT_STARTED` linked to that action plan
- **AND** the response status is 201
- **AND** the response body is `{ id }` where `id` is the created task identifier

#### Scenario: Action plan does not exist

- **WHEN** a client sends `POST /tasks` with an `actionPlanId` that does not match any action plan
- **THEN** the system does not create a task
- **AND** the response status is 400
- **AND** the response message is `Action plan does not exists.`

### Requirement: List tasks for an existing action plan

The system SHALL return all tasks for a given action plan. The list request MUST include `actionPlanId` as a query parameter and MUST NOT require a user identifier. On success the system SHALL return HTTP 200 with an array of task objects. Each task object SHALL include `id`, `actionPlanId`, `description`, `status`, `createdAt`, and `updatedAt`.

#### Scenario: Successful list

- **WHEN** a client sends `GET /tasks?actionPlanId=` with an existing action plan identifier
- **THEN** the response status is 200
- **AND** the response body is an array of that plan's tasks (empty if none)

#### Scenario: Action plan does not exist

- **WHEN** a client sends `GET /tasks?actionPlanId=` with an identifier that does not match any action plan
- **THEN** the response status is 400
- **AND** the response message is `Action plan does not exists.`

### Requirement: Get a task by id

The system SHALL return a single task by identifier. The get request MUST NOT require a user identifier. On success the system SHALL return HTTP 200 with the task object (`id`, `actionPlanId`, `description`, `status`, `createdAt`, `updatedAt`).

#### Scenario: Successful get

- **WHEN** a client sends `GET /tasks/:id` for an existing task
- **THEN** the response status is 200
- **AND** the response body is that task object

#### Scenario: Task does not exist

- **WHEN** a client sends `GET /tasks/:id` with an identifier that does not match any task
- **THEN** the response status is 404
- **AND** the response message is `Task not found.`

### Requirement: Start a task

The system SHALL mark a task as in progress through a dedicated start operation, not a generic status update. Starting a task MUST NOT require a user identifier. Start SHALL transition `NOT_STARTED` to `IN_PROGRESS`. Starting a task that is already `IN_PROGRESS` SHALL succeed and leave the status `IN_PROGRESS`. Starting a task that is `DONE` SHALL fail. On success the system SHALL return HTTP 200 with a body containing the task `id` and `status` set to `IN_PROGRESS`.

#### Scenario: Successful start

- **WHEN** a client sends `POST /tasks/:id/start` for an existing task with status `NOT_STARTED`
- **THEN** the task status becomes `IN_PROGRESS`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `IN_PROGRESS`

#### Scenario: Start is idempotent while in progress

- **WHEN** a client sends `POST /tasks/:id/start` for a task whose status is already `IN_PROGRESS`
- **THEN** the task status remains `IN_PROGRESS`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `IN_PROGRESS`

#### Scenario: Cannot start a completed task

- **WHEN** a client sends `POST /tasks/:id/start` for a task whose status is `DONE`
- **THEN** the task status remains `DONE`
- **AND** the response status is 400
- **AND** the response message is `Task is already done.`

#### Scenario: Task does not exist

- **WHEN** a client sends `POST /tasks/:id/start` with an identifier that does not match any task
- **THEN** the response status is 404
- **AND** the response message is `Task not found.`

### Requirement: Complete a task

The system SHALL mark a task as done through a dedicated complete operation, not a generic status update. Completing a task MUST NOT require a user identifier. Complete SHALL transition `IN_PROGRESS` to `DONE`. Completing a task that is already `DONE` SHALL succeed and leave the status `DONE`. Completing a task that is `NOT_STARTED` SHALL fail. On success the system SHALL return HTTP 200 with a body containing the task `id` and `status` set to `DONE`.

#### Scenario: Successful complete

- **WHEN** a client sends `POST /tasks/:id/complete` for an existing task with status `IN_PROGRESS`
- **THEN** the task status becomes `DONE`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `DONE`

#### Scenario: Complete is idempotent

- **WHEN** a client sends `POST /tasks/:id/complete` for a task whose status is already `DONE`
- **THEN** the task status remains `DONE`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `DONE`

#### Scenario: Cannot complete a task that has not been started

- **WHEN** a client sends `POST /tasks/:id/complete` for a task whose status is `NOT_STARTED`
- **THEN** the task status remains `NOT_STARTED`
- **AND** the response status is 400
- **AND** the response message is `Task has not been started.`

#### Scenario: Task does not exist

- **WHEN** a client sends `POST /tasks/:id/complete` with an identifier that does not match any task
- **THEN** the response status is 404
- **AND** the response message is `Task not found.`

### Requirement: Delete a task

The system SHALL delete a task by identifier. The delete request MUST NOT require a user identifier. On success the system SHALL return HTTP 204 with an empty body.

#### Scenario: Successful delete

- **WHEN** a client sends `DELETE /tasks/:id` for an existing task
- **THEN** the system removes that task
- **AND** the response status is 204
- **AND** the response body is empty

#### Scenario: Task does not exist

- **WHEN** a client sends `DELETE /tasks/:id` with an identifier that does not match any task
- **THEN** the response status is 404
- **AND** the response message is `Task not found.`
