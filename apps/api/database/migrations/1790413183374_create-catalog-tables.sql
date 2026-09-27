-- Up Migration

-- What a customer can pick in step 03 of the reservation form (design doc section 5.1).
-- set_updated_at() already exists: it is created by the create-fleet-tables migration.

CREATE TYPE payment_kind AS ENUM ('card', 'paypal', 'cash', 'bank_transfer');

CREATE TABLE vehicle_types (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code           text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name           text NOT NULL,                 -- card title:     "Grand Cabin"
  note           text,                          -- card subtitle:  "Within 23 wards"
  label          text NOT NULL UNIQUE,          -- full unambiguous name: "Grand Cabin (within 23 wards)"
  -- Added on top of the Standard-car base fare. NULL = "please inquire": staff quote it by hand.
  surcharge_jpy  integer CHECK (surcharge_jpy >= 0),
  is_active      boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payment_methods (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind         payment_kind NOT NULL,
  label        text NOT NULL,                   -- "Cash on arrival"
  description  text,                            -- "MUFJ / Japan Post"
  fee_jpy      integer NOT NULL DEFAULT 0 CHECK (fee_jpy >= 0),
  is_active    boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER vehicle_types_set_updated_at
  BEFORE UPDATE ON vehicle_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER payment_methods_set_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE payment_methods;
DROP TABLE vehicle_types;
DROP TYPE payment_kind;
