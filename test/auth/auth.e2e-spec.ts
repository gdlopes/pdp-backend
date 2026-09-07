import * as request from 'supertest';
import ActionPlansEntity from '../../src/database/entities/action-plans.entity';
import UsersEntity from '../../src/database/entities/users.entity';
import { ActionPlansModule } from '../../src/modules/action-plans/action-plans.module';
import { HealthcheckModule } from '../../src/modules/healthcheck/healthcheck.module';
import { UsersModule } from '../../src/modules/users/users.module';
import {
  cookieNameValueFrom,
  login,
  refreshCookieHeaderFrom,
  SEEDED_USER_PASSWORD,
} from '../shared/login';
import { setupE2EApp, teardownE2EApp } from '../shared/setup-e2e-app';
import { EXISTENT_USER_EMAIL } from '../users/mock';
import { seedUsers } from '../users/seed';

describe('Auth', () => {
  jest.setTimeout(120000);

  const context = setupE2EApp({
    imports: [UsersModule, HealthcheckModule, ActionPlansModule],
    entities: [UsersEntity, ActionPlansEntity],
    seed: seedUsers,
  });

  beforeAll(async () => {
    await context;
  });

  afterAll(async () => {
    await teardownE2EApp(await context);
  });

  it('logs in and sets an HttpOnly Path=/auth refresh cookie with user in the body', async () => {
    const { app, seed } = await context;

    const result = await login(
      app,
      seed.existentUser.email,
      SEEDED_USER_PASSWORD,
    );

    expect(result.response.status).toBe(200);
    expect(result.response.body.accessToken).toEqual(expect.any(String));
    expect(result.response.body.tokenType).toBe('Bearer');
    expect(result.response.body.expiresIn).toBe(900);
    expect(result.response.body.user).toEqual({
      id: seed.existentUser.id,
      email: seed.existentUser.email,
    });
    expect(result.response.body.refreshToken).toBeUndefined();
    expect(result.response.body.password).toBeUndefined();
    expect(result.response.body.passwordHash).toBeUndefined();

    const setCookie = refreshCookieHeaderFrom(result.response);
    expect(setCookie).toBeDefined();
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Path=\/auth/i);
  });

  it('returns 401 Invalid credentials. for an unknown email', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'missing@email.com', password: SEEDED_USER_PASSWORD });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials.');
    expect(refreshCookieHeaderFrom(response)).toBeUndefined();
  });

  it('returns 401 Invalid credentials. for a wrong password', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: EXISTENT_USER_EMAIL, password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials.');
    expect(refreshCookieHeaderFrom(response)).toBeUndefined();
  });

  it('returns 400 when credentials are missing', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({});

    expect(response.status).toBe(400);
    expect(refreshCookieHeaderFrom(response)).toBeUndefined();
  });

  it('refreshes with a new access token, rotated cookie, and user', async () => {
    const { app, seed } = await context;
    const loggedIn = await login(
      app,
      seed.existentUser.email,
      SEEDED_USER_PASSWORD,
    );
    const previousCookie = refreshCookieHeaderFrom(loggedIn.response);

    // JWT iat has 1-second resolution; wait so the rotated access token differs.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookieNameValueFrom(previousCookie as string));

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.accessToken).not.toBe(loggedIn.accessToken);
    expect(response.body.user).toEqual({
      id: seed.existentUser.id,
      email: seed.existentUser.email,
    });
    const rotated = refreshCookieHeaderFrom(response);
    expect(rotated).toBeDefined();
    expect(cookieNameValueFrom(rotated as string)).not.toBe(
      cookieNameValueFrom(previousCookie as string),
    );
  });

  it('returns 401 when the refresh cookie is missing', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer()).post('/auth/refresh');

    expect(response.status).toBe(401);
  });

  it('revokes the family when a rotated refresh token is replayed', async () => {
    const { app, seed } = await context;
    const loggedIn = await login(
      app,
      seed.existentUser.email,
      SEEDED_USER_PASSWORD,
    );
    const tokenA = refreshCookieHeaderFrom(loggedIn.response) as string;

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookieNameValueFrom(tokenA));
    const tokenB = refreshCookieHeaderFrom(refreshResponse) as string;

    const replay = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookieNameValueFrom(tokenA));

    expect(replay.status).toBe(401);

    const later = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookieNameValueFrom(tokenB));

    expect(later.status).toBe(401);
  });

  it('logs out and rejects the previous refresh token', async () => {
    const { app, seed } = await context;
    const loggedIn = await login(
      app,
      seed.existentUser.email,
      SEEDED_USER_PASSWORD,
    );
    const cookie = refreshCookieHeaderFrom(loggedIn.response) as string;

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookieNameValueFrom(cookie));

    expect(logout.status).toBe(204);
    expect(logout.body).toEqual({});

    const refresh = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookieNameValueFrom(cookie));

    expect(refresh.status).toBe(401);
  });

  it('returns 204 when logging out without a cookie', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer()).post('/auth/logout');

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it('returns 401 on GET /action-plans without a token', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer()).get('/action-plans');

    expect(response.status).toBe(401);
  });

  it('keeps GET /healthcheck public', async () => {
    const { app } = await context;

    const response = await request(app.getHttpServer()).get('/healthcheck');

    expect(response.status).not.toBe(401);
  });
});
