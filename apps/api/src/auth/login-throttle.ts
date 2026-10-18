/**
 * Counts failed sign-ins per key (an email or an IP address) in a fixed window, in memory. Enough for
 * one API instance; several instances would each keep their own count. Pure: tested in
 * login-throttle.spec.ts.
 */
export class LoginThrottle {
  private readonly failures = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** 0 when another attempt is allowed; otherwise how many seconds until the window ends. */
  retryAfterSeconds(key: string, now: number = Date.now()): number {
    const entry = this.failures.get(key);
    if (!entry || entry.resetAt <= now || entry.count < this.limit) return 0;
    return Math.ceil((entry.resetAt - now) / 1000);
  }

  recordFailure(key: string, now: number = Date.now()): void {
    const entry = this.failures.get(key);
    if (!entry || entry.resetAt <= now) {
      this.failures.set(key, { count: 1, resetAt: now + this.windowMs });
      if (this.failures.size > 10_000) this.prune(now);
    } else {
      entry.count += 1;
    }
  }

  /** After a successful sign-in. */
  reset(key: string): void {
    this.failures.delete(key);
  }

  private prune(now: number): void {
    for (const [key, entry] of this.failures) {
      if (entry.resetAt <= now) this.failures.delete(key);
    }
  }
}
