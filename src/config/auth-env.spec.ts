import { ConfigService } from '@nestjs/config';
import {
  assertJwtAccessSecret,
  loadAuthEnv,
  MAX_ACCESS_EXPIRES_IN_SECONDS,
} from './auth-env';

describe('assertJwtAccessSecret', () => {
  it('returns the secret when it is at least 32 characters', () => {
    const secret = 'abcdefghijklmnopqrstuvwxyz012345';

    expect(assertJwtAccessSecret(secret)).toBe(secret);
  });

  it('throws when the secret is missing', () => {
    expect(() => assertJwtAccessSecret(undefined)).toThrow(
      'JWT_ACCESS_SECRET must be set and at least 32 characters',
    );
  });

  it('throws when the secret is shorter than 32 characters', () => {
    expect(() => assertJwtAccessSecret('too-short')).toThrow(
      'JWT_ACCESS_SECRET must be set and at least 32 characters',
    );
  });
});

describe('loadAuthEnv', () => {
  const validEnv: Record<string, string> = {
    JWT_ACCESS_SECRET: 'abcdefghijklmnopqrstuvwxyz012345',
    JWT_ISSUER: 'pdp-api',
    JWT_AUDIENCE: 'pdp-client',
    JWT_ACCESS_EXPIRES_IN: '900',
    REFRESH_TOKEN_TTL_DAYS: '7',
    COOKIE_SECURE: 'false',
    COOKIE_SAMESITE: 'lax',
    CORS_ORIGINS: 'http://localhost:3000',
  };

  const configFrom = (env: Record<string, string>): ConfigService =>
    ({
      get: (key: string) => env[key],
    }) as ConfigService;

  it('loads auth env from config', () => {
    const authEnv = loadAuthEnv(configFrom(validEnv));

    expect(authEnv.issuer).toBe('pdp-api');
    expect(authEnv.audience).toBe('pdp-client');
    expect(authEnv.accessExpiresInSeconds).toBe(900);
    expect(authEnv.refreshTtlMs).toBe(7 * 24 * 60 * 60 * 1000);
    expect(authEnv.cookieSecure).toBe(false);
    expect(authEnv.cookieSameSite).toBe('lax');
    expect(authEnv.corsOrigins).toEqual(['http://localhost:3000']);
  });

  it('caps access token lifetime at 900 seconds', () => {
    const authEnv = loadAuthEnv(
      configFrom({ ...validEnv, JWT_ACCESS_EXPIRES_IN: '3600' }),
    );

    expect(authEnv.accessExpiresInSeconds).toBe(MAX_ACCESS_EXPIRES_IN_SECONDS);
  });

  it('forces Secure when SameSite is None', () => {
    const authEnv = loadAuthEnv(
      configFrom({
        ...validEnv,
        COOKIE_SAMESITE: 'none',
        COOKIE_SECURE: 'false',
      }),
    );

    expect(authEnv.cookieSameSite).toBe('none');
    expect(authEnv.cookieSecure).toBe(true);
  });

  it('refuses to load when JWT_ACCESS_SECRET is missing', () => {
    const withoutSecret = { ...validEnv };
    delete withoutSecret.JWT_ACCESS_SECRET;

    expect(() => loadAuthEnv(configFrom(withoutSecret))).toThrow(
      'JWT_ACCESS_SECRET must be set and at least 32 characters',
    );
  });
});
