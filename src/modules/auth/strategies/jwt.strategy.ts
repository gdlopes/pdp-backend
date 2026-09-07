import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload, verify } from 'jsonwebtoken';
import { AUTH_ENV, AuthEnv } from '../../../config/auth-env';
import { AuthenticatedUser } from '../types/authenticated-user';

@Injectable()
export class JwtStrategy {
  constructor(@Inject(AUTH_ENV) private readonly authEnv: AuthEnv) {}

  validate(token: string): AuthenticatedUser {
    let payload: JwtPayload;

    try {
      payload = verify(token, this.authEnv.accessSecret, {
        algorithms: ['HS256'],
        issuer: this.authEnv.issuer,
        audience: this.authEnv.audience,
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedException();
    }

    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    return { id: payload.sub };
  }
}
