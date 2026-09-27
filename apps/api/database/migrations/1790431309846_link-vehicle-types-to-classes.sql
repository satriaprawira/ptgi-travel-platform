-- Up Migration

-- Each customer-facing vehicle type is served by one fleet class (design doc section 10). The
-- reservation form offers a type only while the fleet has an Available vehicle of that class.
-- Several types can share a class: both Grand Cabin options are served by the Grand Cabin class.

ALTER TABLE vehicle_types
  ADD COLUMN vehicle_class_id uuid
  CONSTRAINT vehicle_types_vehicle_class_id_fkey REFERENCES vehicle_classes (id);

UPDATE vehicle_types t
SET vehicle_class_id = c.id
FROM (VALUES
  ('standard',                     'standard'),
  ('medium',                       'medium'),
  ('new-alphard-haneda',           'new-alphard'),
  ('new-alphard-narita',           'new-alphard'),
  ('grand-cabin-23-wards',         'grand-cabin'),
  ('grand-cabin-outside-23-wards', 'grand-cabin'),
  ('bus',                          'bus')
) AS m (type_code, class_code)
JOIN vehicle_classes c ON c.code = m.class_code
WHERE t.code = m.type_code;

-- Fails loudly if a vehicle type was added that the mapping above doesn't cover.
ALTER TABLE vehicle_types ALTER COLUMN vehicle_class_id SET NOT NULL;

-- Down Migration

ALTER TABLE vehicle_types DROP COLUMN vehicle_class_id;
