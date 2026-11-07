-- Up Migration

-- Client feedback FT-12: a buffer between bookings, for flight delays and customers who take time to
-- find their pickup point. Each booking holds its car for 3 hours from pickup plus this buffer, so the
-- capacity check and the vehicle / driver no-overlap rules include it without further changes.

-- Settings staff can change from the admin. One row only.
CREATE TABLE booking_settings (
  id              boolean PRIMARY KEY DEFAULT true CHECK (id),
  buffer_minutes  integer NOT NULL DEFAULT 30 CHECK (buffer_minutes BETWEEN 0 AND 180),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER booking_settings_set_updated_at
  BEFORE UPDATE ON booking_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO booking_settings DEFAULT VALUES;

-- The buffer each booking was made with, so the trip's own end (hold_until minus the buffer) can be
-- shown. Bookings made before this migration were held without one.
ALTER TABLE bookings
  ADD COLUMN buffer_minutes integer NOT NULL DEFAULT 0 CHECK (buffer_minutes BETWEEN 0 AND 180);

-- New bookings must say which buffer they used.
ALTER TABLE bookings ALTER COLUMN buffer_minutes DROP DEFAULT;

-- Down Migration

ALTER TABLE bookings DROP COLUMN buffer_minutes;
DROP TABLE booking_settings;
