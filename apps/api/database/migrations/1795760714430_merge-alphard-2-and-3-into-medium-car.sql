-- Up Migration

-- Client feedback (27 Nov 2026): Alphard 2.0 and Alphard 3.0 become one category again, "Medium Car".
-- Alphard 4.0 stays as it is. Medium Car is one option at both airports, since Alphard 2.0 and 3.0 cost
-- the same (+¥1,000) at Haneda and at Narita.
--
-- The Alphard 2.0 class becomes Medium Car (keeping its id), and everything in Alphard 3.0 moves into it.

UPDATE vehicle_classes SET code = 'medium', name = 'Medium Car' WHERE code = 'alphard-2';

UPDATE vehicles
SET vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'medium')
WHERE vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'alphard-3');

UPDATE bookings
SET vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'medium')
WHERE vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'alphard-3');

-- The customer-facing option: the Medium car type hidden by revise-vehicle-categories comes back, at the
-- price Alphard 2.0 has today (staff may have edited it since).
UPDATE vehicle_types
SET name = 'Medium Car',
    label = 'Medium Car',
    note = 'Toyota Alphard',
    surcharge_jpy = (SELECT surcharge_jpy FROM vehicle_types WHERE code = 'alphard-2-haneda'),
    vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'medium'),
    is_active = true
WHERE code = 'medium';

-- Bookings made as Alphard 2.0 or 3.0 now point at Medium Car, so staff can still reschedule and reprice
-- them. What the customer saw (vehicle_label and price_lines) is a snapshot and stays as it was.
UPDATE bookings
SET vehicle_type_id = (SELECT id FROM vehicle_types WHERE code = 'medium')
WHERE vehicle_type_id IN (
  SELECT id FROM vehicle_types
  WHERE code IN ('alphard-2-haneda', 'alphard-2-narita', 'alphard-3-haneda', 'alphard-3-narita')
);

-- The four Alphard 2.0 / 3.0 options are hidden, not deleted, so the down migration can bring them back.
UPDATE vehicle_types
SET vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'medium'),
    is_active = false
WHERE code IN ('alphard-2-haneda', 'alphard-2-narita', 'alphard-3-haneda', 'alphard-3-narita');

DELETE FROM vehicle_classes WHERE code = 'alphard-3';

-- Down Migration

-- Medium Car goes back to being Alphard 2.0. Cars, bookings and booking options can't be told apart any
-- more, so all of them stay with Alphard 2.0; Alphard 3.0 comes back empty.
INSERT INTO vehicle_classes (code, name, sort_order) VALUES ('alphard-3', 'Alphard 3.0', 25);

UPDATE vehicle_classes SET code = 'alphard-2', name = 'Alphard 2.0' WHERE code = 'medium';

UPDATE vehicle_types
SET vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'alphard-3')
WHERE code IN ('alphard-3-haneda', 'alphard-3-narita');

UPDATE vehicle_types
SET is_active = true
WHERE code IN ('alphard-2-haneda', 'alphard-2-narita', 'alphard-3-haneda', 'alphard-3-narita');

UPDATE vehicle_types
SET name = 'Medium car', label = 'Medium car', note = 'Alphard / Vellfire', is_active = false
WHERE code = 'medium';
