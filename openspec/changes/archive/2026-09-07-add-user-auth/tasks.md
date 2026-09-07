## 1. Dependencies and configuration

- [x] 1.1 Add `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/throttler`, `@fastify/cookie`, `@fastify/helmet`, `class-validator`, and `class-transformer` (plus `@types/passport-jwt` as a devDependency) and verify `npm install` succeeds
- [x] 1.2 Document required env (`JWT_ACCESS_SECRET` ≥32 chars, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_EXPIRES_IN=900`, refresh TTL 7 days, `COOKIE_SECURE`, `COOKIE_SAMESITE`, `CORS_ORIGINS`) and verify the app refuses to boot when `JWT_ACCESS_SECRET` is missing or shorter than 32 characters

## 2. Persistence

- [x] 2.1 Add `RefreshTokensEntity` and a `create-refresh-tokens-table` migration (`id`, `user_id` FK cascade, unique `token_hash`, `family_id`, `expires_at`, `revoked_at`, `replaced_by_id`, `created_at`) and verify the entity maps 1:1 to the migration and is registered in `TypeOrmModule.forFeature` / migration config

## 3. Users lookup and password hashing

- [x] 3.1 Change registration to async `bcrypt.hash` with cost 12 and verify the create-user unit spec still returns `{ id, email }` with no hash in the response
- [x] 3.2 Export a users email lookup that returns `UsersEntity | null` (no throw) from `UsersModule` and verify its unit spec covers found and missing without leaking a distinct error type
- [x] 3.3 Remove `GET /users/:id` and `GET /users/email/:email` from `UsersController` and verify the controller spec no longer exposes those routes

## 4. Auth module core

- [x] 4.1 Create `src/modules/auth/` (`AuthModule` with `JwtModule.registerAsync`, `PassportModule`, `UsersModule`, `TypeOrmModule.forFeature([RefreshTokensEntity])`, `AuthenticatedUser` type, `@Public()`, `@CurrentUser()`, `JwtAuthGuard`, `JwtStrategy` verifying HS256 + issuer + audience from the Bearer header and setting `request.user = { id: payload.sub }`) and verify the module compiles
- [x] 4.2 Implement `TokenIssuer` (sign access JWT with `sub`/`iss`/`aud`/`exp` ≤900s; create opaque 32-byte refresh hashed with SHA-256; rotate; revoke family on logout or reuse) and verify unit specs cover issue, rotate, expired/revoked reject, and reuse revokes the family
- [x] 4.3 Register `APP_GUARD` as `JwtAuthGuard` in `AuthModule`, import `AuthModule` in `AppModule`, mark `GET /healthcheck` with `@Public()`, and verify a protected route without a token returns 401 while healthcheck does not

## 5. Login, refresh, logout

- [x] 5.1 Implement `LoginService` (null-safe email lookup, dummy `bcrypt.compare` on miss, 401 `Invalid credentials.` for unknown email and wrong password, issue access JSON + `user: { id, email }` + refresh cookie via `TokenIssuer`) and verify the unit spec covers success (including `user`), unknown email, wrong password, and that miss vs wrong password share the same exception message
- [x] 5.2 Implement `RefreshSessionService` (no access token required; rotate cookie; success body includes `user: { id, email }` for the session user; 401 + clear cookie when missing/expired/revoked; reuse of a rotated token revokes the family) and verify the unit spec covers success (including `user`), missing, expired, and replay
- [x] 5.3 Implement `LogoutService` (revoke family when a refresh cookie is present; always succeed with no session created when the cookie is absent) and verify the unit spec covers both paths
- [x] 5.4 Wire `POST /auth/login` (200 `{ accessToken, tokenType: Bearer, expiresIn, user: { id, email } }`), `POST /auth/refresh` (same user shape), and `POST /auth/logout` (204) on `AuthController` with `@Public()`, Swagger, login/refresh/register throttling, and refresh cookie flags (`HttpOnly`, `Path=/auth`, SameSite/Secure from env) and verify the controller spec delegates to the three use-cases

## 6. Shared HTTP bootstrap

- [x] 6.1 Extract `configureApp` (Fastify cookie plugin, Helmet, CORS with credentials + `CORS_ORIGINS`, global `ValidationPipe` whitelist + `forbidNonWhitelisted` + transform, Swagger `addBearerAuth`) and use it from `main.ts` and `setupE2EApp`, then verify e2e boots with cookies and the validation pipe applied

## 7. Users surface

- [x] 7.1 Add `@Public()` on `POST /users`, add rate limiting on registration, leave users HTTP as register-only (no `GET /users/me`), and verify the users controller spec only exposes `POST /users`

## 8. Action-plan ownership

- [x] 8.1 Remove `userId` from `CreateActionPlanDto`, change create to `execute(userId, dto)` using `@CurrentUser()`, and verify the unit spec assigns the token user (not a body field) and that an extra `userId` in the body is rejected by the validation pipe or ignored
- [x] 8.2 Drop the `userId` query from `GET /action-plans` and `GET /action-plans/:id`, pass `@CurrentUser().id` into the existing list/get use-cases, return 404 with the same message for missing and foreign plans, and verify controller + use-case specs cover success, 401 without token (e2e or guard), and foreign 404

## 9. Task ownership

- [x] 9.1 Pass authenticated `userId` into every task use-case, treat a missing or foreign parent plan as 400 `Action plan does not exists.` on create/list and a missing or foreign task as 404 `Task not found.` on get/start/complete/delete, and verify unit specs cover owned success plus foreign/missing for each operation

## 10. End-to-end tests

- [x] 10.1 Extend `setupE2EApp` to import `AuthModule` + `ConfigModule` (test JWT/cookie env), include `RefreshTokensEntity`, call `configureApp`, and add a `login(app, email, password)` helper that returns the access token and refresh cookie, then verify the harness can login after seeding a user
- [x] 10.2 Add `test/auth/` e2e for login (200 + HttpOnly `Path=/auth` cookie + `user: { id, email }` + no refresh in JSON; 401 `Invalid credentials.` for unknown email and wrong password; 400 missing fields), refresh (new access + rotated cookie + `user`; 401 missing/expired), reuse (replay returns 401 and invalidates the family), logout (204 then refresh 401; 204 without cookie), and 401 on `GET /action-plans` without a token, and verify `npm run test:e2e -- test/auth` passes
- [x] 10.3 Update users e2e: public `POST /users` still 201; `GET /users/me`, `GET /users/:id`, and `GET /users/email/:email` no longer return `{ id, email }` as a user profile, and verify those e2e specs pass
- [x] 10.4 Update action-plans e2e to authenticate, omit `userId` from body/query, assert a second user cannot list or get the first user's plan, and verify those e2e specs pass
- [x] 10.5 Update tasks e2e to authenticate as the plan owner, assert a second user gets 400/404 (same messages as missing) on foreign plan/task operations, and verify those e2e specs pass

## 11. Documentation

- [x] 11.1 Update `docs/architecture.md`, `docs/api-conventions.md`, and `docs/domain.md` with `/auth/*`, Bearer access + refresh cookie, `user` on login/refresh, no `GET /users/me`, no public user lookups, no client `userId`, and task ownership, and verify the docs match the shipped routes
