import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Demo login tokens: standard HS256 JWTs signed with AUTH_TOKEN_SECRET, so a real auth provider's
 * JWTs (with the same `role` claim) can replace them without changing AdminAuthGuard's contract.
 * Pure functions, no framework: tested in token.spec.ts.
 */

export type Role = 'admin';

export interface TokenPayload {
  sub: string; // the signed-in email
  role: Role;
  iat: number; // seconds since epoch
  exp: number;
}

export const TOKEN_TTL_SECONDS = 12 * 60 * 60;

const base64url = (data: Buffer | string) => Buffer.from(data).toString('base64url');
const HEADER = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

const signature = (unsigned: string, secret: string) => createHmac('sha256', secret).update(unsigned).digest();

export function signToken(sub: string, role: Role, secret: string, now: Date = new Date()): string {
  const iat = Math.floor(now.getTime() / 1000);
  const payload: TokenPayload = { sub, role, iat, exp: iat + TOKEN_TTL_SECONDS };
  const unsigned = `${HEADER}.${base64url(JSON.stringify(payload))}`;
  return `${unsigned}.${base64url(signature(unsigned, secret))}`;
}

/** The payload if the token is well-formed, signed with `secret`, HS256 and not expired; otherwise null. */
export function verifyToken(token: string, secret: string, now: Date = new Date()): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;

  // Only our own header is accepted, which rules out "alg": "none" and algorithm swaps.
  if (header !== HEADER) return null;

  const expected = signature(`${header}.${payload}`, secret);
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  let claims: Partial<TokenPayload>;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (typeof claims.sub !== 'string' || claims.role !== 'admin' || typeof claims.exp !== 'number') return null;
  if (claims.exp <= Math.floor(now.getTime() / 1000)) return null;
  return claims as TokenPayload;
}

/** Compares two secrets without leaking, through timing, how much of them matched. */
export function safeEqual(a: string, b: string): boolean {
  const hash = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(a), hash(b));
}
