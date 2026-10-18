import type { UserRole, UserStatus } from './dto/create-user.dto.js';

interface AccessChange {
  /** The admin making the change; null in local development with AUTH_DISABLED. */
  actorId: string | null;
  target: { id: string; role: UserRole; status: UserStatus };
  next: { role: UserRole; status: UserStatus };
  /** Active admins other than the target, counted under the users:admins lock. */
  otherActiveAdmins: number;
}

/**
 * Why a role or status change is refused, or null when it's allowed. The system must always keep at
 * least one active admin, and an admin can't lock themselves out. Pure: tested in admin-rules.spec.ts.
 */
export function accessChangeProblem({ actorId, target, next, otherActiveAdmins }: AccessChange): string | null {
  const isActiveAdmin = (user: { role: UserRole; status: UserStatus }) =>
    user.role === 'admin' && user.status === 'active';

  if (!isActiveAdmin(target) || isActiveAdmin(next)) return null;
  if (target.id === actorId) return "You can't remove your own admin access or disable your own account";
  if (otherActiveAdmins === 0) return 'Keep at least one active admin: make someone else an admin first';
  return null;
}
