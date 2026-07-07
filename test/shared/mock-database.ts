import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityClass } from './types';

export const setupMockDatabase = async (entities: EntityClass[]) => {
  const postgresContainer = await new PostgreSqlContainer()
    .withDatabase('testdb')
    .withUsername('testuser')
    .withPassword('testpass')
    .withStartupTimeout(30000)
    .start();

  const container: StartedPostgreSqlContainer = postgresContainer;

  const databaseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities,
    synchronize: true,
  };

  return { startedContainer: container, databaseConfig };
};
