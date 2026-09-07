import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import ActionPlansEntity from '../../src/database/entities/action-plans.entity';
import TasksEntity from '../../src/database/entities/tasks.entity';
import UsersEntity from '../../src/database/entities/users.entity';
import { TasksModule } from '../../src/modules/tasks/tasks.module';
import { login, LoginResult, SEEDED_USER_PASSWORD } from '../shared/login';
import { setupE2EApp, teardownE2EApp } from '../shared/setup-e2e-app';
import { seedTasksModule } from './seed';

export type TasksE2EContext = Awaited<ReturnType<typeof seedTasksModule>> & {
  app: NestFastifyApplication;
  container: StartedPostgreSqlContainer;
  ownerAuth: LoginResult;
  otherAuth: LoginResult;
};

export const setupTasksE2E = async (): Promise<TasksE2EContext> => {
  const context = await setupE2EApp({
    imports: [TasksModule],
    entities: [UsersEntity, ActionPlansEntity, TasksEntity],
    seed: seedTasksModule,
  });

  const [ownerAuth, otherAuth] = await Promise.all([
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
  ]);

  return {
    app: context.app,
    container: context.container,
    ...context.seed,
    ownerAuth,
    otherAuth,
  };
};

export const teardownTasksE2E = teardownE2EApp;
