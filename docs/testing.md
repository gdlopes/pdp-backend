# Testing

Unit and end-to-end test patterns for the PDP Backend.

## Overview

| Type | Location | Runner | Database |
|------|----------|--------|----------|
| Unit | `src/**/*.spec.ts` | `npm test` | Mocked repositories |
| E2E | `test/**/*.e2e-spec.ts` | `npm run test:e2e` | PostgreSQL via Testcontainers |

CI (`.github/workflows/ci.yaml`) runs lint, unit tests, e2e tests, and a production build on pull requests to `main`.

## Unit tests

### Scope

- **Use-case services** — primary test target; mock repositories and cross-module dependencies
- **Controllers** — mock use-cases, verify routing and delegation

### Pattern: use-case service

```typescript
const repositoryMock = { save: jest.fn(), findOne: jest.fn() };
const dependencyMock = { execute: jest.fn() };

beforeEach(async () => {
  jest.clearAllMocks();
  const module = await Test.createTestingModule({
    providers: [
      MyService,
      { provide: getRepositoryToken(MyEntity), useValue: repositoryMock },
      { provide: DependencyService, useValue: dependencyMock },
    ],
  }).compile();
  service = module.get(MyService);
});
```

Reference: `src/modules/action-plans/use-cases/create-action-plans.service.spec.ts`

### What to test per use-case

| Case | Assert |
|------|--------|
| Happy path | Correct return shape, dependencies called with expected args |
| Validation failure | Correct exception thrown, side effects not executed (e.g. `save` not called) |
| Not found / conflict | Exception type and message match API contract |

### Jest config

Defined inline in `package.json`:

- `rootDir`: `src/`
- `testRegex`: `.*\.spec\.ts$`
- `testEnvironment`: `node`

## E2E tests

### Requirements

- **Docker** must be running — Testcontainers spins up a real PostgreSQL instance
- Default timeout: `jest.setTimeout(120000)` in e2e files (container startup is slow)

### Shared harness

| File | Purpose |
|------|---------|
| `test/shared/mock-database.ts` | Starts PostgreSQL container, returns TypeORM config |
| `test/shared/setup-e2e-app.ts` | Creates NestJS app with Fastify + TypeORM |
| `test/shared/types.ts` | Shared types (`EntityClass`) |

### `setupE2EApp` options

```typescript
const context = await setupE2EApp({
  imports: [ActionPlansModule],       // Nest modules to load
  entities: [UsersEntity, ActionPlansEntity],  // TypeORM entities
  seed: async (dataSource) => { ... }, // Optional seed data
});
```

Returns:

```typescript
{
  app: NestFastifyApplication,
  container: StartedPostgreSqlContainer,
  moduleRef: TestingModule,
  dataSource: DataSource,
  seed: TSeed,  // return value of seed function
}
```

Always tear down:

```typescript
await teardownE2EApp({ app: context.app, container: context.container });
```

### Per-domain setup

Each domain has a `test/<domain>/setup.ts` that wraps the shared harness:

```typescript
// test/action-plans/setup.ts
export const setupActionPlansE2E = () =>
  setupE2EApp({
    imports: [ActionPlansModule],
    entities: [UsersEntity, ActionPlansEntity],
    seed: seedActionPlansModule,
  });
```

Use domain-specific `mock.ts` and `seed.ts` for test data builders.

### E2E test structure

```typescript
describe('Resource - POST /resource', () => {
  jest.setTimeout(120000);
  const context = setupResourceE2E();

  beforeAll(async () => { await context; });
  afterAll(async () => { await teardownResourceE2E(await context); });

  it('should create successfully', async () => {
    const { app } = await context;
    const response = await request(app.getHttpServer())
      .post('/resource')
      .send(payload);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ ... });
  });

  it('should return error when ...', async () => {
    // cover primary failure case
  });
});
```

Reference: `test/users/create-users.e2e-spec.ts`, `test/action-plans/create-action-plans.e2e-spec.ts`

### E2E config

`test/jest-e2e.json`:

- `rootDir`: `.` (project root)
- `testRegex`: `.e2e-spec.ts$`

## Checklist for a new feature

1. **Unit spec** for each new use-case service
   - Happy path + main error path
   - Mock all injected dependencies

2. **Controller spec** (project convention — follow existing modules)
   - Verify `execute()` is called with correct arguments

3. **E2E spec** for each new HTTP endpoint
   - Happy path with expected status and body
   - Primary error case (400, 404, 409 as applicable)

4. **Seed function** if the endpoint requires pre-existing data
   - Add to `test/<domain>/seed.ts`
   - Return seeded entities for use in tests

5. **Mock builders** for request payloads
   - Add to `test/<domain>/mock.ts`

6. **Run locally**

```bash
npm test
npm run test:e2e
```

## Existing test coverage

### Unit tests

| Module | Spec files |
|--------|------------|
| healthcheck | `healthcheck.controller.spec.ts` |
| users | `users.controller.spec.ts`, `create-user.service.spec.ts`, `get-user-by-id.service.spec.ts`, `get-user-by-email.service.spec.ts` |
| action-plans | `action-plans.controller.spec.ts`, `create-action-plans.service.spec.ts`, `get-action-plan-by-id.service.spec.ts`, `get-action-plans-by-user-id.service.spec.ts` |

### E2E tests

| Domain | Spec files |
|--------|------------|
| users | `test/users/create-users.e2e-spec.ts` |
| action-plans | `create-action-plans.e2e-spec.ts`, `get-action-plans-by-user-id.e2e-spec.ts`, `get-action-plan-by-id.e2e-spec.ts` |

**Gaps:** no healthcheck e2e, no tasks tests (API not implemented).

## Tips

- E2E uses `synchronize: true` — entity changes apply automatically; migrations are not tested in e2e
- Use `request(app.getHttpServer())` from `supertest` — works with Fastify adapter
- Clear mocks in `beforeEach` with `jest.clearAllMocks()` to avoid cross-test leakage
- Share constants like `NON_EXISTENT_USER_ID` in domain `mock.ts` files

## Related docs

- [Development](./development.md) — test commands and CI
- [API Conventions](./api-conventions.md) — expected status codes and messages
- [Architecture](./architecture.md) — what to mock at each layer
