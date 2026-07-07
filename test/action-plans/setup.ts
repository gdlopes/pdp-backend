import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import ActionPlansEntity from '../../src/database/entities/action-plans.entity';
import UsersEntity from '../../src/database/entities/users.entity';
import { ActionPlansModule } from '../../src/modules/action-plans/action-plans.module';
import { setupE2EApp, teardownE2EApp } from '../shared/setup-e2e-app';
import { seedActionPlansModule } from './seed';

export type ActionPlansE2EContext = Awaited<
  ReturnType<typeof seedActionPlansModule>
> & {
  app: NestFastifyApplication;
  container: StartedPostgreSqlContainer;
};

export const setupActionPlansE2E = async (): Promise<ActionPlansE2EContext> => {
  const context = await setupE2EApp({
    imports: [ActionPlansModule],
    entities: [UsersEntity, ActionPlansEntity],
    seed: seedActionPlansModule,
  });

  return {
    app: context.app,
    container: context.container,
    ...context.seed,
  };
};

export const teardownActionPlansE2E = teardownE2EApp;
