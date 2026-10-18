import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { verifyToken, type Role } from '../../auth/token.js';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { UsersRepository, type AuthState } from '../../users/users.repository.js';
import { ALLOW_PASSWORD_CHANGE_KEY, ROLES_KEY } from '../decorators/roles.decorator.js';

/** `user` is the signed-in account, read fresh from the database; absent with AUTH_DISABLED. */
export type AuthenticatedRequest = Request & { user?: AuthState };

/**
 * Protects every /v1/admin route. Allowed when:
 * - AUTH_DISABLED=true (env validation only accepts it in local development), which counts as an admin, or
 * - the request carries `Authorization: Bearer <token>` from POST /v1/auth/login, signed with
 *   AUTH_TOKEN_SECRET and unexpired, for a user who is still active and whose token_version matches
 *   (a password change, reset or status change ends older sessions), and
 *   - the user's current role is in the route's @Roles (any role when there is none), and
 *   - the user has set their own password, unless the route is marked @AllowPasswordChange.
 * Without AUTH_TOKEN_SECRET, admin routes stay locked.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
    private readonly reflector: Reflector,
    private readonly users: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.config.get('AUTH_DISABLED', { infer: true })) return true;

    const secret = this.config.get('AUTH_TOKEN_SECRET', { infer: true });
    if (!secret) throw new UnauthorizedException('Admin authentication is not configured');

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = /^Bearer (.+)$/.exec(request.headers.authorization ?? '')?.[1];
    const payload = token ? verifyToken(token, secret) : null;
    if (!payload) throw new UnauthorizedException('Please sign in');

    const user = await this.users.findAuthState(payload.sub);
    if (!user || user.status !== 'active' || user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException('Your session has ended. Please sign in again.');
    }
    request.user = user;

    const targets = [context.getHandler(), context.getClass()];
    if (user.mustChangePassword && !this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_CHANGE_KEY, targets)) {
      throw new ForbiddenException('Change your temporary password first');
    }
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, targets);
    if (roles && !roles.includes(user.role)) {
      throw new ForbiddenException('Only an admin can do this');
    }
    return true;
  }
}
