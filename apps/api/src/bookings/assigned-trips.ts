/**
 * "What is this vehicle / driver doing?" for the fleet screens, derived from confirmed bookings
 * (never stored): the trip in progress right now, and the next one coming up.
 */

export interface AssignedTrip {
  reference: string;
  /** Tokyo local date and times: "2026-10-16", "14:30", "17:30". */
  pickupDate: string;
  pickupTime: string;
  untilTime: string;
}

export interface AssignedTripColumns {
  current_reference: string | null;
  current_pickup_date: string | null;
  current_pickup_time: string | null;
  current_until_time: string | null;
  next_reference: string | null;
  next_pickup_date: string | null;
  next_pickup_time: string | null;
  next_until_time: string | null;
}

export const ASSIGNED_TRIP_COLUMNS = `
         cur.reference AS current_reference, cur.pickup_date AS current_pickup_date,
         cur.pickup_time AS current_pickup_time, cur.until_time AS current_until_time,
         nxt.reference AS next_reference, nxt.pickup_date AS next_pickup_date,
         nxt.pickup_time AS next_pickup_time, nxt.until_time AS next_until_time`;

const TRIP_FIELDS = `
      b.reference,
      to_char(b.pickup_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD') AS pickup_date,
      to_char(b.pickup_at AT TIME ZONE 'Asia/Tokyo', 'HH24:MI') AS pickup_time,
      to_char(b.hold_until AT TIME ZONE 'Asia/Tokyo', 'HH24:MI') AS until_time`;

/**
 * Two LEFT JOIN LATERALs named `cur` and `nxt`. `bookingColumn` is the bookings column to match
 * ('vehicle_id' or 'driver_id') and `owner` the outer row's id, e.g. 'v.id'. Both are fixed strings
 * from the repositories, never user input.
 */
export function assignedTripJoins(bookingColumn: 'vehicle_id' | 'driver_id', owner: string): string {
  return `
  LEFT JOIN LATERAL (
    SELECT ${TRIP_FIELDS}
    FROM bookings b
    WHERE b.${bookingColumn} = ${owner} AND b.status = 'confirmed'
      AND b.pickup_at <= now() AND b.hold_until > now()
    LIMIT 1
  ) cur ON true
  LEFT JOIN LATERAL (
    SELECT ${TRIP_FIELDS}
    FROM bookings b
    WHERE b.${bookingColumn} = ${owner} AND b.status = 'confirmed' AND b.pickup_at > now()
    ORDER BY b.pickup_at
    LIMIT 1
  ) nxt ON true`;
}

export function toAssignedTrips(row: AssignedTripColumns): { currentTrip: AssignedTrip | null; nextTrip: AssignedTrip | null } {
  return {
    currentTrip:
      row.current_reference === null
        ? null
        : {
            reference: row.current_reference,
            pickupDate: row.current_pickup_date ?? '',
            pickupTime: row.current_pickup_time ?? '',
            untilTime: row.current_until_time ?? '',
          },
    nextTrip:
      row.next_reference === null
        ? null
        : {
            reference: row.next_reference,
            pickupDate: row.next_pickup_date ?? '',
            pickupTime: row.next_pickup_time ?? '',
            untilTime: row.next_until_time ?? '',
          },
  };
}
