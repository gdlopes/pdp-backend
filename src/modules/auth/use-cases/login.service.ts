import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { GetUserByEmailService } from '../../users/use-cases/get-user-by-email.service';
import { LoginDto } from '../dto/login.dto';
import { TokenIssuer } from '../token-issuer.service';
import { AuthSessionResult } from '../types/auth-session-result';

const DUMMY_PASSWORD_HASH =
  '$2b$12$yjxORD7FBdpUvj0hZTm/LeereWAy2ZtZ.URm3W1kaoaDz34m8NKla';

const INVALID_CREDENTIALS = 'Invalid credentials.';

@Injectable()
export class LoginService {
  constructor(
    private readonly getUserByEmailService: GetUserByEmailService,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute(loginDto: LoginDto): Promise<AuthSessionResult> {
    const user = await this.getUserByEmailService.execute(loginDto.email);
    const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordMatches = await compare(loginDto.password, passwordHash);

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const session = await this.tokenIssuer.issueSession(user.id);

    return {
      accessToken: session.accessToken,
      tokenType: 'Bearer',
      expiresIn: session.expiresIn,
      user: { id: user.id, email: user.email },
      refreshTokenRaw: session.refreshRaw,
    };
  }
}
