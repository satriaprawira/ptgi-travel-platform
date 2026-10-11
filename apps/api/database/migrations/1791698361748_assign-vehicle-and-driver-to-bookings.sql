-- Up Migration

-- Confirming a booking now assigns one specific vehicle and one specific driver to it. While the
-- booking is confirmed, that vehicle and that driver cannot be given to another confirmed booking
-- whose time overlaps. The database enforces this itself, so two staff confirming at the same
-- moment cannot double-book.

-- Lets an exclusion constraint combine "same id" (=) with "overlapping time range" (&&).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Bookings confirmed before assignments existed go back to the queue to be assigned.
UPDATE bookings SET status = 'new', confirmed_at = NULL WHERE status = 'confirmed';

-- No ON DELETE action: a vehicle or driver that has ever been assigned to a booking can't be
-- deleted (retire the vehicle / set the driver inactive instead), so booking history stays intact.
ALTER TABLE bookings
  ADD COLUMN vehicle_id uuid CONSTRAINT bookings_vehicle_id_fkey REFERENCES vehicles (id),
  ADD COLUMN driver_id  uuid CONSTRAINT bookings_driver_id_fkey  REFERENCES drivers (id),
  ADD CONSTRAINT bookings_confirmed_is_assigned
    CHECK (status <> 'confirmed' OR (vehicle_id IS NOT NULL AND driver_id IS NOT NULL)),
  -- [pickup_at, hold_until): a trip ending at 17:30 and one starting at 17:30 don't overlap.
  ADD CONSTRAINT bookings_vehicle_no_overlap
    EXCLUDE USING gist (vehicle_id WITH =, tstzrange(pickup_at, hold_until) WITH &&)
    WHERE (status = 'confirmed'),
  ADD CONSTRAINT bookings_driver_no_overlap
    EXCLUDE USING gist (driver_id WITH =, tstzrange(pickup_at, hold_until) WITH &&)
    WHERE (status = 'confirmed');

-- A cancelled booking keeps its vehicle_id / driver_id as a record of who had been assigned; the
-- constraints above only look at confirmed bookings, so cancelling frees both.

-- Down Migration

ALTER TABLE bookings
  DROP CONSTRAINT bookings_driver_no_overlap,
  DROP CONSTRAINT bookings_vehicle_no_overlap,
  DROP CONSTRAINT bookings_confirmed_is_assigned,
  DROP COLUMN driver_id,
  DROP COLUMN vehicle_id;
-- btree_gist is left installed: other objects may come to rely on it, and it is harmless.
