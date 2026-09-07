import * as request from 'supertest';
import { bearer, login, SEEDED_USER_PASSWORD } from '../shared/login';
import { setupUsersE2E, teardownUsersE2E } from './setup';

describe('Users - GET /users/email/:email and GET /users/me', () => {
  jest.setTimeout(120000);

  const context = setupUsersE2E();

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownUsersE2E(await context);
  });

  it('does not return a user profile by email', async () => {
    const { app, existentUser } = await context;
    const { accessToken } = await login(
      app,
      existentUser.email,
      SEEDED_USER_PASSWORD,
    );

    const unauthenticated = await request(app.getHttpServer()).get(
      `/users/email/${existentUser.email}`,
    );
    const authenticated = await request(app.getHttpServer())
      .get(`/users/email/${existentUser.email}`)
      .set(bearer(accessToken));

    expect(unauthenticated.status).not.toBe(200);
    expect(unauthenticated.body).not.toMatchObject({
      id: existentUser.id,
      email: existentUser.email,
    });
    expect(authenticated.status).not.toBe(200);
    expect(authenticated.body).not.toMatchObject({
      id: existentUser.id,
      email: existentUser.email,
    });
  });

  it('does not return a current-user profile from GET /users/me', async () => {
    const { app, existentUser } = await context;
    const { accessToken } = await login(
      app,
      existentUser.email,
      SEEDED_USER_PASSWORD,
    );

    const unauthenticated = await request(app.getHttpServer()).get('/users/me');
    const authenticated = await request(app.getHttpServer())
      .get('/users/me')
      .set(bearer(accessToken));

    expect(unauthenticated.status).not.toBe(200);
    expect(unauthenticated.body).not.toMatchObject({
      id: existentUser.id,
      email: existentUser.email,
    });
    expect(authenticated.status).not.toBe(200);
    expect(authenticated.body).not.toMatchObject({
      id: existentUser.id,
      email: existentUser.email,
    });
  });
});
