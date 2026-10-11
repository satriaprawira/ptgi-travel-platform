import { Injectable } from '@nestjs/common';
import { DatabaseService, type Queryable } from '../database/database.service.js';
import type { QuoteLine } from '../pricing/quote.js';
import type { CreateBookingDto, TripDirection } from './dto/create-booking.dto.js';

export type BookingStatus = 'new' | 'confirmed' | 'cancelled';

export interface BookedAddOn {
  addOnId: string;
  label: string;
  quantity: number;
}

interface BookingRow {
  id: string;
  reference: string;
  status: BookingStatus;
  direction: TripDirection;
  airport_code: string;
  airport_name: string;
  region_name: string;
  address: string;
  pickup_at: Date;
  hold_until: Date;
  pickup_date: string;
  pickup_time: string;
  flight_code: string | null;
  vehicle_label: string;
  payment_label: string;
  price_lines: QuoteLine[];
  add_ons: BookedAddOn[];
  total_jpy: number;
  quote_required: boolean;
  final_total_jpy: number | null;
  salutation: string;
  passenger_name: string;
  booker_name: string | null;
  country_origin: string;
  passengers: string;
  luggage: string;
  age_adults: boolean;
  age_infants: boolean;
  age_children: boolean;
  email: string;
  phone_country_code: string;
  phone: string;
  times_used: string | null;
  additional_requests: string | null;
  pet_info: string | null;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  vehicle_id: string | null;
  vehicle_model: string | null;
  vehicle_plate_number: string | null;
  driver_id: string | null;
  driver_full_name: string | null;
  driver_phone: string | null;
}

export interface Booking {
  id: string;
  reference: string;
  status: BookingStatus;
  direction: TripDirection;
  airport: { code: string; name: string };
  regionName: string;
  address: string;
  pickupAt: Date;
  holdUntil: Date;
  /** Tokyo local date and time of the pickup, as the customer entered them. */
  pickupDate: string;
  pickupTime: string;
  flightCode: string | null;
  vehicleLabel: string;
  paymentLabel: string;
  priceLines: QuoteLine[];
  addOns: BookedAddOn[];
  /** The calculated price, or the "from" price when quoteRequired. */
  totalJpy: number;
  quoteRequired: boolean;
  /** Set when staff confirm. */
  finalTotalJpy: number | null;
  /** The vehicle and driver assigned when staff confirmed (kept on a cancelled booking as a record). */
  vehicle: { id: string; model: string; plateNumber: string } | null;
  driver: { id: string; fullName: string; phone: string } | null;
  salutation: string;
  passengerName: string;
  bookerName: string | null;
  countryOrigin: string;
  passengers: string;
  luggage: string;
  ageAdults: boolean;
  ageInfants: boolean;
  ageChildren: boolean;
  email: string;
  phoneCountryCode: string;
  phone: string;
  timesUsed: string | null;
  additionalRequests: string | null;
  petInfo: string | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
}

export interface AssignmentOptions {
  vehicles: { id: string; model: string; plateNumber: string; usualDriverId: string | null }[];
  drivers: { id: string; fullName: string }[];
}

export interface NewBooking {
  dto: CreateBookingDto;
  vehicleClassId: string;
  pickupAt: Date;
  holdUntil: Date;
  priceLines: QuoteLine[];
  addOns: BookedAddOn[];
  totalJpy: number;
  quoteRequired: boolean;
}

const FIND_VEHICLE_CLASS = `
  SELECT c.id, c.name
  FROM vehicle_types t
  JOIN vehicle_classes c ON c.id = t.vehicle_class_id
  WHERE t.id = $1`;

// One hold decision per vehicle class at a time: without it, two customers booking the last free
// car at the same moment would each see it as free. Released at commit or rollback.
const LOCK_CLASS = `SELECT pg_advisory_xact_lock(hashtext('booking-hold:' || $1::text))`;

