import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import {
  NestFastifyApplication,
  FastifyAdapter,
} from '@nestjs/platform-fastify';
import { UsersModule } from '../src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { seedUsers } from './seed';
import { setupMockDatabase } from './mockDatabase';

describe('Users', () => {
  jest.setTimeout(30000);
  let app: NestFastifyApplication;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    const { startedContainer, databaseConfig } = await setupMockDatabase();
    container = startedContainer;

    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule, TypeOrmModule.forRoot(databaseConfig)],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    const dataSource = app.get(DataSource);
    await seedUsers(dataSource);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  describe('/POST users', () => {
    it('should create users successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'test@email.com', password: '123456' });

      expect(response.status).toBe(201);
    });

    it('should return conflict error when email already exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ email: 'existent-user@email.com', password: '123456' });

      expect(response.status).toBe(409);
      expect(response.body.message).toEqual('User already exists.');
    });
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });
});
