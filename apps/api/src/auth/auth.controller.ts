import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminAuthGuard, type AuthenticatedRequest } from '../common/guards/admin-auth.guard.js';
import type { EnvironmentVariables } from '../config/env.validation.js';
import { LoginDto } from './dto/login.dto.js';
import { safeEqual, signToken, TOKEN_TTL_SECONDS } from './token.js';

/**
 * Demo login: one admin account from DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD, so the client can try the
 * admin on the live site before a real auth provider (Auth.js or Clerk) is chosen. No user table.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    const email = this.config.get('DEMO_ADMIN_EMAIL', { infer: true })?.toLowerCase();
    const password = this.config.get('DEMO_ADMIN_PASSWORD', { infer: true });
    const secret = this.config.get('AUTH_TOKEN_SECRET', { infer: true });
    // Env validation guarantees all three or none.
    if (!email || !password || !secret) {
      throw new ServiceUnavailableException('Sign-in is not configured on this server');
    }

    // Both comparisons always run, so the response time doesn't reveal which one failed.
    const emailOk = safeEqual(dto.email.toLowerCase(), email);
    const passwordOk = safeEqual(dto.password, password);
    if (!emailOk || !passwordOk) throw new UnauthorizedException('Incorrect email or password');

    const now = new Date();
    return {
      accessToken: signToken(email, 'admin', secret, now),
      expiresAt: new Date(now.getTime() + TOKEN_TTL_SECONDS * 1000).toISOString(),
      user: { email, role: 'admin' as const },
    };
  }

  /** Who is signed in. With AUTH_DISABLED (local development only) there is no token to read. */
  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.user
      ? { email: request.user.sub, role: request.user.role, authDisabled: false }
      : { email: 'local development', role: 'admin' as const, authDisabled: true };
  }
}
