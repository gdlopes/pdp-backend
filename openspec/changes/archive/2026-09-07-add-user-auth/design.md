## Context

See `proposal.md` for motivation and `specs/auth/spec.md`, `specs/users/spec.md`, `specs/action-plans/spec.md`, and `specs/tasks/spec.md` for the HTTP contract.

The app is a NestJS 11 Fastify modular monolith: thin controllers, one use-case per action, TypeORM entities in `src/database/`. Users already store `email` + `password_hash` (bcrypt, sync, cost 10). Identity on action-plans is a client `userId`; tasks were built without `userId` so ownership can be `plan.userId === currentUser`. There is no Passport, JWT, CORS, Helmet, global `ValidationPipe`, or cookie plugin. `main.ts` bootstraps Fastify + Swagger only; e2e uses `setupE2EApp` and does not share that bootstrap, so security middleware must be extracted or e2e will not match production.

`GetUserByEmailService` exists but is only wired to a public GET. `UsersModule` exports `GetUserByIdService` and `CreateUserService`, not the email lookup.

## Goals / Non-Goals

**Goals:**

- Follow NestJS auth layout: `AuthModule` + Passport JWT strategy + global guard + `@Public()` / `@CurrentUser()`, with business logic in use-cases (not in the strategy or guard).
- Keep resource modules ignorant of JWT: they receive `AuthenticatedUser.id` and compare it to `action_plans.user_id`.
- Isolate token issuance behind a small port so HS256, cookie names, or a future second Passport strategy can change without touching action-plans or tasks.
- Share HTTP hardening (`ValidationPipe`, cookies, Helmet, CORS) between `main.ts` and e2e.

**Non-Goals:**

- OAuth, magic links, email verify, password reset, refresh-token JWT, RS256/JWKS, Redis session store, BFF, `GET /users/me`, and `GET /auth/session` (add a session GET later if the SPA needs identity without rotating refresh).
- A new `src/common/` package unless a cycle forces a split (prefer exporting from `AuthModule`).
- Changing action-plan or task payloads other than removing client `userId`.

## Decisions

### 1. Passport JWT + login use-case (no LocalStrategy)

Use `@nestjs/passport` and `passport-jwt` for **access-token verification only**. Login is `LoginService.execute(dto)` called from `AuthController`, not `AuthGuard('local')`.

NestJS documents both. LocalStrategy would wrap a single POST in Passport's callback style and fight this repo's one-use-case-per-action rule. JwtStrategy is the right Passport surface: it is the adapter that turns a Bearer token into `request.user`.

Future Google (or other) login is another strategy that, on success, calls the same `IssueSession` use-case as password login. Resource guards stay `JwtAuthGuard`.

Alternative considered: `@nestjs/jwt` verify in a custom guard, no Passport. Rejected — Passport is the NestJS-supported extension point for a second strategy.

### 2. Authenticated principal is `{ id }`, not a JWT payload

```
  Authorization: Bearer <jwt>
           |
           v
    JwtStrategy.validate
           |
           v
    request.user = { id: payload.sub }   // AuthenticatedUser
           |
           v
    @CurrentUser() user  -->  useCase.execute(user.id, ...)
```

Controllers inject `@CurrentUser()`. Use-cases take a `userId` string (action-plans already do). Jwt payload stays `{ sub, iss, aud, iat, exp }` — no email, roles, or password. Login and refresh load `{ id, email }` from the database and return it as `user` in the JSON body so the SPA never needs to decode the JWT or call `/users/me`.

This is what makes a later session cookie or RS256 swap cheap: only `JwtStrategy` / `TokenIssuer` change. Action-plans and tasks keep comparing `plan.userId === userId`.

### 3. Global `JwtAuthGuard` + `@Public()` (avoid importing AuthModule into UsersModule)

