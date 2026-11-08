-- Up Migration

-- Client feedback FT-11: staff can take a request even when no fleet car of its type is free
-- ("overbook"), and confirm it with a partner (outsourced) car whose details they type in.
--
-- holds_fleet_car: whether the booking counts against its class's fleet. True for normal new and
-- confirmed bookings. False for an overbooked request and for a trip confirmed with a partner car,
-- so neither takes a fleet car away from other bookings.
ALTER TABLE bookings
  ADD COLUMN holds_fleet_car boolean NOT NULL DEFAULT true,
  ADD COLUMN partner_vehicle text CHECK (btrim(partner_vehicle) <> ''),
  ADD COLUMN partner_driver  text CHECK (btrim(partner_driver) <> ''),
  ADD COLUMN partner_phone   text CHECK (btrim(partner_phone) <> ''),
  ADD CONSTRAINT bookings_partner_has_driver CHECK ((partner_vehicle IS NULL) = (partner_driver IS NULL)),
  DROP CONSTRAINT bookings_confirmed_is_assigned,
  -- A confirmed trip has either a fleet vehicle and driver, or a partner car (and then holds no fleet car).
  ADD CONSTRAINT bookings_confirmed_is_assigned CHECK (
    status <> 'confirmed'
    OR (vehicle_id IS NOT NULL AND driver_id IS NOT NULL AND partner_vehicle IS NULL)
    OR (vehicle_id IS NULL AND driver_id IS NULL AND partner_vehicle IS NOT NULL AND NOT holds_fleet_car)
  );

-- Down Migration

-- Partner-car trips go back to the queue, as the old rule needs a fleet vehicle and driver.
UPDATE bookings SET status = 'new', confirmed_at = NULL WHERE status = 'confirmed' AND vehicle_id IS NULL;

ALTER TABLE bookings
  DROP CONSTRAINT bookings_confirmed_is_assigned,
  DROP CONSTRAINT bookings_partner_has_driver,
  DROP COLUMN partner_phone,
  DROP COLUMN partner_driver,
  DROP COLUMN partner_vehicle,
  DROP COLUMN holds_fleet_car,
  ADD CONSTRAINT bookings_confirmed_is_assigned
    CHECK (status <> 'confirmed' OR (vehicle_id IS NOT NULL AND driver_id IS NOT NULL));
