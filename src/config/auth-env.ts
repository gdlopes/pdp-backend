import { ConfigService } from '@nestjs/config';

export const JWT_ACCESS_SECRET_MIN_LENGTH = 32;
export const MAX_ACCESS_EXPIRES_IN_SECONDS = 900;
export const DEFAULT_REFRESH_TTL_DAYS = 7;
export const AUTH_ENV = 'AUTH_ENV';

export type CookieSameSite = 'lax' | 'strict' | 'none';

export type AuthEnv = {
  accessSecret: string;
  issuer: string;
  audience: string;
  accessExpiresInSeconds: number;
  refreshTtlMs: number;
  cookieSecure: boolean;
  cookieSameSite: CookieSameSite;
  corsOrigins: string[];
};

export const assertJwtAccessSecret = (secret: string | undefined): string => {
  if (!secret || secret.length < JWT_ACCESS_SECRET_MIN_LENGTH) {
    throw new Error(
      `JWT_ACCESS_SECRET must be set and at least ${JWT_ACCESS_SECRET_MIN_LENGTH} characters`,
    );
  }

  return secret;
};

const parseSameSite = (value: string | undefined): CookieSameSite => {
  const normalized = (value ?? 'lax').toLowerCase();

  if (
    normalized === 'lax' ||
    normalized === 'strict' ||
    normalized === 'none'
  ) {
    return normalized;
  }

  return 'lax';
};

export const loadAuthEnv = (config: ConfigService): AuthEnv => {
  const accessSecret = assertJwtAccessSecret(
    config.get<string>('JWT_ACCESS_SECRET'),
  );
  const issuer = config.get<string>('JWT_ISSUER');
  const audience = config.get<string>('JWT_AUDIENCE');

  if (!issuer) {
    throw new Error('JWT_ISSUER is required');
  }

  if (!audience) {
    throw new Error('JWT_AUDIENCE is required');
  }

  const parsedExpires = Number(
    config.get('JWT_ACCESS_EXPIRES_IN') ?? MAX_ACCESS_EXPIRES_IN_SECONDS,
  );
  const accessExpiresInSeconds = Number.isFinite(parsedExpires)
    ? Math.min(Math.max(parsedExpires, 1), MAX_ACCESS_EXPIRES_IN_SECONDS)
    : MAX_ACCESS_EXPIRES_IN_SECONDS;

  const ttlDays = Number(
    config.get('REFRESH_TOKEN_TTL_DAYS') ?? DEFAULT_REFRESH_TTL_DAYS,
  );
  const refreshTtlMs =
    (Number.isFinite(ttlDays) ? ttlDays : DEFAULT_REFRESH_TTL_DAYS) *
    24 *
    60 *
    60 *
    1000;

  const cookieSameSite = parseSameSite(config.get<string>('COOKIE_SAMESITE'));
  const cookieSecure =
    cookieSameSite === 'none'
      ? true
      : config.get<string>('COOKIE_SECURE') === 'true';

  const corsOrigins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    accessSecret,
    issuer,
    audience,
    accessExpiresInSeconds,
    refreshTtlMs,
    cookieSecure,
    cookieSameSite,
    corsOrigins,
  };
};
