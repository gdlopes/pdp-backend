import { ConfigModule } from '@nestjs/config';
import { ModuleMetadata } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { configureApp } from '../../src/configure-app';
import RefreshTokensEntity from '../../src/database/entities/refresh-tokens.entity';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { setupMockDatabase } from './mock-database';
import { EntityClass } from './types';

export const applyE2EAuthEnv = (): void => {
  process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-must-be-at-least-32';
  process.env.JWT_ISSUER = 'pdp-api';
  process.env.JWT_AUDIENCE = 'pdp-client';
  process.env.JWT_ACCESS_EXPIRES_IN = '900';
  process.env.REFRESH_TOKEN_TTL_DAYS = '7';
  process.env.COOKIE_SECURE = 'false';
  process.env.COOKIE_SAMESITE = 'lax';
  process.env.CORS_ORIGINS = 'http://localhost:3000';
};

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
  applyE2EAuthEnv();

  const { startedContainer, databaseConfig } = await setupMockDatabase([
    ...options.entities,
    RefreshTokensEntity,
  ]);

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      AuthModule,
      ...(options.imports ?? []),
      TypeOrmModule.forRoot(databaseConfig),
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  await configureApp(app);
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
