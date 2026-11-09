-- Up Migration

-- Client feedback FT-4: besides airport transfers, customers can book a car for other trips
-- (general car rental). Such a trip has a pick-up address (`address`), a drop-off address and the
-- number of hours needed; no airport, area, direction or terminal. The customer picks a car category
-- (vehicle class), not an airport-specific vehicle type, and staff quote the price.
CREATE TYPE trip_type AS ENUM ('airport', 'other');

ALTER TABLE bookings
  ADD COLUMN trip_type       trip_type NOT NULL DEFAULT 'airport',
  ADD COLUMN dropoff_address text CHECK (btrim(dropoff_address) <> ''),
  ADD COLUMN rental_hours    integer CHECK (rental_hours BETWEEN 1 AND 12),
  ALTER COLUMN direction DROP NOT NULL,
  ALTER COLUMN airport_id DROP NOT NULL,
  ALTER COLUMN service_region_id DROP NOT NULL,
  ALTER COLUMN vehicle_type_id DROP NOT NULL,
  ADD CONSTRAINT bookings_trip_details CHECK (
    (trip_type = 'airport'
      AND direction IS NOT NULL AND airport_id IS NOT NULL AND service_region_id IS NOT NULL
      AND vehicle_type_id IS NOT NULL AND dropoff_address IS NULL AND rental_hours IS NULL)
    OR
    (trip_type = 'other'
      AND direction IS NULL AND airport_id IS NULL AND service_region_id IS NULL AND terminal IS NULL
      AND dropoff_address IS NOT NULL AND rental_hours IS NOT NULL)
  );

-- Down Migration

-- Refuses while "other" trips exist: they can't be represented without this migration.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM bookings WHERE trip_type = 'other') THEN
    RAISE EXCEPTION 'Bookings for other (non-airport) trips exist; cancel and remove them before rolling back';
  END IF;
END $$;

ALTER TABLE bookings
  DROP CONSTRAINT bookings_trip_details,
  ALTER COLUMN vehicle_type_id SET NOT NULL,
  ALTER COLUMN service_region_id SET NOT NULL,
  ALTER COLUMN airport_id SET NOT NULL,
  ALTER COLUMN direction SET NOT NULL,
  DROP COLUMN rental_hours,
  DROP COLUMN dropoff_address,
  DROP COLUMN trip_type;

DROP TYPE trip_type;
