-- Up Migration

-- Vehicle surcharges from "Goal Int. Service Pricelist - Additional Cost" (Standard car has none).
-- Names and labels match the current reservation form (apps/web/lib/options.ts).
INSERT INTO vehicle_types (code, name, note, label, surcharge_jpy, sort_order) VALUES
  ('standard',                     'Standard car',    'Nissan Serena / Honda Stepwagon', 'Standard car',                   0,    10),
  ('medium',                       'Medium car',      'Alphard / Vellfire',              'Medium car',                     1000, 20),
  ('new-alphard-haneda',           'New Alphard 4.0', 'Haneda pick-up',                  'New Alphard 4.0 (Haneda)',       3000, 30),
  ('new-alphard-narita',           'New Alphard 4.0', 'Narita pick-up',                  'New Alphard 4.0 (Narita)',       5000, 40),
  ('grand-cabin-23-wards',         'Grand Cabin',     'Within 23 wards',                 'Grand Cabin (within 23 wards)',  3000, 50),
  ('grand-cabin-outside-23-wards', 'Grand Cabin',     'Outside 23 wards',                'Grand Cabin (outside 23 wards)', 5000, 60),
  ('bus',                          'Bus',             'Group travel — please inquire',   'Bus (please inquire)',           NULL, 70);

-- Cash on arrival: ¥1,000 per the Additional Cost sheet.
INSERT INTO payment_methods (code, kind, label, description, fee_jpy, sort_order) VALUES
  ('card-square',   'card',          'Credit card',     'Square',            0,    10),
  ('paypal',        'paypal',        'PayPal',          NULL,                0,    20),
  ('cash',          'cash',          'Cash on arrival', NULL,                1000, 30),
  ('bank-transfer', 'bank_transfer', 'Bank transfer',   'MUFJ / Japan Post', 0,    40);

-- Down Migration

DELETE FROM payment_methods
WHERE code IN ('card-square', 'paypal', 'cash', 'bank-transfer');

DELETE FROM vehicle_types
WHERE code IN ('standard', 'medium', 'new-alphard-haneda', 'new-alphard-narita',
               'grand-cabin-23-wards', 'grand-cabin-outside-23-wards', 'bus');
