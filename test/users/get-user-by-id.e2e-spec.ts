import * as request from 'supertest';
import { bearer, login, SEEDED_USER_PASSWORD } from '../shared/login';
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

  it('does not return a user profile by id without a token', async () => {
    const { app, existentUser } = await context;

    const response = await request(app.getHttpServer()).get(
      `/users/${existentUser.id}`,
    );

    expect(response.status).not.toBe(200);
    expect(response.body).not.toMatchObject({
      id: existentUser.id,
      email: existentUser.email,
    });
  });

  it('does not return a user profile by id with a token', async () => {
    const { app, existentUser } = await context;
    const { accessToken } = await login(
      app,
      existentUser.email,
      SEEDED_USER_PASSWORD,
    );

    const response = await request(app.getHttpServer())
      .get(`/users/${existentUser.id}`)
      .set(bearer(accessToken));

    expect(response.status).not.toBe(200);
    expect(response.body).not.toMatchObject({
      id: existentUser.id,
      email: existentUser.email,
    });
  });
});
