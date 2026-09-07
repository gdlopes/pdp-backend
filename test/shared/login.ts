import { NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';

export const SEEDED_USER_PASSWORD = '123456';

export type LoginResult = {
  accessToken: string;
  cookies: string[];
  user: { id: string; email: string };
  response: request.Response;
};

export const cookieHeaderFrom = (response: request.Response): string[] => {
  const raw = response.headers['set-cookie'];

  if (!raw) {
    return [];
  }

  return Array.isArray(raw) ? raw : [raw];
};

export const refreshCookieHeaderFrom = (
  response: request.Response,
): string | undefined =>
  cookieHeaderFrom(response).find((cookie) =>
    cookie.startsWith('refresh_token='),
  );

export const cookieNameValueFrom = (setCookie: string): string =>
  setCookie.split(';')[0];

export const login = async (
  app: NestFastifyApplication,
  email: string,
  password: string,
): Promise<LoginResult> => {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });

  return {
    accessToken: response.body.accessToken,
    cookies: cookieHeaderFrom(response),
    user: response.body.user,
    response,
  };
};

export const bearer = (accessToken: string): { Authorization: string } => ({
  Authorization: `Bearer ${accessToken}`,
});
