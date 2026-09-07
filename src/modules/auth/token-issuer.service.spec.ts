import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as jwt from 'jsonwebtoken';
import { AUTH_ENV, AuthEnv } from '../../config/auth-env';
import RefreshTokensEntity from '../../database/entities/refresh-tokens.entity';
import { hashRefreshToken, TokenIssuer } from './token-issuer.service';

const authEnv: AuthEnv = {
  accessSecret: 'abcdefghijklmnopqrstuvwxyz012345',
  issuer: 'pdp-api',
  audience: 'pdp-client',
  accessExpiresInSeconds: 900,
  refreshTtlMs: 7 * 24 * 60 * 60 * 1000,
  cookieSecure: false,
  cookieSameSite: 'lax',
  corsOrigins: [],
};

const refreshTokensRepositoryMock = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn((value) => value),
  update: jest.fn(),
};

describe('TokenIssuer', () => {
  let tokenIssuer: TokenIssuer;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenIssuer,
        { provide: AUTH_ENV, useValue: authEnv },
        {
          provide: getRepositoryToken(RefreshTokensEntity),
          useValue: refreshTokensRepositoryMock,
        },
      ],
    }).compile();

    tokenIssuer = module.get(TokenIssuer);
  });

  describe('#issueSession', () => {
    it('signs an access JWT and stores a hashed refresh token', async () => {
      refreshTokensRepositoryMock.save.mockImplementation(async (entity) => ({
        ...entity,
        id: 'refresh-1',
      }));

      const result = await tokenIssuer.issueSession('user-1');
      const payload = jwt.verify(result.accessToken, authEnv.accessSecret, {
        issuer: authEnv.issuer,
        audience: authEnv.audience,
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;

      expect(payload.sub).toBe('user-1');
      expect(result.expiresIn).toBe(900);
      expect(result.userId).toBe('user-1');
      expect(result.refreshRaw).toEqual(expect.any(String));
      expect(refreshTokensRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          tokenHash: hashRefreshToken(result.refreshRaw),
          revokedAt: null,
        }),
      );
    });
  });

  describe('#rotate', () => {
    const raw = 'current-refresh';
    const currentRow = () => ({
      id: 'token-a',
      userId: 'user-1',
      familyId: 'family-1',
      tokenHash: hashRefreshToken(raw),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null as Date | null,
      replacedById: null as string | null,
    });

    it('revokes the current token and issues a sibling', async () => {
      refreshTokensRepositoryMock.findOne.mockResolvedValueOnce(currentRow());
      refreshTokensRepositoryMock.save
        .mockResolvedValueOnce({ id: 'token-b' })
        .mockResolvedValueOnce({ ...currentRow(), revokedAt: new Date() });

      const result = await tokenIssuer.rotate(raw);

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshRaw).not.toBe(raw);
      expect(refreshTokensRepositoryMock.save).toHaveBeenCalledTimes(2);
    });

    it('rejects an unknown token', async () => {
      refreshTokensRepositoryMock.findOne.mockResolvedValueOnce(null);

      await expect(tokenIssuer.rotate(raw)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an expired token', async () => {
      refreshTokensRepositoryMock.findOne.mockResolvedValueOnce({
        ...currentRow(),
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(tokenIssuer.rotate(raw)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(refreshTokensRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('revokes the family when a rotated token is reused', async () => {
      refreshTokensRepositoryMock.findOne.mockResolvedValueOnce({
        ...currentRow(),
        revokedAt: new Date(),
      });

      await expect(tokenIssuer.rotate(raw)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(refreshTokensRepositoryMock.update).toHaveBeenCalledWith(
        { familyId: 'family-1' },
        { revokedAt: expect.any(Date) },
      );
    });
  });
});
