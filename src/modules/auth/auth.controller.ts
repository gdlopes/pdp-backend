import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/cookie';
import { Public } from './decorators/public.decorator';
import { AuthSessionResponseDto } from './dto/auth-session-response.dto';
import { LoginDto } from './dto/login.dto';
import {
  REFRESH_COOKIE_NAME,
  RefreshCookieWriter,
} from './refresh-cookie.writer';
import {
  LoginService,
  LogoutService,
  RefreshSessionService,
} from './use-cases';

const AUTH_THROTTLE = { default: { limit: 10, ttl: 60000 } };

@Controller('auth')
@ApiTags('auth')
@Public()
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly refreshSessionService: RefreshSessionService,
    private readonly logoutService: LogoutService,
    private readonly refreshCookieWriter: RefreshCookieWriter,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Logs in with email and password.' })
  @ApiOkResponse({
    description: 'The user has been successfully authenticated.',
    type: AuthSessionResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Missing or invalid credentials.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const session = await this.loginService.execute(loginDto);
    this.refreshCookieWriter.set(reply, session.refreshTokenRaw);

    return toSessionBody(session);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({
    summary: 'Rotates the refresh token and issues a new access token.',
  })
  @ApiOkResponse({
    description: 'The session has been successfully refreshed.',
    type: AuthSessionResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, expired, revoked, or reused refresh token.',
  })
  @ApiTooManyRequestsResponse({ description: 'Too many refresh attempts.' })
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshTokenRaw = request.cookies?.[REFRESH_COOKIE_NAME];

    try {
      const session = await this.refreshSessionService.execute(refreshTokenRaw);
      this.refreshCookieWriter.set(reply, session.refreshTokenRaw);

      return toSessionBody(session);
    } catch (error) {
      this.refreshCookieWriter.clear(reply);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revokes the refresh-token family and clears the cookie.',
  })
  @ApiNoContentResponse({ description: 'The session has been revoked.' })
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    await this.logoutService.execute(request.cookies?.[REFRESH_COOKIE_NAME]);
    this.refreshCookieWriter.clear(reply);
  }
}

const toSessionBody = (session: {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: { id: string; email: string };
}) => ({
  accessToken: session.accessToken,
  tokenType: session.tokenType,
  expiresIn: session.expiresIn,
  user: session.user,
});
