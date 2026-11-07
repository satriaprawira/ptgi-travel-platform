import { describe, expect, it } from 'vitest';
import { HOLD_HOURS, holdUntil, tripEnd } from './hold.js';

const pickup = new Date('2026-11-20T01:30:00Z'); // 10:30 in Tokyo

describe('holdUntil', () => {
  it('holds the car for 3 hours plus the buffer', () => {
    expect(HOLD_HOURS).toBe(3);
    expect(holdUntil(pickup, 30).toISOString()).toBe('2026-11-20T05:00:00.000Z'); // 14:00 Tokyo
    expect(holdUntil(pickup, 60).toISOString()).toBe('2026-11-20T05:30:00.000Z');
  });

  it('is exactly 3 hours with no buffer (bookings made before the buffer existed)', () => {
    expect(holdUntil(pickup, 0).toISOString()).toBe('2026-11-20T04:30:00.000Z');
  });

  it('crosses midnight like any other time', () => {
    expect(holdUntil(new Date('2026-11-20T13:00:00Z'), 30).toISOString()).toBe('2026-11-20T16:30:00.000Z');
  });
});

describe('tripEnd', () => {
  it('is the hold end minus the buffer, i.e. pickup + 3 hours', () => {
    expect(tripEnd(holdUntil(pickup, 45), 45).toISOString()).toBe('2026-11-20T04:30:00.000Z');
  });
});