// Fleet = Available vehicles of the class. Held = the most vehicles busy at any one moment of the
// requested window [$2, $3), counting bookings of that class that aren't cancelled. Counting every
// overlapping booking would be too strict: two bookings one after the other need only one car.
// The busiest moment is always the window's start or the start of one of the overlapping holds.
const COUNT_FLEET_AND_HELD = `
  WITH overlapping AS (
    SELECT pickup_at, hold_until
    FROM bookings
    WHERE vehicle_class_id = $1 AND status <> 'cancelled'
      AND pickup_at < $3 AND hold_until > $2
  ), moments AS (
    SELECT $2::timestamptz AS at
    UNION
    SELECT pickup_at FROM overlapping WHERE pickup_at > $2
  )
  SELECT
    (SELECT count(*)::int FROM vehicles WHERE vehicle_class_id = $1 AND status = 'active') AS fleet,
    COALESCE((
      SELECT max(busy) FROM (
        SELECT (SELECT count(*) FROM overlapping o WHERE o.pickup_at <= m.at AND o.hold_until > m.at) AS busy
        FROM moments m
      ) per_moment
    ), 0)::int AS held`;

const LIST_ADD_ON_LABELS = `
  SELECT id, label FROM add_ons WHERE id = ANY($1::uuid[])`;

// The reference uses the Tokyo year and month: GI-2610-0042.
const INSERT_BOOKING = `
  INSERT INTO bookings (
    reference, direction, airport_id, service_region_id, address, pickup_at, hold_until, flight_code,
    vehicle_type_id, vehicle_class_id, vehicle_label, payment_method_id, payment_label,
    price_lines, add_ons, total_jpy, quote_required,
    salutation, passenger_name, booker_name, country_origin, passengers, luggage,
    age_adults, age_infants, age_children, email, phone_country_code, phone,
    times_used, additional_requests, pet_info
  ) VALUES (
    'GI-' || to_char(now() AT TIME ZONE 'Asia/Tokyo', 'YYMM') || '-'
          || lpad(nextval('booking_reference_seq')::text, 4, '0'),
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, (SELECT label FROM vehicle_types WHERE id = $8), $10, (SELECT label FROM payment_methods WHERE id = $10),
    $11::jsonb, $12::jsonb, $13, $14,
    $15, $16, $17, $18, $19, $20,
    $21, $22, $23, $24, $25, $26,
    $27, $28, $29
  )
  RETURNING id`;

const SELECT_BOOKINGS = `
  SELECT b.id, b.reference, b.status, b.direction,
         a.code AS airport_code, a.name AS airport_name, r.name AS region_name,
         b.address, b.pickup_at, b.hold_until,
         to_char(b.pickup_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD') AS pickup_date,
         to_char(b.pickup_at AT TIME ZONE 'Asia/Tokyo', 'HH24:MI') AS pickup_time,
         b.flight_code, b.vehicle_label, b.payment_label, b.price_lines, b.add_ons,
         b.total_jpy, b.quote_required, b.final_total_jpy,
         b.salutation, b.passenger_name, b.booker_name, b.country_origin, b.passengers, b.luggage,
         b.age_adults, b.age_infants, b.age_children, b.email, b.phone_country_code, b.phone,
         b.times_used, b.additional_requests, b.pet_info,
         b.confirmed_at, b.cancelled_at, b.created_at,
         v.id AS vehicle_id, v.model AS vehicle_model, v.plate_number AS vehicle_plate_number,
         d.id AS driver_id, d.full_name AS driver_full_name, d.phone AS driver_phone
  FROM bookings b
  JOIN airports a ON a.id = b.airport_id
  JOIN service_regions r ON r.id = b.service_region_id
  LEFT JOIN vehicles v ON v.id = b.vehicle_id
  LEFT JOIN drivers d ON d.id = b.driver_id`;

