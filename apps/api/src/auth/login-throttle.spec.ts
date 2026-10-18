import { describe, expect, it } from 'vitest';
import { LoginThrottle } from './login-throttle.js';

const MINUTE = 60_000;

describe('LoginThrottle', () => {
  it('allows attempts until the limit of failures, then blocks until the window ends', () => {
    const throttle = new LoginThrottle(3, 15 * MINUTE);
    for (let i = 0; i < 3; i++) {
      expect(throttle.retryAfterSeconds('a@x.test', 0)).toBe(0);
      throttle.recordFailure('a@x.test', 0);
    }
    expect(throttle.retryAfterSeconds('a@x.test', 0)).toBe(15 * 60);
    expect(throttle.retryAfterSeconds('a@x.test', 10 * MINUTE)).toBe(5 * 60);
    expect(throttle.retryAfterSeconds('a@x.test', 15 * MINUTE)).toBe(0);
  });

  it('starts a new window once the old one has ended', () => {
    const throttle = new LoginThrottle(2, MINUTE);
    throttle.recordFailure('k', 0);
    throttle.recordFailure('k', MINUTE); // first window over: count restarts at 1
    expect(throttle.retryAfterSeconds('k', MINUTE)).toBe(0);
    throttle.recordFailure('k', MINUTE + 1);
    expect(throttle.retryAfterSeconds('k', MINUTE + 1)).toBeGreaterThan(0);
  });

  it('keeps keys apart and forgets a key after a successful sign-in', () => {
    const throttle = new LoginThrottle(1, MINUTE);
    throttle.recordFailure('a', 0);
    expect(throttle.retryAfterSeconds('a', 0)).toBeGreaterThan(0);
    expect(throttle.retryAfterSeconds('b', 0)).toBe(0);
    throttle.reset('a');
    expect(throttle.retryAfterSeconds('a', 0)).toBe(0);
  });
});
