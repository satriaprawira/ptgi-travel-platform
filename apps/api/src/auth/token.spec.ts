import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { safeEqual, signToken, TOKEN_TTL_SECONDS, verifyToken } from './token.js';

const SECRET = 'a'.repeat(48);
const NOW = new Date('2026-10-01T00:00:00Z');
const later = (seconds: number) => new Date(NOW.getTime() + seconds * 1000);

describe('signToken / verifyToken', () => {
  it('round-trips the email and role', () => {
    const token = signToken('demo@goal-intl.test', 'admin', SECRET, NOW);
    expect(verifyToken(token, SECRET, NOW)).toMatchObject({ sub: 'demo@goal-intl.test', role: 'admin' });
  });

  it('expires after 12 hours', () => {
    const token = signToken('demo@goal-intl.test', 'admin', SECRET, NOW);
    expect(verifyToken(token, SECRET, later(TOKEN_TTL_SECONDS - 1))).not.toBeNull();
    expect(verifyToken(token, SECRET, later(TOKEN_TTL_SECONDS))).toBeNull();
  });

  it('rejects a token signed with another secret', () => {
    const token = signToken('demo@goal-intl.test', 'admin', 'b'.repeat(48), NOW);
    expect(verifyToken(token, SECRET, NOW)).toBeNull();
  });

  it('rejects a token whose payload was edited', () => {
    const [header, , sig] = signToken('demo@goal-intl.test', 'admin', SECRET, NOW).split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'x', role: 'admin', iat: 0, exp: 9e9 })).toString('base64url');
    expect(verifyToken(`${header}.${forged}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it('rejects "alg": "none" and other headers', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'x', role: 'admin', iat: 0, exp: 9e9 })).toString('base64url');
    const none = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    expect(verifyToken(`${none}.${payload}.`, SECRET, NOW)).toBeNull();

    // Even correctly signed, a different header is refused.
    const hs512 = Buffer.from(JSON.stringify({ alg: 'HS512', typ: 'JWT' })).toString('base64url');
    const sig = createHmac('sha256', SECRET).update(`${hs512}.${payload}`).digest('base64url');
    expect(verifyToken(`${hs512}.${payload}.${sig}`, SECRET, NOW)).toBeNull();
  });

  it.each(['', 'abc', 'a.b', 'a.b.c.d', '..'])('rejects malformed token %j', (token) => {
    expect(verifyToken(token, SECRET, NOW)).toBeNull();
  });
});

describe('safeEqual', () => {
  it('compares exactly', () => {
    expect(safeEqual('correct horse', 'correct horse')).toBe(true);
    expect(safeEqual('correct horse', 'correct hors')).toBe(false);
    expect(safeEqual('', 'x')).toBe(false);
  });
});
