## MODIFIED Requirements

### Requirement: Create an action plan for the authenticated user

The system SHALL create an action plan with `POST /action-plans` for the user identified by a valid access token. The request body MUST include `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, and `rewards`, and MUST NOT include `userId` or `status`. The stored plan MUST use that authenticated user as owner and MUST have status `NOT_STARTED`. On success the system SHALL return HTTP 201 with `{ id }`. If a required field is missing or empty, the system SHALL NOT create a plan and SHALL return HTTP 400.

#### Scenario: Successful create

- **WHEN** an authenticated client sends `POST /action-plans` with `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, and `rewards`, and no `userId` or `status` field
- **THEN** the system creates an action plan owned by that user with status `NOT_STARTED`
- **AND** the response status is 201
- **AND** the response body is `{ id }` where `id` is the created plan identifier

#### Scenario: Create without a token

- **WHEN** a client sends `POST /action-plans` with no Authorization header
- **THEN** the system does not create an action plan
- **AND** the response status is 401

#### Scenario: Create ignores a spoofed user id

- **WHEN** an authenticated client sends `POST /action-plans` with a `userId` field that is not their own id
- **THEN** the system does not assign ownership using that field
- **AND** either the request is rejected as invalid input (HTTP 400) or the created plan is owned by the authenticated user

#### Scenario: Create rejects a client-supplied status

- **WHEN** an authenticated client sends `POST /action-plans` with a `status` field
- **THEN** the system does not create a plan using that status
- **AND** either the request is rejected as invalid input (HTTP 400) or the created plan has status `NOT_STARTED`

#### Scenario: Create rejects a missing required field

- **WHEN** an authenticated client sends `POST /action-plans` without one of `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, or `rewards`
- **THEN** the system does not create an action plan
- **AND** the response status is 400

### Requirement: List action plans for the authenticated user

The system SHALL return all action plans owned by the authenticated user with `GET /action-plans`. The request MUST NOT require a `userId` query parameter. On success the system SHALL return HTTP 200 with an array of that user's action plan objects. Each object SHALL include `id`, `userId`, `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, `rewards`, `status`, `createdAt`, and `updatedAt`, and MUST NOT include dropped coaching fields (`goal`, `alignmentWithLifeCareer`, `motivation`, `currentLevel`, `expectedLevel`, `developmentImpact`, `learningMethod`, `timeCommitment`, `knowledgeApplication`, `reviewCommitment`). Plans owned by other users MUST NOT appear.

#### Scenario: Successful list

