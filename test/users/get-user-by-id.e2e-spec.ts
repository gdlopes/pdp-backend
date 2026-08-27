import * as request from 'supertest';
import { NON_EXISTENT_USER_ID } from './mock';
import { setupUsersE2E, teardownUsersE2E } from './setup';

describe('Users - GET /users/:id', () => {
  jest.setTimeout(120000);

  const context = setupUsersE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownUsersE2E(await context);
  });

  it('should return a user by id', async () => {
    const { app, existentUser } = await context;

    const response = await request(app.getHttpServer()).get(
      `/users/${existentUser.id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: existentUser.id,
      email: existentUser.email,
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('should return error when user does not exist', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer()).get(
      `/users/${NON_EXISTENT_USER_ID}`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toEqual('User does not exists.');
  });
});
