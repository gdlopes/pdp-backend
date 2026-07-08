import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import UsersEntity from '../../src/database/entities/users.entity';
import { UsersModule } from '../../src/modules/users/users.module';
import { setupE2EApp, teardownE2EApp } from '../shared/setup-e2e-app';
import { seedUsers } from './seed';

export type UsersE2EContext = {
  app: NestFastifyApplication;
  container: StartedPostgreSqlContainer;
  existentUser: UsersEntity;
};

export const setupUsersE2E = async (): Promise<UsersE2EContext> => {
  const context = await setupE2EApp({
    imports: [UsersModule],
    entities: [UsersEntity],
    seed: seedUsers,
  });

  return {
    app: context.app,
    container: context.container,
    existentUser: context.seed.existentUser,
  };
};

export const teardownUsersE2E = teardownE2EApp;
