import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AUTH_ENV, loadAuthEnv } from '../../config/auth-env';
import RefreshTokensEntity from '../../database/entities/refresh-tokens.entity';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshCookieWriter } from './refresh-cookie.writer';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenIssuer } from './token-issuer.service';
import {
  LoginService,
  LogoutService,
  RefreshSessionService,
} from './use-cases';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshTokensEntity]),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
      getTracker: (req) => req.ip ?? 'unknown',
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_ENV,
      inject: [ConfigService],
      useFactory: loadAuthEnv,
    },
    JwtStrategy,
    JwtAuthGuard,
    TokenIssuer,
    RefreshCookieWriter,
    LoginService,
    RefreshSessionService,
    LogoutService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AuthModule {}
