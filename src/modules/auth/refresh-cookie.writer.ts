import { Inject, Injectable } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { AUTH_ENV, AuthEnv } from '../../config/auth-env';

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/auth';

@Injectable()
export class RefreshCookieWriter {
  constructor(@Inject(AUTH_ENV) private readonly authEnv: AuthEnv) {}

  set(reply: FastifyReply, raw: string): void {
    reply.setCookie(REFRESH_COOKIE_NAME, raw, {
      httpOnly: true,
      path: REFRESH_COOKIE_PATH,
      sameSite: this.authEnv.cookieSameSite,
      secure: this.authEnv.cookieSecure,
      maxAge: Math.floor(this.authEnv.refreshTtlMs / 1000),
    });
  }

  clear(reply: FastifyReply): void {
    reply.clearCookie(REFRESH_COOKIE_NAME, {
      path: REFRESH_COOKIE_PATH,
    });
  }
}
