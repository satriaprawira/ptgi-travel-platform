-- Up Migration

-- Client feedback (27 Nov 2026): a Grand Cabin (Toyota HiAce Grand Cabin) seats 9 passengers and takes
-- 9 suitcases. The About page shows the most seats and suitcases among a class's Available cars, so every
-- Grand Cabin in the fleet is set to that. Staff can still edit a single car in Admin → Fleet.
UPDATE vehicles
SET capacity_pax = 9, capacity_bags = 9
WHERE vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'grand-cabin');

-- Down Migration

-- Nothing to undo: the previous seats and suitcases weren't kept. Edit them in Admin → Fleet if needed.
