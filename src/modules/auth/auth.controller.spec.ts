import { Test, TestingModule } from '@nestjs/testing';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthController } from './auth.controller';
import {
  REFRESH_COOKIE_NAME,
  RefreshCookieWriter,
} from './refresh-cookie.writer';
import { LoginService } from './use-cases/login.service';
import { LogoutService } from './use-cases/logout.service';
import { RefreshSessionService } from './use-cases/refresh-session.service';

describe('AuthController', () => {
  let controller: AuthController;
  const loginService = { execute: jest.fn() };
  const refreshSessionService = { execute: jest.fn() };
  const logoutService = { execute: jest.fn() };
  const refreshCookieWriter = { set: jest.fn(), clear: jest.fn() };
  const reply = {} as FastifyReply;

  const session = {
    accessToken: 'jwt',
    tokenType: 'Bearer' as const,
    expiresIn: 900,
    user: { id: 'user-1', email: 'user@email.com' },
    refreshTokenRaw: 'refresh-raw',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginService, useValue: loginService },
        { provide: RefreshSessionService, useValue: refreshSessionService },
        { provide: LogoutService, useValue: logoutService },
        { provide: RefreshCookieWriter, useValue: refreshCookieWriter },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('login delegates to LoginService and sets the refresh cookie', async () => {
    loginService.execute.mockResolvedValueOnce(session);

    const result = await controller.login(
      { email: 'user@email.com', password: 'password123' },
      reply,
    );

    expect(loginService.execute).toHaveBeenCalledWith({
      email: 'user@email.com',
      password: 'password123',
    });
    expect(refreshCookieWriter.set).toHaveBeenCalledWith(reply, 'refresh-raw');
    expect(result).toEqual({
      accessToken: 'jwt',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: session.user,
    });
  });

  it('refresh delegates to RefreshSessionService', async () => {
    refreshSessionService.execute.mockResolvedValueOnce({
      ...session,
      refreshTokenRaw: 'rotated-raw',
    });
    const request = {
      cookies: { [REFRESH_COOKIE_NAME]: 'old-raw' },
    } as unknown as FastifyRequest;

    const result = await controller.refresh(request, reply);

    expect(refreshSessionService.execute).toHaveBeenCalledWith('old-raw');
    expect(refreshCookieWriter.set).toHaveBeenCalledWith(reply, 'rotated-raw');
    expect(result.accessToken).toBe('jwt');
  });

  it('logout delegates to LogoutService and clears the cookie', async () => {
    const request = {
      cookies: { [REFRESH_COOKIE_NAME]: 'refresh-raw' },
    } as unknown as FastifyRequest;

    await controller.logout(request, reply);

    expect(logoutService.execute).toHaveBeenCalledWith('refresh-raw');
    expect(refreshCookieWriter.clear).toHaveBeenCalledWith(reply);
  });
});
