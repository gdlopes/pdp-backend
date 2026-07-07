import * as request from 'supertest';
import { buildCreateUserDto, EXISTENT_USER_EMAIL } from './mock';
import { setupUsersE2E, teardownUsersE2E } from './setup';

describe('Users - POST /users', () => {
  jest.setTimeout(120000);

  const context = setupUsersE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownUsersE2E(await context);
  });

  it('should create users successfully', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(buildCreateUserDto());

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      email: 'test@email.com',
    });
  });

  it('should return conflict error when email already exists', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(buildCreateUserDto({ email: EXISTENT_USER_EMAIL }));

    expect(response.status).toBe(409);
    expect(response.body.message).toEqual('User already exists.');
  });
});
