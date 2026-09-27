-- Up Migration

-- Data from "Goal Int. Service Pricelist - Base Price" and "- Additional Cost", confirmed with staff:
-- base fares are for a Standard car, the same in both directions; the Narita "outside 23 wards"
-- quote starts at ¥23,000 (the sheet's "13,000+" was copied from Haneda by mistake).

INSERT INTO airports (code, name, sort_order) VALUES
  ('HND', 'Haneda Airport', 10),
  ('NRT', 'Narita Airport', 20);

INSERT INTO service_regions (code, name, inside_23_wards, sort_order) VALUES
  ('adachi',     'Adachi',     true, 10),
  ('arakawa',    'Arakawa',    true, 20),
  ('bunkyo',     'Bunkyo',     true, 30),
  ('chiyoda',    'Chiyoda',    true, 40),
  ('chuo',       'Chuo',       true, 50),
  ('edogawa',    'Edogawa',    true, 60),
  ('itabashi',   'Itabashi',   true, 70),
  ('katsushika', 'Katsushika', true, 80),
  ('kita',       'Kita',       true, 90),
  ('koto',       'Koto',       true, 100),
  ('meguro',     'Meguro',     true, 110),
  ('minato',     'Minato',     true, 120),
  ('nakano',     'Nakano',     true, 130),
  ('nerima',     'Nerima',     true, 140),
  ('ota',        'Ota',        true, 150),
  ('setagaya',   'Setagaya',   true, 160),
  ('shibuya',    'Shibuya',    true, 170),
  ('shinagawa',  'Shinagawa',  true, 180),
  ('shinjuku',   'Shinjuku',   true, 190),
  ('suginami',   'Suginami',   true, 200),
  ('sumida',     'Sumida',     true, 210),
  ('taito',      'Taito',      true, 220),
  ('toshima',    'Toshima',    true, 230),
  ('kawasaki-city',    'Kawasaki City',                        false, 300),
  ('yokohama-city',    'Yokohama City',                        false, 310),
  ('outside-23-wards', 'Other area (outside Tokyo 23 wards)', false, 900);

INSERT INTO fares (airport_id, service_region_id, zone, price_jpy, min_price_jpy)
SELECT a.id, r.id, f.zone, f.price_jpy, f.min_price_jpy
FROM (VALUES
  -- Haneda
  ('HND', 'ota',              'A',  9000, NULL),
  ('HND', 'shinagawa',        'A',  9000, NULL),
  ('HND', 'minato',           'A', 10000, NULL),
  ('HND', 'chuo',             'A', 10000, NULL),
  ('HND', 'shibuya',          'B', 11000, NULL),
  ('HND', 'shinjuku',         'B', 11000, NULL),
  ('HND', 'chiyoda',          'B', 11000, NULL),
  ('HND', 'arakawa',          'B', 11000, NULL),
  ('HND', 'sumida',           'B', 11000, NULL),
  ('HND', 'edogawa',          'B', 11000, NULL),
  ('HND', 'koto',             'B', 11000, NULL),
  ('HND', 'setagaya',         'B', 11000, NULL),
  ('HND', 'taito',            'B', 11000, NULL),
  ('HND', 'meguro',           'B', 10000, NULL),
  ('HND', 'suginami',         'B', 12000, NULL),
  ('HND', 'toshima',          'B', 12000, NULL),
  ('HND', 'nakano',           'B', 12000, NULL),
  ('HND', 'bunkyo',           'B', 12000, NULL),
  ('HND', 'adachi',           'C', 13000, NULL),
  ('HND', 'nerima',           'C', 13000, NULL),
  ('HND', 'itabashi',         'C', 13000, NULL),
  ('HND', 'kita',             'C', 14000, NULL),
  ('HND', 'katsushika',       'C', 14000, NULL),
  ('HND', 'kawasaki-city',    'D', 10000, NULL),
  ('HND', 'yokohama-city',    'E', 12000, NULL),
  ('HND', 'outside-23-wards', 'F',  NULL, 13000),
  -- Narita
  ('NRT', 'shibuya',          'A', 23000, NULL),
  ('NRT', 'shinjuku',         'A', 23000, NULL),
  ('NRT', 'meguro',           'A', 23000, NULL),
  ('NRT', 'ota',              'A', 23000, NULL),
  ('NRT', 'minato',           'A', 23000, NULL),
  ('NRT', 'chuo',             'A', 23000, NULL),
  ('NRT', 'shinagawa',        'A', 23000, NULL),
  ('NRT', 'chiyoda',          'A', 23000, NULL),
  ('NRT', 'katsushika',       'A', 23000, NULL),
  ('NRT', 'adachi',           'A', 23000, NULL),
  ('NRT', 'arakawa',          'A', 23000, NULL),
  ('NRT', 'suginami',         'A', 23000, NULL),
  ('NRT', 'sumida',           'A', 23000, NULL),
  ('NRT', 'edogawa',          'A', 23000, NULL),
  ('NRT', 'koto',             'A', 23000, NULL),
  ('NRT', 'setagaya',         'A', 23000, NULL),
  ('NRT', 'taito',            'A', 23000, NULL),
  ('NRT', 'toshima',          'A', 23000, NULL),
  ('NRT', 'nakano',           'A', 23000, NULL),
  ('NRT', 'bunkyo',           'A', 23000, NULL),
  ('NRT', 'nerima',           'B', 25000, NULL),
  ('NRT', 'itabashi',         'B', 25000, NULL),
  ('NRT', 'kita',             'B', 25000, NULL),
  ('NRT', 'kawasaki-city',    'C', 28000, NULL),
  ('NRT', 'yokohama-city',    'D', 30000, NULL),
  ('NRT', 'outside-23-wards', 'E',  NULL, 23000)
) AS f (airport_code, region_code, zone, price_jpy, min_price_jpy)
JOIN airports a ON a.code = f.airport_code
JOIN service_regions r ON r.code = f.region_code;

INSERT INTO time_surcharges (code, label, starts_at, ends_at, amount_jpy, sort_order) VALUES
  ('night',         'Night time pickup (22:00–22:59)',     '22:00', '23:00', 2000, 10),
  ('late-night',    'Late night pickup (23:00–05:59)',     '23:00', '06:00', 4000, 20),
  ('early-morning', 'Early morning pickup (06:00–06:59)',  '06:00', '07:00', 2000, 30);

INSERT INTO lead_time_surcharges (code, label, within_hours, amount_jpy) VALUES
  ('last-minute', 'Booking on arrival / last-minute booking', 24, 1000);

INSERT INTO add_ons (code, label, price_jpy, free_quantity, max_quantity, sort_order) VALUES
  ('baby-seat',       'Baby seat',       1000, 1, 3, 10),   -- first seat free, each extra ¥1,000
  ('pickup-at-lobby', 'Pickup at lobby', 2000, 0, 1, 20),
  ('wheelchair',      'Wheelchair',      2500, 0, 1, 30);

-- Down Migration

DELETE FROM add_ons WHERE code IN ('baby-seat', 'pickup-at-lobby', 'wheelchair');
DELETE FROM lead_time_surcharges WHERE code = 'last-minute';
DELETE FROM time_surcharges WHERE code IN ('night', 'late-night', 'early-morning');
DELETE FROM fares WHERE airport_id IN (SELECT id FROM airports WHERE code IN ('HND', 'NRT'));
DELETE FROM service_regions
WHERE code IN ('adachi', 'arakawa', 'bunkyo', 'chiyoda', 'chuo', 'edogawa', 'itabashi', 'katsushika',
               'kita', 'koto', 'meguro', 'minato', 'nakano', 'nerima', 'ota', 'setagaya', 'shibuya',
               'shinagawa', 'shinjuku', 'suginami', 'sumida', 'taito', 'toshima',
               'kawasaki-city', 'yokohama-city', 'outside-23-wards');
DELETE FROM airports WHERE code IN ('HND', 'NRT');
