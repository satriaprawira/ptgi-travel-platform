import { CanActivate, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';

/**
 * Protects every /v1/admin route. No auth provider is chosen yet (design doc Q2), so this fails
 * closed: requests are refused unless AUTH_DISABLED=true, which env validation only accepts in
 * development. JWT verification and the `admin` role check replace the refusal once a provider lands.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  canActivate(): boolean {
    if (this.config.get('AUTH_DISABLED', { infer: true })) return true;
    throw new UnauthorizedException('Admin authentication is not configured');
  }
}
