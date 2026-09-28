-- Up Migration

-- The seeded labels spelled out their own window ("Late night pickup (23:00–05:59)"), so editing
-- starts_at / ends_at left the label wrong. Labels are now just the name; the API appends the
-- window from starts_at / ends_at wherever it is shown (see src/pricing/quote.ts: windowText).
UPDATE time_surcharges
SET label = regexp_replace(label, '\s*\(\d{2}:\d{2}–\d{2}:\d{2}\)$', '')
WHERE label ~ '\(\d{2}:\d{2}–\d{2}:\d{2}\)$';

-- Down Migration

-- Put the (then-current) window back into the label.
UPDATE time_surcharges
SET label = label || ' (' || to_char(starts_at, 'HH24:MI') || '–'
            || to_char(ends_at - interval '1 minute', 'HH24:MI') || ')';
