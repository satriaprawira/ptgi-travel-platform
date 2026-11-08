/**
 * How long one booking keeps a vehicle busy, counted from the pickup time: the drive, the wait at
 * arrivals and the return. One value for every route until staff give per-route figures.
 */
export const HOLD_HOURS = 3;

const MINUTE_MS = 60_000;

/**
 * When the car is free again: pickup + the trip's hours + the buffer between bookings (FT-12). Airport
 * transfers take HOLD_HOURS; a car rental ("Others" trip, FT-4) the hours the customer asked for.
 * Capacity checks and the vehicle / driver no-overlap rules use this, so the buffer is part of every
 * conflict check. Pure: tested in hold.spec.ts.
 */
export function holdUntil(pickupAt: Date, bufferMinutes: number, hours: number = HOLD_HOURS): Date {
  return new Date(pickupAt.getTime() + hours * 60 * MINUTE_MS + bufferMinutes * MINUTE_MS);
}

/** When the trip itself ends, before the buffer: what staff see as the trip's end time. */
export function tripEnd(holdUntilAt: Date, bufferMinutes: number): Date {
  return new Date(holdUntilAt.getTime() - bufferMinutes * MINUTE_MS);
}