// Bookings that need staff attention first, then by pickup time.
const LIST_BOOKINGS = `${SELECT_BOOKINGS}
  ORDER BY (b.status = 'new') DESC, b.pickup_at, b.created_at`;

const FIND_BOOKING = `${SELECT_BOOKINGS}
  WHERE b.id = $1`;

// Both transitions are guarded by the current status, so a double click or two staff acting at once
// can't confirm a cancelled booking or the reverse.
const CONFIRM_BOOKING = `
  UPDATE bookings
  SET status = 'confirmed', confirmed_at = now(), final_total_jpy = $2, vehicle_id = $3, driver_id = $4
  WHERE id = $1 AND status = 'new'`;

// Who can take booking $1: Available vehicles of its class, and active drivers, that have no other
// confirmed booking overlapping its time. usual_driver_id is the driver who normally drives the
// vehicle (Driver Management), offered as the default.
const LIST_FREE_VEHICLES = `
  SELECT v.id, v.model, v.plate_number, usual.id AS usual_driver_id
  FROM bookings b
  JOIN vehicles v ON v.vehicle_class_id = b.vehicle_class_id AND v.status = 'active'
  LEFT JOIN drivers usual ON usual.vehicle_id = v.id
  WHERE b.id = $1
    AND NOT EXISTS (
      SELECT 1 FROM bookings o
      WHERE o.vehicle_id = v.id AND o.status = 'confirmed' AND o.id <> b.id
        AND o.pickup_at < b.hold_until AND o.hold_until > b.pickup_at)
  ORDER BY v.model, v.plate_number`;

const LIST_FREE_DRIVERS = `
  SELECT d.id, d.full_name
  FROM bookings b
  JOIN drivers d ON d.status = 'active'
  WHERE b.id = $1
    AND NOT EXISTS (
      SELECT 1 FROM bookings o
      WHERE o.driver_id = d.id AND o.status = 'confirmed' AND o.id <> b.id
        AND o.pickup_at < b.hold_until AND o.hold_until > b.pickup_at)
  ORDER BY d.full_name`;

const CANCEL_BOOKING = `
  UPDATE bookings
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = $1 AND status <> 'cancelled'`;

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    direction: row.direction,
    airport: { code: row.airport_code, name: row.airport_name },
    regionName: row.region_name,
    address: row.address,
    pickupAt: row.pickup_at,
    holdUntil: row.hold_until,
    pickupDate: row.pickup_date,
    pickupTime: row.pickup_time,
    flightCode: row.flight_code,
    vehicleLabel: row.vehicle_label,
    paymentLabel: row.payment_label,
    priceLines: row.price_lines,
    addOns: row.add_ons,
    totalJpy: row.total_jpy,
    quoteRequired: row.quote_required,
    finalTotalJpy: row.final_total_jpy,
    vehicle:
      row.vehicle_id === null
        ? null
        : { id: row.vehicle_id, model: row.vehicle_model ?? '', plateNumber: row.vehicle_plate_number ?? '' },
    driver:
      row.driver_id === null
        ? null
        : { id: row.driver_id, fullName: row.driver_full_name ?? '', phone: row.driver_phone ?? '' },
    salutation: row.salutation,
    passengerName: row.passenger_name,
    bookerName: row.booker_name,
    countryOrigin: row.country_origin,
    passengers: row.passengers,
    luggage: row.luggage,
    ageAdults: row.age_adults,
    ageInfants: row.age_infants,
    ageChildren: row.age_children,
    email: row.email,
    phoneCountryCode: row.phone_country_code,
    phone: row.phone,
    timesUsed: row.times_used,
    additionalRequests: row.additional_requests,
    petInfo: row.pet_info,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
  };
}

