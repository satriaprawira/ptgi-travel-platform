-- Up Migration

-- Client feedback FT-9: Standard car stays the basic category, Medium car is removed, and Alphard 2.0,
-- 3.0 and 4.0 become separate categories. Each Alphard has a Haneda and a Narita option, as the
-- existing New Alphard 4.0 does. Alphard 2.0 and 3.0 cost +¥1,000, what Medium car (Alphard /
-- Vellfire) cost; Alphard 4.0 keeps its current surcharges.

-- Fleet classes: New Alphard becomes Alphard 4.0, and Alphard 2.0 and 3.0 are added.
UPDATE vehicle_classes SET code = 'alphard-4', name = 'Alphard 4.0' WHERE code = 'new-alphard';

INSERT INTO vehicle_classes (code, name, sort_order) VALUES
  ('alphard-2', 'Alphard 2.0', 20),
  ('alphard-3', 'Alphard 3.0', 25);

-- Medium cars were Alphard / Vellfire, so they and their bookings move to Alphard 2.0. The Medium car
-- type stays, hidden, so existing bookings keep pointing at it (their label and price are snapshots).
UPDATE vehicles
SET vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'alphard-2')
WHERE vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'medium');

UPDATE bookings
SET vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'alphard-2')
WHERE vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'medium');

UPDATE vehicle_types
SET vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'alphard-2'),
    is_active = false
WHERE code = 'medium';

DELETE FROM vehicle_classes WHERE code = 'medium';

-- Customer-facing types. The existing New Alphard 4.0 rows are renamed, keeping their surcharges
-- (staff may have edited them since).
UPDATE vehicle_types
SET code = 'alphard-4-haneda', name = 'Alphard 4.0', label = 'Alphard 4.0 (Haneda)'
WHERE code = 'new-alphard-haneda';

UPDATE vehicle_types
SET code = 'alphard-4-narita', name = 'Alphard 4.0', label = 'Alphard 4.0 (Narita)'
WHERE code = 'new-alphard-narita';

INSERT INTO vehicle_types (code, name, note, label, surcharge_jpy, sort_order, vehicle_class_id)
SELECT t.code, t.name, t.note, t.label, 1000, t.sort_order, c.id
FROM (VALUES
  ('alphard-2-haneda', 'Alphard 2.0', 'Haneda pick-up', 'Alphard 2.0 (Haneda)', 21, 'alphard-2'),
  ('alphard-2-narita', 'Alphard 2.0', 'Narita pick-up', 'Alphard 2.0 (Narita)', 22, 'alphard-2'),
  ('alphard-3-haneda', 'Alphard 3.0', 'Haneda pick-up', 'Alphard 3.0 (Haneda)', 23, 'alphard-3'),
  ('alphard-3-narita', 'Alphard 3.0', 'Narita pick-up', 'Alphard 3.0 (Narita)', 24, 'alphard-3')
) AS t (code, name, note, label, sort_order, class_code)
JOIN vehicle_classes c ON c.code = t.class_code;

-- Down Migration

-- Fails if a booking already uses an Alphard 2.0 or 3.0 type: those bookings have to be dealt with first.
INSERT INTO vehicle_classes (code, name, sort_order) VALUES ('medium', 'Medium car', 20);

UPDATE vehicles
SET vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'medium')
WHERE vehicle_class_id IN (SELECT id FROM vehicle_classes WHERE code IN ('alphard-2', 'alphard-3'));

UPDATE bookings
SET vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'medium')
WHERE vehicle_class_id IN (SELECT id FROM vehicle_classes WHERE code IN ('alphard-2', 'alphard-3'));

UPDATE vehicle_types
SET vehicle_class_id = (SELECT id FROM vehicle_classes WHERE code = 'medium'),
    is_active = true
WHERE code = 'medium';

DELETE FROM vehicle_types
WHERE code IN ('alphard-2-haneda', 'alphard-2-narita', 'alphard-3-haneda', 'alphard-3-narita');

DELETE FROM vehicle_classes WHERE code IN ('alphard-2', 'alphard-3');

UPDATE vehicle_types
SET code = 'new-alphard-haneda', name = 'New Alphard 4.0', label = 'New Alphard 4.0 (Haneda)'
WHERE code = 'alphard-4-haneda';

UPDATE vehicle_types
SET code = 'new-alphard-narita', name = 'New Alphard 4.0', label = 'New Alphard 4.0 (Narita)'
WHERE code = 'alphard-4-narita';

UPDATE vehicle_classes SET code = 'new-alphard', name = 'New Alphard' WHERE code = 'alphard-4';
