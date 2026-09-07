import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import ActionPlansEntity from '../../src/database/entities/action-plans.entity';
import UsersEntity from '../../src/database/entities/users.entity';
import { ActionPlansModule } from '../../src/modules/action-plans/action-plans.module';
import { login, LoginResult, SEEDED_USER_PASSWORD } from '../shared/login';
import { setupE2EApp, teardownE2EApp } from '../shared/setup-e2e-app';
import { seedActionPlansModule } from './seed';

export type ActionPlansE2EContext = Awaited<
  ReturnType<typeof seedActionPlansModule>
> & {
  app: NestFastifyApplication;
  container: StartedPostgreSqlContainer;
  ownerAuth: LoginResult;
  otherAuth: LoginResult;
  creatorAuth: LoginResult;
};

export const setupActionPlansE2E = async (): Promise<ActionPlansE2EContext> => {
  const context = await setupE2EApp({
    imports: [ActionPlansModule],
    entities: [UsersEntity, ActionPlansEntity],
    seed: seedActionPlansModule,
  });

  const [ownerAuth, otherAuth, creatorAuth] = await Promise.all([
    login(
      context.app,
      context.seed.userWithActionPlans.email,
      SEEDED_USER_PASSWORD,
    ),
    login(
      context.app,
      context.seed.userWithoutActionPlans.email,
      SEEDED_USER_PASSWORD,
    ),
    login(
      context.app,
      context.seed.userForCreation.email,
      SEEDED_USER_PASSWORD,
    ),
  ]);

  return {
    app: context.app,
    container: context.container,
    ...context.seed,
    ownerAuth,
    otherAuth,
    creatorAuth,
  };
};

export const teardownActionPlansE2E = teardownE2EApp;
