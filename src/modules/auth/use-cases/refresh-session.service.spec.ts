import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import UsersEntity from '../../../database/entities/users.entity';
import { GetUserByIdService } from '../../users/use-cases/get-user-by-id.service';
import { TokenIssuer } from '../token-issuer.service';
import { RefreshSessionService } from './refresh-session.service';

describe('RefreshSessionService', () => {
  let service: RefreshSessionService;
  const tokenIssuer = { rotate: jest.fn() };
  const getUserByIdService = { execute: jest.fn() };
  const user = {
    id: 'user-1',
    email: 'user@email.com',
  } as UsersEntity;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionService,
        { provide: TokenIssuer, useValue: tokenIssuer },
        { provide: GetUserByIdService, useValue: getUserByIdService },
      ],
    }).compile();

    service = module.get(RefreshSessionService);
  });

  it('rotates tokens and returns the session user', async () => {
    tokenIssuer.rotate.mockResolvedValueOnce({
      accessToken: 'new-jwt',
      expiresIn: 900,
      refreshRaw: 'new-raw',
      userId: user.id,
    });
    getUserByIdService.execute.mockResolvedValueOnce(user);

    const result = await service.execute('old-raw');

    expect(result).toEqual({
      accessToken: 'new-jwt',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: user.id, email: user.email },
      refreshTokenRaw: 'new-raw',
    });
  });

  it('rejects a missing refresh token', async () => {
    await expect(service.execute(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(tokenIssuer.rotate).not.toHaveBeenCalled();
  });

  it('propagates expired or revoked failures', async () => {
    tokenIssuer.rotate.mockRejectedValueOnce(new UnauthorizedException());

    await expect(service.execute('expired-raw')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('propagates replay failures after the family is revoked', async () => {
    tokenIssuer.rotate.mockRejectedValueOnce(new UnauthorizedException());

    await expect(service.execute('replayed-raw')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
