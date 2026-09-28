import { minutesOfDay } from '../pricing/quote.js';

export interface TimeWindow {
  id: string;
  label: string;
  startsAt: string; // "HH:MM"
  endsAt: string;
}

/** A window as minute ranges [start, end) within one day; a window that wraps midnight becomes two. */
function ranges(window: TimeWindow): [number, number][] {
  const start = minutesOfDay(window.startsAt);
  const end = minutesOfDay(window.endsAt);
  return start < end ? [[start, end]] : [[start, 24 * 60], [0, end]];
}

/** The first window in `others` that shares at least one minute with `window`, or null. */
export function findOverlap<T extends TimeWindow>(window: TimeWindow, others: T[]): T | null {
  const mine = ranges(window);
  return (
    others.find(
      (other) =>
        other.id !== window.id &&
        ranges(other).some(([s2, e2]) => mine.some(([s1, e1]) => s1 < e2 && s2 < e1)),
    ) ?? null
  );
}
