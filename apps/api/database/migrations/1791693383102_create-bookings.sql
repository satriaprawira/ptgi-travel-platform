-- Up Migration

-- A reservation submitted from the booking form. It holds one vehicle of the requested class from
-- pickup_at until hold_until as soon as it is created ('new'), and keeps holding it once staff
-- confirm it ('confirmed'). Cancelling releases the hold.
CREATE TYPE booking_status AS ENUM ('new', 'confirmed', 'cancelled');
CREATE TYPE trip_direction AS ENUM ('from_airport', 'to_airport');

-- Feeds the customer-facing booking number, e.g. GI-2610-0042.
CREATE SEQUENCE booking_reference_seq;

CREATE TABLE bookings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference               text NOT NULL CONSTRAINT bookings_reference_key UNIQUE,
  status                  booking_status NOT NULL DEFAULT 'new',

  -- Trip
  direction               trip_direction NOT NULL,
  airport_id              uuid NOT NULL REFERENCES airports (id),
  service_region_id       uuid NOT NULL REFERENCES service_regions (id),
  address                 text NOT NULL,
  pickup_at               timestamptz NOT NULL,
  hold_until              timestamptz NOT NULL,
  flight_code             text,

  -- What was chosen: an FK plus a snapshot of the label, so renaming an option later never
  -- rewrites a past booking (design decision D6). The class is what the hold counts against.
  vehicle_type_id         uuid NOT NULL REFERENCES vehicle_types (id),
  vehicle_class_id        uuid NOT NULL REFERENCES vehicle_classes (id),
  vehicle_label           text NOT NULL,
  payment_method_id       uuid NOT NULL REFERENCES payment_methods (id),
  payment_label           text NOT NULL,

  -- Price as calculated by the server when the booking was made.
  price_lines             jsonb NOT NULL,          -- [{ code, label, amountJpy, minAmountJpy? }]
  add_ons                 jsonb NOT NULL DEFAULT '[]', -- [{ addOnId, label, quantity }]
  total_jpy               integer NOT NULL CHECK (total_jpy >= 0),  -- the "from" price when quote_required
  quote_required          boolean NOT NULL,
  final_total_jpy         integer CHECK (final_total_jpy >= 0),      -- set when staff confirm

  -- Passenger and contact
  salutation              text NOT NULL,
  passenger_name          text NOT NULL,
  booker_name             text,                    -- set when booked for someone else
  country_origin          text NOT NULL,
  passengers              text NOT NULL,           -- free text, e.g. "1 adult, 2 children"
  luggage                 text NOT NULL,           -- free text, e.g. "L=1, M=2, S=1"
  age_adults              boolean NOT NULL DEFAULT true,
  age_infants             boolean NOT NULL DEFAULT false,
  age_children            boolean NOT NULL DEFAULT false,
  email                   text NOT NULL,
  phone_country_code      text NOT NULL,
  phone                   text NOT NULL,
  times_used              text,
  additional_requests     text,
  pet_info                text,

  confirmed_at            timestamptz,
  cancelled_at            timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bookings_hold_after_pickup CHECK (hold_until > pickup_at),
  -- A confirmed booking always has a final price.
  CONSTRAINT bookings_confirmed_has_final_total CHECK (status <> 'confirmed' OR final_total_jpy IS NOT NULL)
);

-- The availability check: bookings of one class that still hold a vehicle, by time.
CREATE INDEX bookings_holds_idx ON bookings (vehicle_class_id, pickup_at, hold_until)
  WHERE status <> 'cancelled';

-- The admin queue lists newest first.
CREATE INDEX bookings_created_at_idx ON bookings (created_at DESC);

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE bookings;
DROP SEQUENCE booking_reference_seq;
DROP TYPE trip_direction;
DROP TYPE booking_status;