@Injectable()
export class BookingsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findVehicleClass(vehicleTypeId: string): Promise<{ id: string; name: string } | null> {
    const { rows } = await this.db.query<{ id: string; name: string }>(FIND_VEHICLE_CLASS, [vehicleTypeId]);
    return rows[0] ?? null;
  }

  async listAddOnLabels(ids: string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const { rows } = await this.db.query<{ id: string; label: string }>(LIST_ADD_ON_LABELS, [ids]);
    return new Map(rows.map((row) => [row.id, row.label]));
  }

  lockVehicleClass(q: Queryable, vehicleClassId: string): Promise<unknown> {
    return q.query(LOCK_CLASS, [vehicleClassId]);
  }

  /** Available vehicles of the class, and the most that are held at once during [from, until). */
  async countFleetAndHeld(
    q: Queryable,
    vehicleClassId: string,
    from: Date,
    until: Date,
  ): Promise<{ fleet: number; held: number }> {
    const { rows } = await q.query<{ fleet: number; held: number }>(COUNT_FLEET_AND_HELD, [
      vehicleClassId,
      from,
      until,
    ]);
    return rows[0];
  }

  async insert(q: Queryable, booking: NewBooking): Promise<string> {
    const { dto } = booking;
    const { rows } = await q.query<{ id: string }>(INSERT_BOOKING, [
      dto.direction,
      dto.airportId,
      dto.serviceRegionId,
      dto.address,
      booking.pickupAt,
      booking.holdUntil,
      dto.flightCode ?? null,
      dto.vehicleTypeId,
      booking.vehicleClassId,
      dto.paymentMethodId,
      // pg would send a JS array as a Postgres array, so jsonb values go in as JSON text.
      JSON.stringify(booking.priceLines),
      JSON.stringify(booking.addOns),
      booking.totalJpy,
      booking.quoteRequired,
      dto.salutation,
      dto.passengerName,
      dto.bookerName ?? null,
      dto.countryOrigin,
      dto.passengers,
      dto.luggage,
      dto.ageAdults,
      dto.ageInfants,
      dto.ageChildren,
      dto.email,
      dto.phoneCountryCode,
      dto.phone,
      dto.timesUsed ?? null,
      dto.additionalRequests ?? null,
      dto.petInfo ?? null,
    ]);
    return rows[0].id;
  }

  async list(): Promise<Booking[]> {
    const { rows } = await this.db.query<BookingRow>(LIST_BOOKINGS);
    return rows.map(toBooking);
  }

  async findById(id: string): Promise<Booking | null> {
    const { rows } = await this.db.query<BookingRow>(FIND_BOOKING, [id]);
    return rows[0] ? toBooking(rows[0]) : null;
  }

  /** Vehicles and drivers that are free for this booking's time. */
  async listAssignmentOptions(id: string): Promise<AssignmentOptions> {
    const [vehicles, drivers] = await Promise.all([
      this.db.query<{ id: string; model: string; plate_number: string; usual_driver_id: string | null }>(
        LIST_FREE_VEHICLES,
        [id],
      ),
      this.db.query<{ id: string; full_name: string }>(LIST_FREE_DRIVERS, [id]),
    ]);
    return {
      vehicles: vehicles.rows.map((row) => ({
        id: row.id,
        model: row.model,
        plateNumber: row.plate_number,
        usualDriverId: row.usual_driver_id,
      })),
      drivers: drivers.rows.map((row) => ({ id: row.id, fullName: row.full_name })),
    };
  }

  /**
   * False when the booking is no longer 'new'. Throws a Postgres exclusion violation if the vehicle
   * or driver was given to an overlapping booking in the meantime.
   */
  async confirm(id: string, finalTotalJpy: number, vehicleId: string, driverId: string): Promise<boolean> {
    const { rowCount } = await this.db.query(CONFIRM_BOOKING, [id, finalTotalJpy, vehicleId, driverId]);
    return rowCount === 1;
  }

  /** False when the booking was already cancelled. */
  async cancel(id: string): Promise<boolean> {
    const { rowCount } = await this.db.query(CANCEL_BOOKING, [id]);
    return rowCount === 1;
  }
}
