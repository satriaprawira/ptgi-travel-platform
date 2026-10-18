import { randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/**
 * Password hashing with Node's built-in scrypt (no native dependency). Stored as
 * `scrypt$N$r$p$salt$hash` (salt and hash base64url), so the cost can be raised later without
 * breaking existing hashes. Pure functions, no framework: tested in password.spec.ts.
 */

// OWASP's recommended scrypt cost: N=2^17, r=8, p=1 (128 MiB, a few hundred ms per hash).
const COST = { N: 2 ** 17, r: 8, p: 1 };
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

function deriveKey(password: string, salt: Buffer, N: number, r: number, p: number): Promise<Buffer> {
  // scrypt needs 128 * N * r bytes; Node's default limit (32 MiB) is lower than that.
  const options: ScryptOptions = { N, r, p, maxmem: 256 * N * r };
  return new Promise((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string, cost: { N: number; r: number; p: number } = COST): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, cost.N, cost.r, cost.p);
  return ['scrypt', cost.N, cost.r, cost.p, salt.toString('base64url'), key.toString('base64url')].join('$');
}

/** True when `password` matches `stored`. A malformed `stored` value never matches. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every((value) => Number.isInteger(value) && value > 0)) return false;
  const expected = Buffer.from(parts[5], 'base64url');
  if (expected.length !== KEY_LENGTH) return false;
  const key = await deriveKey(password, Buffer.from(parts[4], 'base64url'), N, r, p);
  return timingSafeEqual(key, expected);
}

// No look-alike characters (0/O, 1/l/I), so it can be read out or typed from a note.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** A one-time password for a new account or a reset: 4 groups of 4, about 94 bits. */
export function generateTemporaryPassword(): string {
  const groups = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''),
  );
  return groups.join('-');
}
