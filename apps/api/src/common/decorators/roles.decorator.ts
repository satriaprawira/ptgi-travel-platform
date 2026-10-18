import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../auth/token.js';

export const ROLES_KEY = 'roles';
export const ALLOW_PASSWORD_CHANGE_KEY = 'allowPasswordChange';

/**
 * Limits a controller or route to these roles (checked by AdminAuthGuard). Without it, any signed-in
 * user may call it. A route-level @Roles replaces the controller's.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Reachable while the user still has a temporary password; every other admin route answers 403 until
 * they set their own.
 */
export const AllowPasswordChange = () => SetMetadata(ALLOW_PASSWORD_CHANGE_KEY, true);
