## Purpose

Lets a client prove a user's identity with email and password, receive a short-lived access token and a rotating refresh token, and call protected APIs as that user until they log out or the session is revoked.

## ADDED Requirements

### Requirement: Login with email and password

The system SHALL authenticate a user with `POST /auth/login` when the request body includes a registered `email` and the matching password. On success the system SHALL return HTTP 200 with a JSON body containing `accessToken` (a JWT), `tokenType` equal to `Bearer`, `expiresIn` (access-token lifetime in seconds), and `user` with `id` and `email` for that account. The response MUST NOT include the password, password hash, or refresh token in the JSON body. The system SHALL also set a refresh-token cookie on that response as specified in Requirement: Refresh token cookie.

#### Scenario: Successful login

- **WHEN** a client sends `POST /auth/login` with a registered email and the correct password
- **THEN** the response status is 200
- **AND** the body includes `accessToken`, `tokenType` equal to `Bearer`, `expiresIn`, and `user` with `id` and `email` for that account
- **AND** the body does not include `password`, `passwordHash`, or a refresh token field
- **AND** the response sets a refresh-token cookie

#### Scenario: Unknown email

- **WHEN** a client sends `POST /auth/login` with an email that is not registered
- **THEN** the response status is 401
- **AND** the response message is `Invalid credentials.`
- **AND** no refresh-token cookie is set

#### Scenario: Wrong password

- **WHEN** a client sends `POST /auth/login` with a registered email and an incorrect password
- **THEN** the response status is 401
- **AND** the response message is `Invalid credentials.`
- **AND** no refresh-token cookie is set

#### Scenario: Missing credentials

- **WHEN** a client sends `POST /auth/login` without a valid email or without a password
- **THEN** the response status is 400
- **AND** no refresh-token cookie is set

### Requirement: Access token is a short-lived Bearer JWT

The access token SHALL be a JWT that the client sends as `Authorization: Bearer <accessToken>` on protected requests. The token MUST expire in at most 900 seconds. The payload MUST include `sub` (the user id), `iss`, `aud`, `iat`, and `exp`. The payload MUST NOT include the password or password hash. The system MUST reject tokens that use an unexpected algorithm, issuer, or audience.

#### Scenario: Valid access token authorizes the user

- **WHEN** a client sends a protected request with a valid, unexpired access token in the Authorization Bearer header
- **THEN** the system treats the request as authenticated as the user identified by `sub`

#### Scenario: Missing access token

- **WHEN** a client sends a protected request with no Authorization header
- **THEN** the response status is 401

#### Scenario: Expired or invalid access token

- **WHEN** a client sends a protected request with an expired, malformed, or wrongly signed access token
- **THEN** the response status is 401

### Requirement: Refresh token cookie

On successful login and successful refresh, the system SHALL set a refresh-token cookie. The cookie MUST be `HttpOnly`. The cookie Path MUST be scoped so it is sent only to `/auth/refresh` and `/auth/logout`. The cookie MUST use `SameSite` (`Lax` when the API and client share a site, `None` when they are cross-site). The cookie MUST use `Secure` when the deployment is not local HTTP. The cookie value MUST be an opaque secret, not a JWT. The cookie MUST expire no later than 7 days after it is issued. The JSON response MUST NOT include the raw refresh token.

#### Scenario: Login sets a scoped httpOnly refresh cookie

- **WHEN** login succeeds
- **THEN** the Set-Cookie header includes an HttpOnly refresh-token cookie
- **AND** the cookie Path does not cause the cookie to be sent to `/users`, `/action-plans`, `/tasks`, or `/healthcheck`
- **AND** the JSON body does not contain the cookie value

### Requirement: Refresh rotates tokens

The system SHALL accept `POST /auth/refresh` without an access token when the request includes a valid, unrevoked, unexpired refresh-token cookie. On success the system SHALL return HTTP 200 with a new access token (`accessToken`, `tokenType` equal to `Bearer`, `expiresIn`) and `user` with `id` and `email` for the session's user, and SHALL replace the refresh-token cookie with a new opaque value. The previous refresh token MUST NOT be usable again. Refresh MUST be a public route with respect to the access token (it MUST NOT require a Bearer header).

#### Scenario: Successful refresh

- **WHEN** a client sends `POST /auth/refresh` with a valid refresh-token cookie and no Authorization header
- **THEN** the response status is 200
- **AND** the body includes a new `accessToken` and `user` with `id` and `email` for the session's user
- **AND** the response sets a new refresh-token cookie
- **AND** a later `POST /auth/refresh` with the previous cookie value fails as specified in Requirement: Refresh reuse detection

#### Scenario: Missing refresh cookie

- **WHEN** a client sends `POST /auth/refresh` with no refresh-token cookie
- **THEN** the response status is 401

#### Scenario: Expired or revoked refresh cookie

- **WHEN** a client sends `POST /auth/refresh` with a refresh token that is expired or has been revoked
- **THEN** the response status is 401
- **AND** the system clears the refresh-token cookie

### Requirement: Refresh reuse detection

If a refresh token that was already rotated is presented again, the system SHALL treat that as theft. It MUST revoke every refresh token in that token's family (all tokens issued from the same login), MUST return HTTP 401, and MUST clear the refresh-token cookie. Subsequent refresh or authenticated use of that family MUST fail until the user logs in again.

#### Scenario: Replayed refresh token revokes the family

- **WHEN** a client successfully refreshes (token A becomes token B)
- **AND** a client later sends `POST /auth/refresh` with token A
- **THEN** the response status is 401
- **AND** token B is no longer accepted for refresh
- **AND** the refresh-token cookie is cleared

### Requirement: Logout revokes the session

The system SHALL accept `POST /auth/logout` when the request includes a refresh-token cookie. Logout MUST NOT require a valid access token. On success the system SHALL revoke that refresh token and its family, SHALL clear the refresh-token cookie, and SHALL return HTTP 204 with an empty body. Logout with no cookie SHALL still return HTTP 204 and MUST NOT create a session.

#### Scenario: Successful logout

- **WHEN** a client sends `POST /auth/logout` with a valid refresh-token cookie
- **THEN** the response status is 204
- **AND** the body is empty
- **AND** the refresh-token cookie is cleared
- **AND** a later `POST /auth/refresh` with the previous cookie value returns 401

#### Scenario: Logout without a cookie

- **WHEN** a client sends `POST /auth/logout` with no refresh-token cookie
- **THEN** the response status is 204
- **AND** the body is empty

### Requirement: Public routes do not require an access token

The system SHALL allow unauthenticated access only to `GET /healthcheck`, `POST /users`, `POST /auth/login`, `POST /auth/refresh`, and `POST /auth/logout`. Every other existing users, action-plans, and tasks route MUST require a valid access token.

#### Scenario: Healthcheck stays public

- **WHEN** a client sends `GET /healthcheck` with no Authorization header
- **THEN** the response is not 401 by reason of missing authentication

#### Scenario: Protected route without a token

- **WHEN** a client sends `GET /action-plans` with no Authorization header
- **THEN** the response status is 401

### Requirement: Login and refresh are rate limited

The system SHALL rate-limit `POST /auth/login` and `POST /auth/refresh` per client IP. When the limit is exceeded the system SHALL return HTTP 429 and MUST NOT issue new tokens.

#### Scenario: Too many login attempts

- **WHEN** a client exceeds the login rate limit from the same IP
- **THEN** the response status is 429
- **AND** no new access token or refresh-token cookie is issued
