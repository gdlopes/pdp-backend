# Database

PostgreSQL persistence with TypeORM — entities, migrations, and naming conventions.

## Configuration

| File | Purpose |
|------|---------|
| `src/database/database.module.ts` | Runtime TypeORM config via `ConfigModule` |
| `src/database/typeOrm.migration-config.ts` | CLI config for `migration:run` / `migration:revert` |
| `.env` | Connection credentials (see [development.md](./development.md)) |

Key settings:

- **Driver:** PostgreSQL
- **synchronize:** `false` — never auto-sync schema in any environment
- **Entities:** `src/database/entities/**` (runtime) or explicit list (migration config)
- **Migrations:** `src/database/migrations/*.ts`

## Naming conventions

| Layer | Convention | Example |
|-------|------------|---------|
| Table name | snake_case, plural | `action_plans`, `users` |
| Column name | snake_case | `user_id`, `created_at` |
| TypeScript property | camelCase | `userId`, `createdAt` |
| Entity class | PascalCase + `Entity` suffix | `ActionPlansEntity` |
| FK column | `<referenced_table_singular>_id` | `action_plan_id` |

Map column names explicitly when they differ from the property:

```typescript
@Column({ type: 'varchar', name: 'user_id' })
userId: string;
```

Timestamp columns use `@CreateDateColumn` and `@UpdateDateColumn` with explicit `name`:

```typescript
@CreateDateColumn({ type: 'timestamp', name: 'created_at', ... })
createdAt: Date;
```

## Entities

All entities live in `src/database/entities/`:

| Entity | Table | File |
|--------|-------|------|
| `UsersEntity` | `users` | `users.entity.ts` |
| `ActionPlansEntity` | `action_plans` | `action-plans.entity.ts` |
| `TasksEntity` | `tasks` | `tasks.entity.ts` |

Feature modules import entities via:

```typescript
TypeOrmModule.forFeature([ActionPlansEntity])
```

Do not duplicate entity definitions inside modules.

## Relationships

Use explicit TypeORM decorators:

```typescript
@ManyToOne(() => UsersEntity)
@JoinColumn({ name: 'user_id' })
user: UsersEntity;
```

Current relationships:

- `ActionPlansEntity` → `UsersEntity` (`user_id`)
- `TasksEntity` → `ActionPlansEntity` (`action_plan_id`, CASCADE delete)

## Migrations

### Workflow

1. **Modify or create** the entity in `src/database/entities/`
2. **Generate** a migration file:

```bash
npm run migration:create --name=describe-change
```

3. **Edit** the generated file in `src/database/migrations/` — review SQL carefully
4. **Register** new entities in `typeOrm.migration-config.ts` if adding a table
5. **Apply** locally:

```bash
npm run migration:run
```

6. **Revert** if needed:

```bash
npm run migration:revert
```

### Existing migrations

| Timestamp | File | Creates |
|-----------|------|---------|
| `1742156397081` | `create-users-table.ts` | `users` |
| `1742902163805` | `create-action-plans-table.ts` | `action_plans` + FK to users |
| `1745024081620` | `create-tasks-table.ts` | `tasks` + FK to action_plans |

### Migration rules

- One migration per logical schema change
- Always implement both `up()` and `down()`
- Use `queryRunner.createTable`, `createForeignKey`, etc. — match existing style
- Never edit a migration that has already been applied in shared environments; create a new migration instead
- Primary keys use UUID (`uuid_generate_v4()`) for `users`, `action_plans`, and `tasks`

### Docker Compose

The dev compose stack runs `npm run migration:run` before `start:dev`, so new migrations apply automatically on container start.

## Enums in the database

Postgres enum columns are stored as `varchar` in migrations (e.g. `current_level`, `status`). TypeScript enums in entities and DTOs provide type safety at the application layer.

Keep entity enums and DTO enums in sync — see known mismatches in [domain.md](./domain.md).

## E2E test database

E2E tests use Testcontainers with `synchronize: true` (not migrations). The schema is inferred from entities at test runtime.

This means:

- Entity changes are picked up automatically in e2e
- Migration SQL is **not** exercised in e2e — verify migrations separately with `migration:run` locally

See [testing.md](./testing.md).

## Type pitfalls

| Field | Issue |
|-------|-------|
| `timeCommitment` | Entity types as `number`, DB column is `varchar` — align on future changes |
| `password_hash` | Migration marks as `unique` — likely unintentional; do not rely on this for business logic |

## Related docs

- [Development](./development.md) — migration commands
- [Domain Model](./domain.md) — entities and enums
- [Architecture](./architecture.md) — where entities fit in the stack
