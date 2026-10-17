-- Up Migration

-- 'waitlisted': the customer asked for a time when no vehicle of that class was free and chose to
-- wait. It holds nothing. Staff move it to 'new' (which takes a hold) when a slot opens, or cancel it.
--
-- Postgres refuses to *use* a new enum value in the transaction that adds it, and `migrate:up` runs
-- all pending migrations in one transaction. So nothing below, and no later migration that might
-- run in the same batch, may mention 'waitlisted' as a booking_status literal.
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'waitlisted';

-- Only 'new' and 'confirmed' bookings hold a vehicle. The index said "not cancelled", which would
-- now include waitlisted bookings.
DROP INDEX bookings_holds_idx;
CREATE INDEX bookings_holds_idx ON bookings (vehicle_class_id, pickup_at, hold_until)
  WHERE status IN ('new', 'confirmed');

-- Down Migration

DROP INDEX bookings_holds_idx;
CREATE INDEX bookings_holds_idx ON bookings (vehicle_class_id, pickup_at, hold_until)
  WHERE status <> 'cancelled';

-- Postgres can't remove an enum value. Waitlisted bookings become cancelled so nothing is left in
-- a status the older code doesn't know; the unused value itself stays in the type.
UPDATE bookings SET status = 'cancelled', cancelled_at = now() WHERE status::text = 'waitlisted';
