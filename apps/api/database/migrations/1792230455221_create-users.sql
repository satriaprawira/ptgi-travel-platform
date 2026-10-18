-- Up Migration

-- Staff accounts for the admin (replacing the single demo login). Customers don't sign in.
-- admin: everything, including User Management and price edits. staff: day-to-day operations.
CREATE TYPE user_role AS ENUM ('admin', 'staff');

-- Accounts are disabled, never deleted, so a person's history stays readable.
CREATE TYPE user_status AS ENUM ('active', 'disabled');

CREATE TABLE users (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             text NOT NULL CHECK (btrim(full_name) <> ''),
  -- Stored trimmed and lowercased, so the unique key is case-insensitive.
  email                 text NOT NULL CONSTRAINT users_email_key UNIQUE
                        CHECK (email = lower(btrim(email)) AND email <> ''),
  role                  user_role NOT NULL,
  status                user_status NOT NULL DEFAULT 'active',
  -- scrypt$N$r$p$salt$hash (apps/api/src/auth/password.ts). Never sent to the web app.
  password_hash         text NOT NULL,
  -- Set for a temporary password (new account or admin reset): only changing it is allowed.
  must_change_password  boolean NOT NULL DEFAULT true,
  -- Part of every sign-in token; increasing it ends all of the user's sessions.
  token_version         integer NOT NULL DEFAULT 0,
  last_login_at         timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE users;
DROP TYPE user_status;
DROP TYPE user_role;
