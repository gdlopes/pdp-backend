import { Injectable } from '@nestjs/common';
import { TokenIssuer } from '../token-issuer.service';

@Injectable()
export class LogoutService {
  constructor(private readonly tokenIssuer: TokenIssuer) {}

  async execute(refreshTokenRaw?: string): Promise<void> {
    if (!refreshTokenRaw) {
      return;
    }

    await this.tokenIssuer.revokeFamilyByRaw(refreshTokenRaw);
  }
}
