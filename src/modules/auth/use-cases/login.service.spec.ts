import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { compare } from 'bcrypt';
import UsersEntity from '../../../database/entities/users.entity';
import { GetUserByEmailService } from '../../users/use-cases/get-user-by-email.service';
import { TokenIssuer } from '../token-issuer.service';
import { LoginService } from './login.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const compareMock = compare as jest.MockedFunction<typeof compare>;

describe('LoginService', () => {
  let service: LoginService;
  const getUserByEmailService = { execute: jest.fn() };
  const tokenIssuer = { issueSession: jest.fn() };

  const user = {
    id: 'user-1',
    email: 'user@email.com',
    passwordHash: 'stored-hash',
  } as UsersEntity;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        { provide: GetUserByEmailService, useValue: getUserByEmailService },
        { provide: TokenIssuer, useValue: tokenIssuer },
      ],
    }).compile();

    service = module.get(LoginService);
  });

  it('issues a session with user on success', async () => {
    getUserByEmailService.execute.mockResolvedValueOnce(user);
    compareMock.mockResolvedValueOnce(true as never);
    tokenIssuer.issueSession.mockResolvedValueOnce({
      accessToken: 'jwt',
      expiresIn: 900,
      refreshRaw: 'refresh-raw',
      userId: user.id,
    });

    const result = await service.execute({
      email: user.email,
      password: 'password123',
    });

    expect(result).toEqual({
      accessToken: 'jwt',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: user.id, email: user.email },
      refreshTokenRaw: 'refresh-raw',
    });
    expect(compareMock).toHaveBeenCalledWith('password123', 'stored-hash');
  });

  it('returns Invalid credentials. for an unknown email', async () => {
    getUserByEmailService.execute.mockResolvedValueOnce(null);
    compareMock.mockResolvedValueOnce(false as never);

    await expect(
      service.execute({ email: 'missing@email.com', password: 'password123' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid credentials.'));
    expect(tokenIssuer.issueSession).not.toHaveBeenCalled();
  });

  it('returns Invalid credentials. for a wrong password', async () => {
    getUserByEmailService.execute.mockResolvedValueOnce(user);
    compareMock.mockResolvedValueOnce(false as never);

    await expect(
      service.execute({ email: user.email, password: 'wrong' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid credentials.'));
    expect(tokenIssuer.issueSession).not.toHaveBeenCalled();
  });

  it('uses the same exception message for unknown email and wrong password', async () => {
    getUserByEmailService.execute.mockResolvedValueOnce(null);
    compareMock.mockResolvedValueOnce(false as never);

    let unknownMessage: string | undefined;
    try {
      await service.execute({
        email: 'missing@email.com',
        password: 'password123',
      });
    } catch (error) {
      unknownMessage = (error as UnauthorizedException).message;
    }

    getUserByEmailService.execute.mockResolvedValueOnce(user);
    compareMock.mockResolvedValueOnce(false as never);

    let wrongPasswordMessage: string | undefined;
    try {
      await service.execute({ email: user.email, password: 'wrong' });
    } catch (error) {
      wrongPasswordMessage = (error as UnauthorizedException).message;
    }

    expect(unknownMessage).toBe('Invalid credentials.');
    expect(unknownMessage).toBe(wrongPasswordMessage);
  });
});
