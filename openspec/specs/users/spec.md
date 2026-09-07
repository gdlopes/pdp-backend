# users Specification

## Purpose

Lets a person create an account with email and password without exposing lookup-by-id or lookup-by-email. Authenticated identity (`id` and `email`) is returned on login and refresh, not on a users GET.

## Requirements

### Requirement: Public registration

The system SHALL create a user with `POST /users` when the body includes a unique email and a password. This route MUST NOT require an access token. On success the system SHALL return HTTP 201 with `{ id, email }` and MUST NOT return the password or password hash. The password MUST be stored only as a one-way hash. Duplicate email MUST return HTTP 409 with message `User already exists.`

#### Scenario: Successful registration

- **WHEN** a client sends `POST /users` with an unused email and a password and no Authorization header
- **THEN** the response status is 201
- **AND** the body is `{ id, email }` for the new user
- **AND** the body does not include `password` or `passwordHash`

#### Scenario: Duplicate email

- **WHEN** a client sends `POST /users` with an email that is already registered
- **THEN** the response status is 409
- **AND** the response message is `User already exists.`

### Requirement: Registration is rate limited

The system SHALL rate-limit `POST /users` per client IP. When the limit is exceeded the system SHALL return HTTP 429 and MUST NOT create a user.

#### Scenario: Too many registrations

- **WHEN** a client exceeds the registration rate limit from the same IP
- **THEN** the response status is 429
- **AND** no new user is created

### Requirement: Public user lookup routes are removed

The system MUST NOT expose `GET /users/email/:email`, `GET /users/:id`, or `GET /users/me`. A client MUST NOT be able to retrieve another user's profile by id or email. The authenticated user's `id` and `email` SHALL be returned on `POST /auth/login` and `POST /auth/refresh` instead of a users GET.

#### Scenario: Lookup by email is gone

- **WHEN** a client sends `GET /users/email/{email}` for a registered email, with or without an access token
- **THEN** the system does not return that user's profile as the previous public lookup did
- **AND** the response is not HTTP 200 with `{ id, email }` for that user

#### Scenario: Lookup by id is gone

- **WHEN** a client sends `GET /users/{id}` for an existing user id, with or without an access token
- **THEN** the system does not return that user's profile as the previous public lookup did
- **AND** the response is not HTTP 200 with `{ id, email }` for that user

#### Scenario: No current-user users GET

- **WHEN** a client sends `GET /users/me` with or without an access token
- **THEN** the system does not return the current user's profile from that path
- **AND** the response is not HTTP 200 with `{ id, email }` for that user as a dedicated current-user contract
