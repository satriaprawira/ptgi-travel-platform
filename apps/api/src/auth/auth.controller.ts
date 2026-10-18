import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AllowPasswordChange } from '../common/decorators/roles.decorator.js';
import { AdminAuthGuard, type AuthenticatedRequest } from '../common/guards/admin-auth.guard.js';
import { AuthService, toSessionUser, type SessionUser } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';

/** Staff sign-in (accounts in the users table, managed in User Management). Customers don't sign in. */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.auth.login(dto, request.ip ?? 'unknown');
  }

  /** Who is signed in. With AUTH_DISABLED (local development only) nobody is, and everything is allowed. */
  @Get('me')
  @UseGuards(AdminAuthGuard)
  @AllowPasswordChange()
  me(@Req() request: AuthenticatedRequest): SessionUser {
    return request.user
      ? toSessionUser(request.user)
      : {
          id: null,
          fullName: 'Local development',
          email: 'local development',
          role: 'admin',
          mustChangePassword: false,
          authDisabled: true,
        };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminAuthGuard)
  @AllowPasswordChange()
  changePassword(@Req() request: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    if (!request.user) throw new BadRequestException('Sign-in is turned off in local development: no password to change');
    return this.auth.changePassword(request.user, dto);
  }
}