- **WHEN** an authenticated client sends `GET /action-plans` with no `userId` query parameter
- **THEN** the response status is 200
- **AND** the body is an array of that user's action plans (empty if none)
- **AND** each plan object includes `id`, `userId`, `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, `rewards`, `status`, `createdAt`, and `updatedAt`

#### Scenario: List without a token

- **WHEN** a client sends `GET /action-plans` with no Authorization header
- **THEN** the response status is 401

#### Scenario: List does not accept another user's id

- **WHEN** an authenticated client sends `GET /action-plans?userId=` with a different user's id
- **THEN** the response does not return that other user's plans
- **AND** the response is either HTTP 200 with only the authenticated user's plans or HTTP 400 for unexpected query input

### Requirement: Get an action plan by id when owned

The system SHALL return a single action plan with `GET /action-plans/:id` when the plan exists and is owned by the authenticated user. The request MUST NOT require a `userId` query parameter. On success the system SHALL return HTTP 200 with the action plan object (`id`, `userId`, `title`, `specificGoal`, `deadline`, `resources`, `successIndicator`, `rewards`, `status`, `createdAt`, `updatedAt`). If the plan does not exist or is owned by another user, the system SHALL return HTTP 404 and MUST use the same error message in both cases so existence is not leaked. Get SHALL succeed for `COMPLETED` and `ARCHIVED` plans the user owns.

#### Scenario: Successful get

- **WHEN** an authenticated client sends `GET /action-plans/:id` for a plan they own, with no `userId` query parameter
- **THEN** the response status is 200
- **AND** the body is that action plan object including `status`

#### Scenario: Get without a token

- **WHEN** a client sends `GET /action-plans/:id` with no Authorization header
- **THEN** the response status is 401

#### Scenario: Missing or foreign plan

- **WHEN** an authenticated client sends `GET /action-plans/:id` with an id that does not exist or that belongs to another user
- **THEN** the response status is 404
- **AND** the message is the same in both cases

#### Scenario: Get a completed or archived plan

- **WHEN** an authenticated client sends `GET /action-plans/:id` for a plan they own whose status is `COMPLETED` or `ARCHIVED`
- **THEN** the response status is 200
- **AND** the body includes that status

## ADDED Requirements

### Requirement: Start an action plan

The system SHALL mark an action plan as in progress through a dedicated start operation, not a generic status update, when the authenticated user owns the plan. Starting MUST NOT require a user identifier. The request MUST include a valid access token. Start SHALL transition `NOT_STARTED` to `IN_PROGRESS`. Starting a plan that is already `IN_PROGRESS` SHALL succeed and leave the status `IN_PROGRESS`. Starting a plan that is `COMPLETED` or `ARCHIVED` SHALL fail and MUST NOT change status. On success the system SHALL return HTTP 200 with a body containing the plan `id` and `status` set to `IN_PROGRESS`. If the plan does not exist or is owned by another user, the system SHALL return HTTP 404 and MUST use the same error message in both cases.

#### Scenario: Successful start

- **WHEN** an authenticated client sends `POST /action-plans/:id/start` for a plan they own with status `NOT_STARTED`
- **THEN** the plan status becomes `IN_PROGRESS`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `IN_PROGRESS`

#### Scenario: Start is idempotent while in progress

- **WHEN** an authenticated client sends `POST /action-plans/:id/start` for a plan they own whose status is already `IN_PROGRESS`
- **THEN** the plan status remains `IN_PROGRESS`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `IN_PROGRESS`

#### Scenario: Cannot start a completed plan

- **WHEN** an authenticated client sends `POST /action-plans/:id/start` for a plan they own whose status is `COMPLETED`
- **THEN** the plan status remains `COMPLETED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is completed.`

#### Scenario: Cannot start an archived plan

- **WHEN** an authenticated client sends `POST /action-plans/:id/start` for a plan they own whose status is `ARCHIVED`
- **THEN** the plan status remains `ARCHIVED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is archived.`

#### Scenario: Missing or foreign plan

- **WHEN** an authenticated client sends `POST /action-plans/:id/start` with an id that does not exist or that belongs to another user
- **THEN** the response status is 404
- **AND** the message is the same in both cases

#### Scenario: Start without a token

- **WHEN** a client sends `POST /action-plans/:id/start` with no Authorization header
- **THEN** the plan status is unchanged
- **AND** the response status is 401

### Requirement: Complete an action plan

The system SHALL mark an action plan as completed through a dedicated complete operation, not a generic status update, when the authenticated user owns the plan. Completing MUST NOT require a user identifier. The request MUST include a valid access token. Complete SHALL transition `IN_PROGRESS` to `COMPLETED` even if the plan still has tasks that are not `DONE`. Completing a plan that is already `COMPLETED` SHALL succeed and leave the status `COMPLETED`. Completing a plan that is `NOT_STARTED` SHALL fail. Completing a plan that is `ARCHIVED` SHALL fail and MUST NOT change status. On success the system SHALL return HTTP 200 with a body containing the plan `id` and `status` set to `COMPLETED`. If the plan does not exist or is owned by another user, the system SHALL return HTTP 404 and MUST use the same error message in both cases. `COMPLETED` is terminal: the system SHALL NOT later set a completed plan to `NOT_STARTED` or `IN_PROGRESS`.

#### Scenario: Successful complete

- **WHEN** an authenticated client sends `POST /action-plans/:id/complete` for a plan they own with status `IN_PROGRESS`
- **THEN** the plan status becomes `COMPLETED`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `COMPLETED`

#### Scenario: Complete does not require all tasks to be done

- **WHEN** an authenticated client sends `POST /action-plans/:id/complete` for an `IN_PROGRESS` plan they own that still has tasks that are not `DONE`
- **THEN** the plan status becomes `COMPLETED`
- **AND** the response status is 200

#### Scenario: Complete is idempotent

- **WHEN** an authenticated client sends `POST /action-plans/:id/complete` for a plan they own whose status is already `COMPLETED`
- **THEN** the plan status remains `COMPLETED`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `COMPLETED`

#### Scenario: Cannot complete a plan that has not been started

- **WHEN** an authenticated client sends `POST /action-plans/:id/complete` for a plan they own whose status is `NOT_STARTED`
- **THEN** the plan status remains `NOT_STARTED`
- **AND** the response status is 400
- **AND** the response message is `Action plan has not been started.`

#### Scenario: Cannot complete an archived plan

- **WHEN** an authenticated client sends `POST /action-plans/:id/complete` for a plan they own whose status is `ARCHIVED`
- **THEN** the plan status remains `ARCHIVED`
- **AND** the response status is 400
- **AND** the response message is `Action plan is archived.`

#### Scenario: Missing or foreign plan

- **WHEN** an authenticated client sends `POST /action-plans/:id/complete` with an id that does not exist or that belongs to another user
- **THEN** the response status is 404
- **AND** the message is the same in both cases

#### Scenario: Complete without a token

- **WHEN** a client sends `POST /action-plans/:id/complete` with no Authorization header
- **THEN** the plan status is unchanged
- **AND** the response status is 401

### Requirement: Archive an action plan

The system SHALL mark an action plan as archived through a dedicated archive operation, not a generic status update, when the authenticated user owns the plan. Archiving MUST NOT require a user identifier. The request MUST include a valid access token. Archive SHALL transition `NOT_STARTED`, `IN_PROGRESS`, or `COMPLETED` to `ARCHIVED`. Archiving a plan that is already `ARCHIVED` SHALL succeed and leave the status `ARCHIVED`. On success the system SHALL return HTTP 200 with a body containing the plan `id` and `status` set to `ARCHIVED`. If the plan does not exist or is owned by another user, the system SHALL return HTTP 404 and MUST use the same error message in both cases. `ARCHIVED` is terminal: the system SHALL NOT later set an archived plan to `NOT_STARTED`, `IN_PROGRESS`, or `COMPLETED`.

#### Scenario: Successful archive from not started or in progress

- **WHEN** an authenticated client sends `POST /action-plans/:id/archive` for a plan they own whose status is `NOT_STARTED` or `IN_PROGRESS`
- **THEN** the plan status becomes `ARCHIVED`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `ARCHIVED`

#### Scenario: Archive a completed plan

- **WHEN** an authenticated client sends `POST /action-plans/:id/archive` for a plan they own whose status is `COMPLETED`
- **THEN** the plan status becomes `ARCHIVED`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `ARCHIVED`

#### Scenario: Archive is idempotent

- **WHEN** an authenticated client sends `POST /action-plans/:id/archive` for a plan they own whose status is already `ARCHIVED`
- **THEN** the plan status remains `ARCHIVED`
- **AND** the response status is 200
- **AND** the response body is `{ id, status }` with `status` equal to `ARCHIVED`

#### Scenario: Missing or foreign plan

- **WHEN** an authenticated client sends `POST /action-plans/:id/archive` with an id that does not exist or that belongs to another user
- **THEN** the response status is 404
- **AND** the message is the same in both cases

#### Scenario: Archive without a token

- **WHEN** a client sends `POST /action-plans/:id/archive` with no Authorization header
- **THEN** the plan status is unchanged
- **AND** the response status is 401
