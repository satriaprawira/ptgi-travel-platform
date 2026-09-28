import { describe, expect, it } from 'vitest';
import { findOverlap, type TimeWindow } from './time-windows.js';

// The seeded windows from the price sheet.
const NIGHT: TimeWindow = { id: 'night', label: 'Night', startsAt: '22:00', endsAt: '23:00' };
const LATE: TimeWindow = { id: 'late', label: 'Late night', startsAt: '23:00', endsAt: '06:00' };
const EARLY: TimeWindow = { id: 'early', label: 'Early morning', startsAt: '06:00', endsAt: '07:00' };
const SEEDED = [NIGHT, LATE, EARLY];

const w = (startsAt: string, endsAt: string): TimeWindow => ({ id: 'new', label: 'New', startsAt, endsAt });

describe('findOverlap', () => {
  it('accepts the seeded windows: they touch but do not overlap', () => {
    for (const window of SEEDED) expect(findOverlap(window, SEEDED)).toBeNull();
  });

  it('ignores the window being edited', () => {
    expect(findOverlap({ ...LATE, startsAt: '22:30' }, [LATE])).toBeNull();
  });

  it.each([
    ['07:00', '22:00', null], // the free daytime gap
    ['21:00', '22:00', null], // ends exactly where Night starts
    ['21:00', '22:01', 'Night'],
    ['05:00', '05:30', 'Late night'], // inside the part after midnight
    ['23:30', '00:30', 'Late night'], // wraps midnight into Late night
    ['06:30', '06:45', 'Early morning'],
    ['12:00', '11:00', 'Night'], // wraps almost the whole day
  ])('%s–%s → %s', (startsAt, endsAt, expected) => {
    expect(findOverlap(w(startsAt, endsAt), SEEDED)?.label ?? null).toBe(expected);
  });

  it('lets an extended Late night grow into a hidden window only', () => {
    // Moving Late night to start at 22:00 collides with Night...
    expect(findOverlap({ ...LATE, startsAt: '22:00' }, SEEDED)?.label).toBe('Night');
    // ...but not if Night is left out (the service only compares against active windows).
    expect(findOverlap({ ...LATE, startsAt: '22:00' }, [LATE, EARLY])).toBeNull();
  });
});
