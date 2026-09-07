import { Injectable, UnauthorizedException } from '@nestjs/common';
import { GetUserByIdService } from '../../users/use-cases/get-user-by-id.service';
import { TokenIssuer } from '../token-issuer.service';
import { AuthSessionResult } from '../types/auth-session-result';

@Injectable()
export class RefreshSessionService {
  constructor(
    private readonly tokenIssuer: TokenIssuer,
    private readonly getUserByIdService: GetUserByIdService,
  ) {}

  async execute(refreshTokenRaw?: string): Promise<AuthSessionResult> {
    if (!refreshTokenRaw) {
      throw new UnauthorizedException();
    }

    const session = await this.tokenIssuer.rotate(refreshTokenRaw);
    const user = await this.getUserByIdService.execute(session.userId);

    return {
      accessToken: session.accessToken,
      tokenType: 'Bearer',
      expiresIn: session.expiresIn,
      user: { id: user.id, email: user.email },
      refreshTokenRaw: session.refreshRaw,
    };
  }
}
