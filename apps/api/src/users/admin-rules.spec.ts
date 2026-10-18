import { describe, expect, it } from 'vitest';
import { accessChangeProblem } from './admin-rules.js';
import { UserRole, UserStatus } from './dto/create-user.dto.js';

const { Admin, Staff } = UserRole;
const { Active, Disabled } = UserStatus;

const change = (overrides: Partial<Parameters<typeof accessChangeProblem>[0]>) =>
  accessChangeProblem({
    actorId: 'actor',
    target: { id: 'target', role: Admin, status: Active },
    next: { role: Admin, status: Active },
    otherActiveAdmins: 1,
    ...overrides,
  });

describe('accessChangeProblem', () => {
  it('allows changes that keep the target an active admin', () => {
    expect(change({})).toBeNull();
    expect(change({ actorId: 'target', otherActiveAdmins: 0 })).toBeNull();
  });

  it('allows demoting or disabling another admin while another active admin remains', () => {
    expect(change({ next: { role: Staff, status: Active } })).toBeNull();
    expect(change({ next: { role: Admin, status: Disabled } })).toBeNull();
  });

  it('refuses removing the last active admin', () => {
    expect(change({ next: { role: Staff, status: Active }, otherActiveAdmins: 0 })).toMatch(/at least one active admin/);
    expect(change({ actorId: null, next: { role: Admin, status: Disabled }, otherActiveAdmins: 0 })).toMatch(
      /at least one active admin/,
    );
  });

  it('refuses an admin demoting or disabling themselves, even with other admins', () => {
    expect(change({ actorId: 'target', next: { role: Staff, status: Active }, otherActiveAdmins: 3 })).toMatch(/your own/);
    expect(change({ actorId: 'target', next: { role: Admin, status: Disabled }, otherActiveAdmins: 3 })).toMatch(
      /your own/,
    );
  });

  it('ignores staff and disabled accounts', () => {
    const staff = { id: 'target', role: Staff, status: Active };
    expect(change({ target: staff, next: { role: Staff, status: Disabled }, otherActiveAdmins: 0 })).toBeNull();
    const disabledAdmin = { id: 'target', role: Admin, status: Disabled };
    expect(change({ target: disabledAdmin, next: { role: Staff, status: Disabled }, otherActiveAdmins: 0 })).toBeNull();
  });
});
