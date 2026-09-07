## Why

The API has no authentication: anyone who knows an id can read or mutate another user's plans and tasks, and identity is a client-supplied `userId`. A frontend is next, so the backend needs a real login contract now — email/password, short-lived access JWTs, refresh tokens, and ownership checks — built so a later strategy (OAuth, RS256, extra Passport strategies) can land without rewriting the resource APIs.

## What Changes

- Add an `auth` module: login, refresh, and logout, using NestJS Passport + `@nestjs/jwt`. Successful login and refresh include `user: { id, email }` so a frontend does not need a `/me` route.
- Issue a short-lived access JWT (Authorization Bearer) and a rotating opaque refresh token in an httpOnly cookie.
- Persist hashed refresh tokens with family-based reuse detection so stolen tokens can be revoked.
- **BREAKING**: Protect all user, action-plan, and task routes. Unauthenticated requests receive 401. `GET /healthcheck` stays public.
- **BREAKING**: Stop accepting `userId` on action-plan create/list/get. Ownership comes from the access token.
- **BREAKING**: Task operations succeed only when the authenticated user owns the parent plan. Unknown or foreign ids return 404 (do not leak existence).
- **BREAKING**: Remove public `GET /users/:id` and `GET /users/email/:email`. Registration (`POST /users`) stays public and rate-limited. Identity for the SPA comes from login/refresh, not a dedicated current-user GET.
- Apply NestJS HTTP hardening used by this change: global `ValidationPipe`, CORS allowlist, Helmet, login/refresh throttling.

## Capabilities

### New Capabilities

- `auth`: Email/password login, access JWT verification, refresh-token rotation and reuse detection, logout/revoke, and the HTTP contract for `/auth/*`.
- `users`: Public registration; no public lookup-by-id or lookup-by-email; no current-user GET.
- `action-plans`: Create, list, and get action plans for the authenticated user only. No client-supplied `userId`.

### Modified Capabilities

- `tasks`: Every task operation requires an authenticated owner of the parent action plan. Missing or foreign resources return 404.

## Impact

- New module `src/modules/auth/`, registered in `AppModule`, plus shared `CurrentUser` decorator and JWT guard used by users, action-plans, and tasks.
- New table `refresh_tokens` (entity + migration). Users table is unchanged (`email`, `password_hash` already exist).
- Public API: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` (login and refresh bodies include `user: { id, email }`). Action-plan and task routes keep their paths but require `Authorization: Bearer` and drop `userId` query/body fields.
- New dependencies: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/throttler`, `@fastify/cookie`, `@fastify/helmet`, direct `class-validator` / `class-transformer`.
- All existing e2e suites must authenticate (or hit only public routes). Swagger gains Bearer auth. Docs (`architecture`, `api-conventions`, `domain`) must describe the new identity model.
- Out of scope: OAuth/social login, email verification, password reset, roles/permissions beyond resource ownership, RS256/JWKS, a backend-for-frontend.
