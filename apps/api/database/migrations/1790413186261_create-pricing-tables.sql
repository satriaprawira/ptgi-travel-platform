-- Up Migration

-- Pricing model from "Goal Int. Service Pricelist" (Base Price + Additional Cost), design doc section 5.4.
-- Trip price = base fare (airport + region, Standard car)
--            + vehicle surcharge (vehicle_types) + pickup-time surcharge + last-minute fee
--            + add-ons + payment fee (payment_methods).
-- Any part that is NULL ("please inquire" / "will be adjusted") makes the booking "quote required".

CREATE TABLE airports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE CHECK (code ~ '^[A-Z]{3}$'),   -- IATA: HND, NRT
  name        text NOT NULL UNIQUE,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- The customer's side of the trip: a Tokyo ward, a nearby city, or "elsewhere".
CREATE TABLE service_regions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name             text NOT NULL UNIQUE,
  inside_23_wards  boolean NOT NULL,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Base fare for a Standard car. One row serves both directions (airport → region and region → airport).
-- The zone is only a label from the price sheet: prices can differ inside one zone.
CREATE TABLE fares (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airport_id         uuid NOT NULL REFERENCES airports (id),
  service_region_id  uuid NOT NULL REFERENCES service_regions (id),
  zone               text NOT NULL CHECK (zone ~ '^[A-Z]$'),
  price_jpy          integer CHECK (price_jpy > 0),      -- NULL = "will be adjusted": staff quote it
  min_price_jpy      integer CHECK (min_price_jpy > 0),  -- shown as "from ¥N" while quote-only
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fares_airport_region_key UNIQUE (airport_id, service_region_id),
  CONSTRAINT fares_min_price_only_when_quoted CHECK (price_jpy IS NULL OR min_price_jpy IS NULL)
);

-- Surcharge by scheduled pickup time (Tokyo local time). The window is [starts_at, ends_at):
-- 22:00–23:00 covers 22:00 through 22:59. When ends_at < starts_at it wraps midnight (23:00–06:00).
-- Windows must not overlap; the admin write path checks that (it can't be a simple constraint).
CREATE TABLE time_surcharges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label       text NOT NULL,
  starts_at   time NOT NULL,
  ends_at     time NOT NULL CHECK (ends_at <> starts_at),
  amount_jpy  integer NOT NULL CHECK (amount_jpy >= 0),
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Surcharge for booking close to the pickup: applies when the booking is made less than
-- `within_hours` before the scheduled pickup (both in Tokyo time).
CREATE TABLE lead_time_surcharges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label         text NOT NULL,
  within_hours  integer NOT NULL CHECK (within_hours BETWEEN 1 AND 720),
  amount_jpy    integer NOT NULL CHECK (amount_jpy >= 0),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Optional extras the customer requests. Charge = max(quantity - free_quantity, 0) × price_jpy.
CREATE TABLE add_ons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  label          text NOT NULL UNIQUE,
  price_jpy      integer NOT NULL CHECK (price_jpy >= 0),
  free_quantity  integer NOT NULL DEFAULT 0 CHECK (free_quantity >= 0),
  max_quantity   integer NOT NULL DEFAULT 1 CHECK (max_quantity BETWEEN 1 AND 10),
  is_active      boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT add_ons_free_within_max CHECK (free_quantity <= max_quantity)
);

CREATE TRIGGER fares_set_updated_at
  BEFORE UPDATE ON fares FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER time_surcharges_set_updated_at
  BEFORE UPDATE ON time_surcharges FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER lead_time_surcharges_set_updated_at
  BEFORE UPDATE ON lead_time_surcharges FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER add_ons_set_updated_at
  BEFORE UPDATE ON add_ons FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE add_ons;
DROP TABLE lead_time_surcharges;
DROP TABLE time_surcharges;
DROP TABLE fares;
DROP TABLE service_regions;
DROP TABLE airports;
