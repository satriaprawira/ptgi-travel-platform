import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { signToken, TOKEN_TTL_SECONDS, verifyToken } from './token.js';

const SECRET = 'a'.repeat(48);
const NOW = new Date('2026-10-01T00:00:00Z');
const later = (seconds: number) => new Date(NOW.getTime() + seconds * 1000);
const USER = { id: '6f1c7e0a-0000-4000-8000-000000000001', role: 'staff' as const, tokenVersion: 3 };
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const HS256 = encode({ alg: 'HS256', typ: 'JWT' });
const signed = (payload: object) => {
  const unsigned = `${HS256}.${encode(payload)}`;
  return `${unsigned}.${createHmac('sha256', SECRET).update(unsigned).digest('base64url')}`;
};

describe('signToken / verifyToken', () => {
  it('round-trips the user id, role and token version', () => {
    const token = signToken(USER, SECRET, NOW);
    expect(verifyToken(token, SECRET, NOW)).toMatchObject({ sub: USER.id, role: 'staff', ver: 3 });
  });

  it('expires after 12 hours', () => {
    const token = signToken(USER, SECRET, NOW);
    expect(verifyToken(token, SECRET, later(TOKEN_TTL_SECONDS - 1))).not.toBeNull();
    expect(verifyToken(token, SECRET, later(TOKEN_TTL_SECONDS))).toBeNull();
  });

  it('rejects a token signed with another secret', () => {
    const token = signToken(USER, 'b'.repeat(48), NOW);
    expect(verifyToken(token, SECRET, NOW)).toBeNull();
  });

  it('rejects a token whose payload was edited', () => {
    const [header, , sig] = signToken(USER, SECRET, NOW).split('.');
    const forged = encode({ sub: USER.id, role: 'admin', ver: 3, iat: 0, exp: 9e9 });
    expect(verifyToken(`${header}.${forged}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it('rejects "alg": "none" and other headers', () => {
    const payload = encode({ sub: 'x', role: 'admin', ver: 0, iat: 0, exp: 9e9 });
    const none = encode({ alg: 'none', typ: 'JWT' });
    expect(verifyToken(`${none}.${payload}.`, SECRET, NOW)).toBeNull();
    // Even correctly signed, a different header is refused.
    const hs512 = encode({ alg: 'HS512', typ: 'JWT' });
    const sig = createHmac('sha256', SECRET).update(`${hs512}.${payload}`).digest('base64url');
    expect(verifyToken(`${hs512}.${payload}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it.each([
    ['an unknown role', { sub: 'x', role: 'owner', ver: 0, iat: 0, exp: 9e9 }],
    ['no token version', { sub: 'x', role: 'admin', iat: 0, exp: 9e9 }],
    ['a fractional token version', { sub: 'x', role: 'admin', ver: 1.5, iat: 0, exp: 9e9 }],
    ['the old demo-login shape', { sub: 'demo@goal-intl.test', role: 'admin', iat: 0, exp: 9e9 }],
  ])('rejects a correctly signed token with %s', (_, payload) => {
    expect(verifyToken(signed(payload), SECRET, NOW)).toBeNull();
  });

  it.each(['', 'abc', 'a.b', 'a.b.c.d', '..'])('rejects malformed token %j', (token) => {
    expect(verifyToken(token, SECRET, NOW)).toBeNull();
  });
});
