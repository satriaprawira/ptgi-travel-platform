import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { verifyToken, type TokenPayload } from '../../auth/token.js';
import type { EnvironmentVariables } from '../../config/env.validation.js';

export type AuthenticatedRequest = Request & { user?: TokenPayload };

/**
 * Protects every /v1/admin route. Allowed when:
 * - AUTH_DISABLED=true (env validation only accepts it in local development), or
 * - the request carries `Authorization: Bearer <token>` from POST /v1/auth/login, signed with
 *   AUTH_TOKEN_SECRET, unexpired, with role "admin".
 * Without the demo-login variables, admin routes stay locked. A real auth provider replaces the
 * token issuer later; this guard keeps the same contract (a JWT with a `role` claim).
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get('AUTH_DISABLED', { infer: true })) return true;

    const secret = this.config.get('AUTH_TOKEN_SECRET', { infer: true });
    if (!secret) throw new UnauthorizedException('Admin authentication is not configured');

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = /^Bearer (.+)$/.exec(request.headers.authorization ?? '')?.[1];
    const payload = token ? verifyToken(token, secret) : null;
    if (!payload) throw new UnauthorizedException('Please sign in');

    request.user = payload;
    return true;
  }
}
