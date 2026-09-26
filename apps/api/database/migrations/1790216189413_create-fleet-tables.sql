-- Up Migration

-- No ORM to maintain updated_at, so the database does it, whoever writes the row.
-- Shared by every table with an updated_at column (the catalog tables reuse it).
CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Physical fleet grouping (design doc section 10). Customer-facing vehicle_types point at a
-- class later; fleet units never point at vehicle_types directly, because one Grand Cabin
-- serves both the "within" and "outside 23 wards" options.
CREATE TABLE vehicle_classes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text NOT NULL UNIQUE,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO vehicle_classes (code, name, sort_order) VALUES
  ('standard',    'Standard car', 10),
  ('medium',      'Medium car',   20),
  ('new-alphard', 'New Alphard',  30),
  ('grand-cabin', 'Grand Cabin',  40),
  ('bus',         'Bus',          50);

-- "In Use" is not a status: it will be derived from trip assignments once trips exist.
CREATE TYPE vehicle_status AS ENUM ('active', 'maintenance', 'retired');

CREATE TABLE vehicles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_class_id  uuid NOT NULL
                    CONSTRAINT vehicles_vehicle_class_id_fkey REFERENCES vehicle_classes (id),
  model             text NOT NULL CHECK (btrim(model) <> ''),
  plate_number      text NOT NULL CONSTRAINT vehicles_plate_number_key UNIQUE
                    CHECK (plate_number = upper(btrim(plate_number)) AND plate_number <> ''),
  capacity_pax      integer NOT NULL CHECK (capacity_pax BETWEEN 1 AND 60),
  capacity_bags     integer NOT NULL CHECK (capacity_bags BETWEEN 0 AND 60),
  status            vehicle_status NOT NULL DEFAULT 'active',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vehicles_vehicle_class_id_idx ON vehicles (vehicle_class_id);

CREATE TRIGGER vehicles_set_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- "On Trip" is likewise derived later; this is the driver's own availability.
CREATE TYPE driver_status AS ENUM ('active', 'off_duty', 'inactive');

CREATE TABLE drivers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       text NOT NULL CHECK (btrim(full_name) <> ''),
  phone           text NOT NULL CHECK (btrim(phone) <> ''),
  license_number  text CONSTRAINT drivers_license_number_key UNIQUE,
  -- One vehicle per driver and one driver per vehicle. Deleting the vehicle unassigns the driver.
  vehicle_id      uuid CONSTRAINT drivers_vehicle_id_key UNIQUE
                  CONSTRAINT drivers_vehicle_id_fkey REFERENCES vehicles (id) ON DELETE SET NULL,
  status          driver_status NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER drivers_set_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE drivers;
DROP TYPE driver_status;
DROP TABLE vehicles;
DROP TYPE vehicle_status;
DROP TABLE vehicle_classes;
DROP FUNCTION set_updated_at();
