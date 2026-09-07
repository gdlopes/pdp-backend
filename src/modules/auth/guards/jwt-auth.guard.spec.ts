import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from '../strategies/jwt.strategy';

describe('JwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const jwtStrategy = {
    validate: jest.fn().mockReturnValue({ id: 'user-1' }),
  } as unknown as JwtStrategy;

  const guard = new JwtAuthGuard(reflector, jwtStrategy);

  const contextFor = (url: string, authorization?: string): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ url, headers: { authorization } }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows public routes without a token', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

    expect(guard.canActivate(contextFor('/healthcheck'))).toBe(true);
  });

  it('allows swagger docs without a token', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    expect(guard.canActivate(contextFor('/api/docs'))).toBe(true);
  });

  it('rejects a protected route without a token', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    expect(() => guard.canActivate(contextFor('/action-plans'))).toThrow(
      UnauthorizedException,
    );
  });
});
