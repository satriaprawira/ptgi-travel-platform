import { describe, expect, it } from 'vitest';
import { generateTemporaryPassword, hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from './password.js';

// A low cost keeps the suite fast; the production cost is checked once below.
const FAST = { N: 2 ** 10, r: 8, p: 1 };

describe('hashPassword / verifyPassword', () => {
  it('accepts the right password and rejects others', async () => {
    const stored = await hashPassword('correct horse battery', FAST);
    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
    expect(await verifyPassword('correct horse batterY', stored)).toBe(false);
    expect(await verifyPassword('', stored)).toBe(false);
  });

  it('salts every hash', async () => {
    const [a, b] = await Promise.all([hashPassword('same password', FAST), hashPassword('same password', FAST)]);
    expect(a).not.toBe(b);
  });

  it('stores the cost with the hash, so older hashes keep working after it is raised', async () => {
    const stored = await hashPassword('correct horse battery', FAST);
    expect(stored).toMatch(/^scrypt\$1024\$8\$1\$[\w-]+\$[\w-]+$/);
    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
  });

  it('uses the production cost by default', async () => {
    const stored = await hashPassword('correct horse battery');
    expect(stored.startsWith('scrypt$131072$8$1$')).toBe(true);
    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
  });

  it('treats unicode forms of the same text as equal', async () => {
    const stored = await hashPassword('café password', FAST); // é as one code point
    expect(await verifyPassword('café password', stored)).toBe(true); // e + combining accent
  });

  it.each(['', 'scrypt', 'bcrypt$1024$8$1$c2FsdA$aGFzaA', 'scrypt$x$8$1$c2FsdA$aGFzaA', 'scrypt$1024$8$1$c2FsdA$short'])(
    'never matches a malformed stored value %j',
    async (stored) => {
      expect(await verifyPassword('anything', stored)).toBe(false);
    },
  );
});

describe('generateTemporaryPassword', () => {
  it('is long enough for the password rule, readable, and different every time', () => {
    const passwords = new Set(Array.from({ length: 50 }, generateTemporaryPassword));
    expect(passwords.size).toBe(50);
    for (const password of passwords) {
      expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9]{4}(-[A-HJ-NP-Za-km-z2-9]{4}){3}$/);
      expect(password.length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH);
    }
  });
});
