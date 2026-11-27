-- Up Migration

-- Client feedback (27 Nov 2026): the extra "Pickup at lobby" is called "Pickup at arrival lobby". Its price and
-- code stay. Bookings keep the name they were made with (add_ons on a booking is a snapshot).
UPDATE add_ons SET label = 'Pickup at arrival lobby' WHERE code = 'pickup-at-lobby';

-- Down Migration

UPDATE add_ons SET label = 'Pickup at lobby' WHERE code = 'pickup-at-lobby';
