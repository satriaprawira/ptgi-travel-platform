-- Up Migration

-- Client feedback, Phase 1: the reservation form asks for the airport terminal (FT-3) and oversized
-- luggage (FT-1), and the customer must agree to the Terms & Conditions (FT-5). Bookings made before
-- this migration have none of these, so all four columns are nullable.
ALTER TABLE bookings
  ADD COLUMN terminal          text CHECK (btrim(terminal) <> ''),
  ADD COLUMN oversized_luggage text CHECK (btrim(oversized_luggage) <> ''),
  -- Which Terms & Conditions the customer agreed to (apps/web/lib/content.ts TERMS_VERSION), and when.
  ADD COLUMN terms_version     text,
  ADD COLUMN terms_accepted_at timestamptz,
  ADD CONSTRAINT bookings_terms_accepted_together
    CHECK ((terms_version IS NULL) = (terms_accepted_at IS NULL));

-- Down Migration

ALTER TABLE bookings
  DROP CONSTRAINT bookings_terms_accepted_together,
  DROP COLUMN terms_accepted_at,
  DROP COLUMN terms_version,
  DROP COLUMN oversized_luggage,
  DROP COLUMN terminal;