Register `APP_GUARD` in `AuthModule`. Mark public routes with `@Public()` (`GET /healthcheck`, `POST /users`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`).

`UsersModule` must not import `AuthModule` (AuthModule already imports UsersModule for email lookup). Decorators are metadata helpers; they do not create a Nest import cycle. Controllers do not `@UseGuards(JwtAuthGuard)` on every route.

`AuthModule` imports `UsersModule` and uses a lookup that returns `UsersEntity | null` (export `GetUserByEmailService` after changing it to return null instead of throwing, **or** add `FindUserByEmailService` and keep the throwing variant only if something still needs it). After public GET-by-email is removed, prefer one exported lookup that returns null so login can run a dummy `bcrypt.compare` on miss.

### 4. Access JWT in JSON; refresh opaque in an httpOnly cookie

| Token | Format | Transport | Lifetime | Stored |
|-------|--------|-----------|----------|--------|
| Access | JWT HS256 | `Authorization: Bearer` JSON `accessToken` | 900s | Nowhere (stateless) |
| Refresh | 32-byte CSPRNG, SHA-256 at rest | Cookie `refresh_token` | 7 days | `refresh_tokens` table |

Access token in a cookie would be sent on every CORS credentialed request and recreate CSRF. Bearer on API calls is not sent automatically by the browser. Refresh is only needed on `/auth/refresh` and `/auth/logout`, so cookie `Path=/auth`, `HttpOnly`, `SameSite` from env (`Lax` default; `None` + `Secure` when the SPA is cross-site), `Secure` whenever not local HTTP. Do **not** use the `__Host-` prefix: it requires `Path=/`, which would send the cookie to `/tasks` and friends.

Refresh is **not** a JWT. It must be revocable, rotatable, and hashed; putting claims in it adds no value.

`JwtModule.registerAsync` with `ConfigService`. Verify with `algorithms: ['HS256']`, `issuer`, `audience` set — never accept `alg: none` or a swapped algorithm. Secret `JWT_ACCESS_SECRET` MUST be at least 32 bytes; refuse to boot if missing or short. Access signing stays in `TokenIssuer` so a later RS256 change is one class + env keys.

Alternative considered: both tokens in JSON. Easier for mobile, worse for an XSS-stolen refresh in `localStorage`. Cookie refresh is the SPA-first default; a later mobile client can add a refresh-in-body path behind the same use-case.

### 5. Refresh rows, rotation, reuse detection

New entity `RefreshTokensEntity` / table `refresh_tokens`:

- `id` uuid PK
- `user_id` uuid FK → `users.id` (cascade delete)
- `token_hash` varchar unique (hex SHA-256 of the raw cookie value)
- `family_id` uuid (stable for one login session)
- `expires_at` timestamptz
- `revoked_at` timestamptz nullable
- `replaced_by_id` uuid nullable
- `created_at`

Do not bcrypt refresh tokens: the value is high-entropy; SHA-256 is enough and cheap. Rotation: on refresh, hash the presented value, find a non-revoked non-expired row, revoke it, insert a sibling with the same `family_id`, set cookie to the new raw value. If the presented hash matches a **revoked** row in a family that still has live descendants, revoke **all** rows with that `family_id` (reuse / theft). Logout revokes the whole family and clears the cookie.

```
  login --> family F, token A
              |
              v
  refresh A --> revoke A, issue B (same F)
              |
              v
  replay A  --> revoke family F (A and B dead) --> 401
```

### 6. Password hashing and login errors

Switch registration (and any re-hash) to async `bcrypt.hash` / `bcrypt.compare` with cost **12** (today: `hashSync(..., 10)`, which also blocks the event loop). Login always calls `compare`: real hash if the user exists, otherwise a precomputed dummy hash, then returns the same 401 `Invalid credentials.` Missing vs wrong password MUST be indistinguishable in status and message.

### 7. NestJS HTTP hardening in a shared `configureApp`

Extract `configureApp(app: NestFastifyApplication)` used by `main.ts` and `setupE2EApp`:

- `app.register(fastifyCookie)`
- `app.register(fastifyHelmet)`
- `app.enableCors({ origin: CORS_ORIGINS list, credentials: true })` — required for the refresh cookie from a browser. Non-browser e2e still works.
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` — extra `userId` on create-action-plan becomes 400 once the DTO drops the field.
- Swagger `addBearerAuth()`; protected operations `@ApiBearerAuth()`.

`@nestjs/throttler`: `@Throttle` on `POST /auth/login`, `POST /auth/refresh`, `POST /users` (per IP). Other routes skip or use a generous default. Fastify: configure the throttler to read `request.ip`.

`class-validator` and `class-transformer` become **direct** dependencies (needed by `ValidationPipe`).

### 8. Resource identity: drop client `userId`, hide foreign rows

**Action-plans:** `CreateActionPlanDto` loses `userId`. `CreateActionPlansService.execute(userId, dto)`. `GET /action-plans` calls the existing list-by-user-id use-case with `CurrentUser.id`. `GET /action-plans/:id` keeps `GetActionPlanByIdService.execute(userId, id)` but `userId` comes from the token, not the query. Missing and foreign plans both 404 with the same message.

**Tasks:** each use-case takes `userId`. Load the parent plan (create/list already call `FindActionPlanByIdService`; get/start/complete/delete must load the task's plan). If `plan.userId !== userId`, behave as today when the plan/task is missing: create/list → 400 `Action plan does not exists.`; get/start/complete/delete → 404 `Task not found.` Do not add `userId` to the tasks HTTP contract.

**Users:** remove `GET /users/:id` and `GET /users/email/:email`. Do not add `GET /users/me`. `GetUserByIdService` stays for action-plans' existence checks if still needed. `LoginService` / `RefreshSessionService` return `user: { id, email }` (no password hash) alongside tokens.

### 9. Module and file layout

```
src/modules/auth/
  auth.module.ts              # JwtModule.registerAsync, PassportModule, APP_GUARD, Throttler
  auth.controller.ts          # /auth login, refresh, logout
  dto/
  swagger/
  decorators/                 # @Public(), @CurrentUser()
  guards/jwt-auth.guard.ts
  strategies/jwt.strategy.ts
  token-issuer.service.ts     # sign access JWT; create/rotate/revoke refresh
  use-cases/login.service.ts
  use-cases/refresh-session.service.ts
  use-cases/logout.service.ts
src/database/entities/refresh-tokens.entity.ts
src/database/migrations/<ts>-create-refresh-tokens-table.ts
```

`JwtStrategy.validate` only checks the token is well-formed; it SHOULD NOT hit the database on every request (stateless access). Logout/revoke is refresh-side. Compromised access tokens live at most 900s — accepted trade-off vs an access-token denylist (Redis), which can be added later inside `JwtStrategy` without changing specs.

### 10. Tests

Unit: login (success including `user: { id, email }`, unknown email, bad password, dummy compare), refresh (rotate, reuse, expired, `user` in the success body), logout, `TokenIssuer`, JwtGuard public vs protected (light). Action-plan and task use-cases gain a `userId` argument and ownership failure cases.

E2E: `setupE2EApp` must import `AuthModule` + `ConfigModule`, call `configureApp`, and include `RefreshTokensEntity`. Helper `login(app, email, password)` returns the access token, cookie jar, and `user` from the body. Existing users / action-plans / tasks e2e must login (or register then login) and send `Authorization`. Add auth e2e for login, refresh rotation, reuse 401, logout, 401 without token, foreign plan/task hiding. Assert login/refresh JSON includes `user` and never includes a refresh token field. Assert `GET /users/me` is not a 200 current-user profile.

Env in tests: fixed `JWT_ACCESS_SECRET` (≥32 chars), `JWT_ISSUER`, `JWT_AUDIENCE`, `COOKIE_SECURE=false`, `COOKIE_SAMESITE=lax`.

## Risks / Trade-offs

- **[Risk] Global guard + e2e that does not call `configureApp` → every test 401 or cookies dropped** → Mitigation: one `configureApp`; e2e harness must use it; AuthModule imported wherever routes are protected.
- **[Risk] Cross-site SPA + `SameSite=Lax` → refresh cookie not sent** → Mitigation: `COOKIE_SAMESITE` and `CORS_ORIGINS` are env; document `None`+`Secure`+HTTPS for a separate frontend origin.
- **[Risk] Access JWT is not revocable until expiry** → Mitigation: 900s cap; logout still kills refresh; future denylist can hook `JwtStrategy` without API changes.
- **[Risk] 409 on register still reveals that an email is taken** → Mitigation: accepted UX trade-off; rate-limit `POST /users`. Login does **not** reveal existence.
- **[Risk] `forbidNonWhitelisted` is a behavior change for every DTO** → Mitigation: add `class-validator` only to DTOs this change touches if a global pipe would fail existing e2e; prefer global pipe and fix DTOs that send extra fields (action-plan `userId` is the known one).
- **[Risk] Fastify cookie + throttler quirks vs Express examples** → Mitigation: use `@fastify/cookie` and verify throttler IP extraction in e2e, not only unit tests.

## Migration Plan

1. Ship the migration `refresh_tokens` (additive). Users table unchanged.
2. Deploy API with auth required. There is no production frontend yet — **BREAKING** for any current unauthenticated client (e2e, curl, Swagger try-it).
3. Rollback: revert the release and migration. Open unauthenticated API returns; refresh rows can be dropped with the table.

No dual-write or token backfill. No data migration of passwords (re-hash on next registration only; existing hashes remain bcrypt-verifiable; cost 12 applies to new hashes). Optional later: re-hash on login if `bcrypt.getRounds(hash) < 12`.

## Open Questions

None. Cookie `SameSite` and CORS origins are environment, not spec forks. Throttle numeric limits can be tuned without changing the 429 contract.
