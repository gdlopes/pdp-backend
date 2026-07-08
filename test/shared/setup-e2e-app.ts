import { ModuleMetadata } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { setupMockDatabase } from './mock-database';
import { EntityClass } from './types';

export type SetupE2EAppOptions<TSeed> = {
  imports: ModuleMetadata['imports'];
  entities: EntityClass[];
  seed?: (dataSource: DataSource) => Promise<TSeed>;
};

export type E2EContext<TSeed = void> = {
  app: NestFastifyApplication;
  container: StartedPostgreSqlContainer;
  moduleRef: TestingModule;
  dataSource: DataSource;
  seed: TSeed;
};

export const setupE2EApp = async <TSeed = void>(
  options: SetupE2EAppOptions<TSeed>,
): Promise<E2EContext<TSeed>> => {
  const { startedContainer, databaseConfig } = await setupMockDatabase(
    options.entities,
  );

  const moduleRef = await Test.createTestingModule({
    imports: [
      ...(options.imports ?? []),
      TypeOrmModule.forRoot(databaseConfig),
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const dataSource = moduleRef.get(DataSource);
  const seed = options.seed
    ? await options.seed(dataSource)
    : (undefined as TSeed);

  return {
    app,
    container: startedContainer,
    moduleRef,
    dataSource,
    seed,
  };
};

export const teardownE2EApp = async ({
  app,
  container,
}: Pick<E2EContext, 'app' | 'container'>) => {
  if (app) {
    await app.close();
  }

  if (container) {
    await container.stop();
  }
};
