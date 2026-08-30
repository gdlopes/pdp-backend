import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import ActionPlansEntity from '../../src/database/entities/action-plans.entity';
import TasksEntity from '../../src/database/entities/tasks.entity';
import UsersEntity from '../../src/database/entities/users.entity';
import { TasksModule } from '../../src/modules/tasks/tasks.module';
import { setupE2EApp, teardownE2EApp } from '../shared/setup-e2e-app';
import { seedTasksModule } from './seed';

export type TasksE2EContext = Awaited<ReturnType<typeof seedTasksModule>> & {
  app: NestFastifyApplication;
  container: StartedPostgreSqlContainer;
};

export const setupTasksE2E = async (): Promise<TasksE2EContext> => {
  const context = await setupE2EApp({
    imports: [TasksModule],
    entities: [UsersEntity, ActionPlansEntity, TasksEntity],
    seed: seedTasksModule,
  });

  return {
    app: context.app,
    container: context.container,
    ...context.seed,
  };
};

export const teardownTasksE2E = teardownE2EApp;
