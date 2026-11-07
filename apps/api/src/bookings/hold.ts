/**
 * How long one booking keeps a vehicle busy, counted from the pickup time: the drive, the wait at
 * arrivals and the return. One value for every route until staff give per-route figures.
 */
export const HOLD_HOURS = 3;

const MINUTE_MS = 60_000;

/**
 * When the car is free again: pickup + HOLD_HOURS + the buffer between bookings (FT-12). Capacity checks
 * and the vehicle / driver no-overlap rules use this, so the buffer is part of every conflict check.
 * Pure: tested in hold.spec.ts.
 */
export function holdUntil(pickupAt: Date, bufferMinutes: number): Date {
  return new Date(pickupAt.getTime() + HOLD_HOURS * 60 * MINUTE_MS + bufferMinutes * MINUTE_MS);
}

/** When the trip itself ends, before the buffer: what staff see as the trip's end time. */
export function tripEnd(holdUntilAt: Date, bufferMinutes: number): Date {
  return new Date(holdUntilAt.getTime() - bufferMinutes * MINUTE_MS);
}
