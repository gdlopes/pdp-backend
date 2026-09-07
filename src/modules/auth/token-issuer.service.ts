import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { sign } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { AUTH_ENV, AuthEnv } from '../../config/auth-env';
import RefreshTokensEntity from '../../database/entities/refresh-tokens.entity';

export type IssuedTokens = {
  accessToken: string;
  expiresIn: number;
  refreshRaw: string;
  userId: string;
};

@Injectable()
export class TokenIssuer {
  constructor(
    @Inject(AUTH_ENV) private readonly authEnv: AuthEnv,
    @InjectRepository(RefreshTokensEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokensEntity>,
  ) {}

  async issueSession(userId: string): Promise<IssuedTokens> {
    const refreshRaw = await this.createRefreshToken(userId);
    const { accessToken, expiresIn } = await this.signAccessToken(userId);

    return { accessToken, expiresIn, refreshRaw, userId };
  }

  async rotate(raw: string): Promise<IssuedTokens> {
    const tokenHash = hashRefreshToken(raw);
    const current = await this.refreshTokensRepository.findOne({
      where: { tokenHash },
    });

    if (!current) {
      throw new UnauthorizedException();
    }

    if (current.revokedAt) {
      await this.revokeFamily(current.familyId);
      throw new UnauthorizedException();
    }

    if (current.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException();
    }

    const refreshRaw = generateRawRefreshToken();
    const replacement = this.refreshTokensRepository.create({
      userId: current.userId,
      familyId: current.familyId,
      tokenHash: hashRefreshToken(refreshRaw),
      expiresAt: new Date(Date.now() + this.authEnv.refreshTtlMs),
      revokedAt: null,
      replacedById: null,
    });

    const savedReplacement =
      await this.refreshTokensRepository.save(replacement);

    current.revokedAt = new Date();
    current.replacedById = savedReplacement.id;
    await this.refreshTokensRepository.save(current);

    const { accessToken, expiresIn } = await this.signAccessToken(
      current.userId,
    );

    return {
      accessToken,
      expiresIn,
      refreshRaw,
      userId: current.userId,
    };
  }

  async revokeFamilyByRaw(raw: string): Promise<void> {
    const tokenHash = hashRefreshToken(raw);
    const current = await this.refreshTokensRepository.findOne({
      where: { tokenHash },
    });

    if (!current) {
      return;
    }

    await this.revokeFamily(current.familyId);
  }

  private async signAccessToken(
    userId: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const expiresIn = this.authEnv.accessExpiresInSeconds;
    const accessToken = sign({ sub: userId }, this.authEnv.accessSecret, {
      expiresIn,
      issuer: this.authEnv.issuer,
      audience: this.authEnv.audience,
      algorithm: 'HS256',
    });

    return { accessToken, expiresIn };
  }

  private async createRefreshToken(
    userId: string,
    familyId = randomUUID(),
  ): Promise<string> {
    const refreshRaw = generateRawRefreshToken();
    const entity = this.refreshTokensRepository.create({
      userId,
      familyId,
      tokenHash: hashRefreshToken(refreshRaw),
      expiresAt: new Date(Date.now() + this.authEnv.refreshTtlMs),
      revokedAt: null,
      replacedById: null,
    });

    await this.refreshTokensRepository.save(entity);

    return refreshRaw;
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.refreshTokensRepository.update(
      { familyId },
      { revokedAt: new Date() },
    );
  }
}

export const hashRefreshToken = (raw: string): string =>
  createHash('sha256').update(raw).digest('hex');

export const generateRawRefreshToken = (): string =>
  randomBytes(32).toString('base64url');
