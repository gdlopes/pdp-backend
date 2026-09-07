# action-plans Specification

## Purpose

Lets an authenticated user create and read their own personal development plans, with ownership taken from the access token instead of a client-supplied user id.

## Requirements

### Requirement: Create an action plan for the authenticated user

The system SHALL create an action plan with `POST /action-plans` for the user identified by a valid access token. The request body MUST NOT include `userId`. The stored plan MUST use that authenticated user as owner. On success the system SHALL return HTTP 201 with `{ id }`.

#### Scenario: Successful create

- **WHEN** an authenticated client sends `POST /action-plans` with a valid plan payload and no `userId` field
- **THEN** the system creates an action plan owned by that user
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

### Requirement: List action plans for the authenticated user

The system SHALL return all action plans owned by the authenticated user with `GET /action-plans`. The request MUST NOT require a `userId` query parameter. On success the system SHALL return HTTP 200 with an array of that user's action plan objects. Plans owned by other users MUST NOT appear.

#### Scenario: Successful list

- **WHEN** an authenticated client sends `GET /action-plans` with no `userId` query parameter
- **THEN** the response status is 200
- **AND** the body is an array of that user's action plans (empty if none)

#### Scenario: List without a token

- **WHEN** a client sends `GET /action-plans` with no Authorization header
- **THEN** the response status is 401

#### Scenario: List does not accept another user's id

- **WHEN** an authenticated client sends `GET /action-plans?userId=` with a different user's id
- **THEN** the response does not return that other user's plans
- **AND** the response is either HTTP 200 with only the authenticated user's plans or HTTP 400 for unexpected query input

### Requirement: Get an action plan by id when owned

The system SHALL return a single action plan with `GET /action-plans/:id` when the plan exists and is owned by the authenticated user. The request MUST NOT require a `userId` query parameter. On success the system SHALL return HTTP 200 with the action plan object. If the plan does not exist or is owned by another user, the system SHALL return HTTP 404 and MUST use the same error message in both cases so existence is not leaked.

#### Scenario: Successful get

- **WHEN** an authenticated client sends `GET /action-plans/:id` for a plan they own, with no `userId` query parameter
- **THEN** the response status is 200
- **AND** the body is that action plan object

#### Scenario: Get without a token

- **WHEN** a client sends `GET /action-plans/:id` with no Authorization header
- **THEN** the response status is 401

#### Scenario: Missing or foreign plan

- **WHEN** an authenticated client sends `GET /action-plans/:id` with an id that does not exist or that belongs to another user
- **THEN** the response status is 404
- **AND** the message is the same in both cases
