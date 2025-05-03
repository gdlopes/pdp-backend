import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import UsersEntity from '../src/database/entities/users.entity';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const setupMockDatabase = async () => {
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
    entities: [UsersEntity],
    synchronize: true,
  };

  return { startedContainer: container, databaseConfig };
};
