import { Injectable } from '@nestjs/common';
import { DatabaseService, type Queryable } from '../database/database.service.js';
import type { QuoteLine } from '../pricing/quote.js';
import type { CreateBookingDto, TripDirection, TripType } from './dto/create-booking.dto.js';

/**
 * new: holds a vehicle of its class, waiting for staff. confirmed: a vehicle and driver are assigned.
 * waitlisted: no vehicle was free; holds nothing until staff move it to 'new'. cancelled: holds nothing.
 */
export type BookingStatus = 'new' | 'confirmed' | 'waitlisted' | 'cancelled';

export interface BookedAddOn {
  addOnId: string;
  label: string;
  quantity: number;
}

interface BookingRow {
  id: string;
  reference: string;
  status: BookingStatus;
  trip_type: TripType;
  direction: TripDirection | null;
  airport_code: string | null;
  airport_name: string | null;
  region_name: string | null;
  vehicle_class_name: string;
  address: string;
  dropoff_address: string | null;
  rental_hours: number | null;
  pickup_at: Date;
  hold_until: Date;
  buffer_minutes: number;
  pickup_date: string;
  pickup_time: string;
  flight_code: string | null;
  terminal: string | null;
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
  oversized_luggage: string | null;
  age_adults: boolean;
  age_infants: boolean;
  age_children: boolean;
  email: string;
  phone_country_code: string;
  phone: string;
  times_used: string | null;
  additional_requests: string | null;
  pet_info: string | null;
  terms_version: string | null;
  terms_accepted_at: Date | null;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  vehicle_id: string | null;
  vehicle_model: string | null;
  vehicle_plate_number: string | null;
  driver_id: string | null;
  driver_full_name: string | null;
  driver_phone: string | null;
  holds_fleet_car: boolean;
  partner_vehicle: string | null;
  partner_driver: string | null;
  partner_phone: string | null;
}

export interface Booking {
  id: string;
  reference: string;
  status: BookingStatus;
  /** airport: a transfer from or to an airport. other: a car rental (FT-4). */
  tripType: TripType;
  /** Airport trips only (null for car rentals). */
  direction: TripDirection | null;
  airport: { code: string; name: string } | null;
  regionName: string | null;
  /** The fleet type the hold counts against, e.g. "Grand Cabin". */
  vehicleClassName: string;
  /** Airport trips: the drop-off (from the airport) or pick-up (to the airport) address. Car rentals: the pick-up address. */
  address: string;
  /** Car rentals only. */
  dropoffAddress: string | null;
  rentalHours: number | null;
  pickupAt: Date;
  /** When the car is free again: pickup + 3 hours (car rental: rentalHours) + bufferMinutes. */
  holdUntil: Date;
  /** The buffer between bookings this booking was made with (FT-12); the trip itself ends bufferMinutes before holdUntil. */
  bufferMinutes: number;
  /** Tokyo local date and time of the pickup, as the customer entered them. */
  pickupDate: string;
  pickupTime: string;
  flightCode: string | null;
  terminal: string | null;
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
  /** False for an overbooked request or a partner-car trip: it doesn't count against the fleet (FT-11). */
  holdsFleetCar: boolean;
  /** Set when the trip is confirmed with a partner (outsourced) car instead of a fleet car. */
  partner: { vehicle: string; driverName: string; driverPhone: string | null } | null;
  salutation: string;
  passengerName: string;
  bookerName: string | null;
  countryOrigin: string;
  passengers: string;
  luggage: string;
  oversizedLuggage: string | null;
  ageAdults: boolean;
  ageInfants: boolean;
  ageChildren: boolean;
  email: string;
  phoneCountryCode: string;
  phone: string;
  timesUsed: string | null;
  additionalRequests: string | null;
  petInfo: string | null;
  /** Null for bookings made before the Terms & Conditions checkbox existed. */
  termsVersion: string | null;
  termsAcceptedAt: Date | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
}

export interface AssignmentOptions {
  vehicles: { id: string; model: string; plateNumber: string; usualDriverId: string | null }[];
  drivers: { id: string; fullName: string }[];
}

/** Who does a confirmed trip: a fleet vehicle and driver, or a partner car (FT-11). */
export type Assignment =
  | { vehicleId: string; driverId: string }
  | { partner: { vehicle: string; driverName: string; driverPhone?: string | null } };

/** The ids a booking was priced with, to price it again at another time. Airport ids are null for car rentals. */
export interface QuoteInputs {
  vehicleClassId: string;
  airportId: string | null;
  serviceRegionId: string | null;
  vehicleTypeId: string | null;
  paymentMethodId: string;
  addOns: { addOnId: string; quantity: number }[];
  createdAt: Date;
}

/** A booking's new time and what goes with it (FT-10). */
export interface Reschedule {
  pickupAt: Date;
  holdUntil: Date;
  bufferMinutes: number;
  vehicleId: string | null;
  driverId: string | null;
  totalJpy: number;
  priceLines: QuoteLine[];
  quoteRequired: boolean;
  finalTotalJpy: number | null;
}

export interface NewBooking {
  dto: CreateBookingDto;
  /** Car rentals have no vehicle type: they store the car category's name. */
  vehicleLabel: string | null;
  /** 'new' takes a hold; 'waitlisted' is saved without one. */
  status: 'new' | 'waitlisted';
  vehicleClassId: string;
  pickupAt: Date;
  holdUntil: Date;
  bufferMinutes: number;
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

const FIND_CLASS = `
  SELECT id, name FROM vehicle_classes WHERE id = $1`;

// One hold decision per vehicle class at a time: without it, two customers booking the last free
// car at the same moment would each see it as free. Released at commit or rollback.
const LOCK_CLASS = `SELECT pg_advisory_xact_lock(hashtext('booking-hold:' || $1::text))`;

// Fleet = Available vehicles of the class. Held = the most vehicles busy at any one moment of the
// requested window [$2, $3), counting bookings of that class that aren't cancelled. Counting every
// overlapping booking would be too strict: two bookings one after the other need only one car.
// The busiest moment is always the window's start or the start of one of the overlapping holds.
// Overbooked requests and partner-car trips hold no fleet car. $4 (optional) is a booking to leave
// out: the one being moved to another time.
const COUNT_FLEET_AND_HELD = `
  WITH overlapping AS (
    SELECT pickup_at, hold_until
    FROM bookings
    WHERE vehicle_class_id = $1 AND status IN ('new', 'confirmed') AND holds_fleet_car
      AND pickup_at < $3 AND hold_until > $2
      AND ($4::uuid IS NULL OR id <> $4::uuid)
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
    times_used, additional_requests, pet_info, status,
    terminal, oversized_luggage, terms_version, terms_accepted_at, buffer_minutes,
    trip_type, dropoff_address, rental_hours
  ) VALUES (
    'GI-' || to_char(now() AT TIME ZONE 'Asia/Tokyo', 'YYMM') || '-'
          || lpad(nextval('booking_reference_seq')::text, 4, '0'),
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, COALESCE((SELECT label FROM vehicle_types WHERE id = $8), $35), $10, (SELECT label FROM payment_methods WHERE id = $10),
    $11::jsonb, $12::jsonb, $13, $14,
    $15, $16, $17, $18, $19, $20,
    $21, $22, $23, $24, $25, $26,
    $27, $28, $29, $30::booking_status,
    $31, $32, $33, now(), $34,
    $36::trip_type, $37, $38
  )
  RETURNING id`;

const SELECT_BOOKINGS = `
  SELECT b.id, b.reference, b.status, b.trip_type, b.direction, b.dropoff_address, b.rental_hours,
         a.code AS airport_code, a.name AS airport_name, r.name AS region_name,
         vc.name AS vehicle_class_name,
         b.address, b.pickup_at, b.hold_until, b.buffer_minutes,
         to_char(b.pickup_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD') AS pickup_date,
         to_char(b.pickup_at AT TIME ZONE 'Asia/Tokyo', 'HH24:MI') AS pickup_time,
         b.flight_code, b.terminal, b.vehicle_label, b.payment_label, b.price_lines, b.add_ons,
         b.total_jpy, b.quote_required, b.final_total_jpy,
         b.salutation, b.passenger_name, b.booker_name, b.country_origin, b.passengers, b.luggage,
         b.oversized_luggage, b.age_adults, b.age_infants, b.age_children, b.email, b.phone_country_code, b.phone,
         b.times_used, b.additional_requests, b.pet_info, b.terms_version, b.terms_accepted_at,
         b.confirmed_at, b.cancelled_at, b.created_at,
         v.id AS vehicle_id, v.model AS vehicle_model, v.plate_number AS vehicle_plate_number,
         d.id AS driver_id, d.full_name AS driver_full_name, d.phone AS driver_phone,
         b.holds_fleet_car, b.partner_vehicle, b.partner_driver, b.partner_phone
  FROM bookings b
  LEFT JOIN airports a ON a.id = b.airport_id
  LEFT JOIN service_regions r ON r.id = b.service_region_id
  JOIN vehicle_classes vc ON vc.id = b.vehicle_class_id
  LEFT JOIN vehicles v ON v.id = b.vehicle_id
  LEFT JOIN drivers d ON d.id = b.driver_id`;

// Bookings that need staff attention first, then by pickup time.
const LIST_BOOKINGS = `${SELECT_BOOKINGS}
  ORDER BY (b.status = 'new') DESC, b.pickup_at, b.created_at`;

// Everything that occupies a vehicle during [$1, $2): new requests (a hold on the class) and
// confirmed trips (a specific vehicle and driver).
const LIST_SCHEDULE = `${SELECT_BOOKINGS}
  WHERE b.status IN ('new', 'confirmed') AND b.pickup_at < $2 AND b.hold_until > $1
  ORDER BY b.pickup_at, b.created_at`;

// First come, first served.
const LIST_WAITLIST = `${SELECT_BOOKINGS}
  WHERE b.status = 'waitlisted'
  ORDER BY b.created_at`;

const FIND_HOLD_WINDOW = `
  SELECT vehicle_class_id, pickup_at, hold_until
  FROM bookings
  WHERE id = $1`;

// $2 = false when it is overbooked: moved to bookings without a fleet car free.
const PROMOTE_BOOKING = `
  UPDATE bookings
  SET status = 'new', holds_fleet_car = $2
  WHERE id = $1 AND status = 'waitlisted'`;

// What PricingService needs to price the booking again at another time.
const FIND_QUOTE_INPUTS = `
  SELECT vehicle_class_id, airport_id, service_region_id, vehicle_type_id, payment_method_id, add_ons, created_at
  FROM bookings
  WHERE id = $1`;

// Moves a booking to another time. Guarded by its status, like confirm and cancel. The no-overlap
// constraints refuse a vehicle or driver that is busy at the new time.
const RESCHEDULE_BOOKING = `
  UPDATE bookings
  SET pickup_at = $3, hold_until = $4, buffer_minutes = $5, vehicle_id = $6, driver_id = $7,
      total_jpy = $8, price_lines = $9::jsonb, quote_required = $10, final_total_jpy = $11
  WHERE id = $1 AND status = $2::booking_status`;

const FIND_BOOKING = `${SELECT_BOOKINGS}
  WHERE b.id = $1`;

// Both transitions are guarded by the current status, so a double click or two staff acting at once
// can't confirm a cancelled booking or the reverse.
// Either a fleet vehicle and driver ($3, $4), or a partner car ($5–$7). A partner trip holds no fleet car.
const CONFIRM_BOOKING = `
  UPDATE bookings
  SET status = 'confirmed', confirmed_at = now(), final_total_jpy = $2, vehicle_id = $3, driver_id = $4,
      partner_vehicle = $5, partner_driver = $6, partner_phone = $7, holds_fleet_car = ($3::uuid IS NOT NULL)
  WHERE id = $1 AND status = 'new'`;

// Who can take booking $1: Available vehicles of its class, and active drivers, that have no other
// confirmed booking overlapping its time: the booking's own window, or [$2, $3) when checking a new
// time for it. usual_driver_id is the driver who normally drives the vehicle (Driver Management),
// offered as the default.
const LIST_FREE_VEHICLES = `
  SELECT v.id, v.model, v.plate_number, usual.id AS usual_driver_id
  FROM bookings b
  JOIN vehicles v ON v.vehicle_class_id = b.vehicle_class_id AND v.status = 'active'
  LEFT JOIN drivers usual ON usual.vehicle_id = v.id
  WHERE b.id = $1
    AND NOT EXISTS (
      SELECT 1 FROM bookings o
      WHERE o.vehicle_id = v.id AND o.status = 'confirmed' AND o.id <> b.id
        AND o.pickup_at < COALESCE($3::timestamptz, b.hold_until)
        AND o.hold_until > COALESCE($2::timestamptz, b.pickup_at))
  ORDER BY v.model, v.plate_number`;

const LIST_FREE_DRIVERS = `
  SELECT d.id, d.full_name
  FROM bookings b
  JOIN drivers d ON d.status = 'active'
  WHERE b.id = $1
    AND NOT EXISTS (
      SELECT 1 FROM bookings o
      WHERE o.driver_id = d.id AND o.status = 'confirmed' AND o.id <> b.id
        AND o.pickup_at < COALESCE($3::timestamptz, b.hold_until)
        AND o.hold_until > COALESCE($2::timestamptz, b.pickup_at))
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
    tripType: row.trip_type,
    direction: row.direction,
    airport: row.airport_code === null ? null : { code: row.airport_code, name: row.airport_name ?? '' },
    regionName: row.region_name,
    vehicleClassName: row.vehicle_class_name,
    address: row.address,
    dropoffAddress: row.dropoff_address,
    rentalHours: row.rental_hours,
    pickupAt: row.pickup_at,
    holdUntil: row.hold_until,
    bufferMinutes: row.buffer_minutes,
    pickupDate: row.pickup_date,
    pickupTime: row.pickup_time,
    flightCode: row.flight_code,
    terminal: row.terminal,
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
    holdsFleetCar: row.holds_fleet_car,
    partner:
      row.partner_vehicle === null
        ? null
        : { vehicle: row.partner_vehicle, driverName: row.partner_driver ?? '', driverPhone: row.partner_phone },
    salutation: row.salutation,
    passengerName: row.passenger_name,
    bookerName: row.booker_name,
    countryOrigin: row.country_origin,
    passengers: row.passengers,
    luggage: row.luggage,
    oversizedLuggage: row.oversized_luggage,
    ageAdults: row.age_adults,
    ageInfants: row.age_infants,
    ageChildren: row.age_children,
    email: row.email,
    phoneCountryCode: row.phone_country_code,
    phone: row.phone,
    timesUsed: row.times_used,
    additionalRequests: row.additional_requests,
    petInfo: row.pet_info,
    termsVersion: row.terms_version,
    termsAcceptedAt: row.terms_accepted_at,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
  };
}

@Injectable()
export class BookingsRepository {
  constructor(private readonly db: DatabaseService) {}

  /** The fleet class that serves a vehicle type. */
  async findVehicleClass(vehicleTypeId: string): Promise<{ id: string; name: string } | null> {
    const { rows } = await this.db.query<{ id: string; name: string }>(FIND_VEHICLE_CLASS, [vehicleTypeId]);
    return rows[0] ?? null;
  }

  async findClass(vehicleClassId: string): Promise<{ id: string; name: string } | null> {
    const { rows } = await this.db.query<{ id: string; name: string }>(FIND_CLASS, [vehicleClassId]);
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

  /**
   * Available vehicles of the class, and the most that are held at once during [from, until).
   * `excludeId` leaves one booking out: the one being moved to that time.
   */
  async countFleetAndHeld(
    q: Queryable,
    vehicleClassId: string,
    from: Date,
    until: Date,
    excludeId: string | null = null,
  ): Promise<{ fleet: number; held: number }> {
    const { rows } = await q.query<{ fleet: number; held: number }>(COUNT_FLEET_AND_HELD, [
      vehicleClassId,
      from,
      until,
      excludeId,
    ]);
    return rows[0];
  }

  async insert(q: Queryable, booking: NewBooking): Promise<string> {
    const { dto } = booking;
    const { rows } = await q.query<{ id: string }>(INSERT_BOOKING, [
      dto.direction ?? null,
      dto.airportId ?? null,
      dto.serviceRegionId ?? null,
      dto.address,
      booking.pickupAt,
      booking.holdUntil,
      dto.flightCode ?? null,
      dto.vehicleTypeId ?? null,
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
      booking.status,
      dto.terminal ?? null,
      dto.oversizedLuggage ?? null,
      dto.termsVersion,
      booking.bufferMinutes,
      booking.vehicleLabel,
      dto.tripType ?? 'airport',
      dto.dropoffAddress ?? null,
      dto.rentalHours ?? null,
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

  async listSchedule(from: Date, until: Date): Promise<Booking[]> {
    const { rows } = await this.db.query<BookingRow>(LIST_SCHEDULE, [from, until]);
    return rows.map(toBooking);
  }

  async listWaitlist(): Promise<Booking[]> {
    const { rows } = await this.db.query<BookingRow>(LIST_WAITLIST);
    return rows.map(toBooking);
  }

  /** The class and time window a booking needs a vehicle for. */
  async findHoldWindow(id: string): Promise<{ vehicleClassId: string; pickupAt: Date; holdUntil: Date } | null> {
    const { rows } = await this.db.query<{ vehicle_class_id: string; pickup_at: Date; hold_until: Date }>(
      FIND_HOLD_WINDOW,
      [id],
    );
    const row = rows[0];
    return row ? { vehicleClassId: row.vehicle_class_id, pickupAt: row.pickup_at, holdUntil: row.hold_until } : null;
  }

  /** waitlisted → new; `holdsFleetCar` false when overbooked. False when it is no longer waitlisted. */
  async promote(q: Queryable, id: string, holdsFleetCar: boolean): Promise<boolean> {
    const { rowCount } = await q.query(PROMOTE_BOOKING, [id, holdsFleetCar]);
    return rowCount === 1;
  }

  async findQuoteInputs(id: string): Promise<QuoteInputs | null> {
    const { rows } = await this.db.query<{
      vehicle_class_id: string;
      airport_id: string | null;
      service_region_id: string | null;
      vehicle_type_id: string | null;
      payment_method_id: string;
      add_ons: BookedAddOn[];
      created_at: Date;
    }>(FIND_QUOTE_INPUTS, [id]);
    const row = rows[0];
    return row
      ? {
          vehicleClassId: row.vehicle_class_id,
          airportId: row.airport_id,
          serviceRegionId: row.service_region_id,
          vehicleTypeId: row.vehicle_type_id,
          paymentMethodId: row.payment_method_id,
          addOns: row.add_ons.map((a) => ({ addOnId: a.addOnId, quantity: a.quantity })),
          createdAt: row.created_at,
        }
      : null;
  }

  /**
   * Saves a booking's new time (and vehicle, driver and price). False when its status changed in the
   * meantime. Throws a Postgres exclusion violation if the vehicle or driver is busy at the new time.
   */
  async reschedule(q: Queryable, id: string, expectedStatus: 'new' | 'confirmed', change: Reschedule): Promise<boolean> {
    const { rowCount } = await q.query(RESCHEDULE_BOOKING, [
      id,
      expectedStatus,
      change.pickupAt,
      change.holdUntil,
      change.bufferMinutes,
      change.vehicleId,
      change.driverId,
      change.totalJpy,
      JSON.stringify(change.priceLines),
      change.quoteRequired,
      change.finalTotalJpy,
    ]);
    return rowCount === 1;
  }

  /** Vehicles and drivers that are free for this booking's time, or for [window.from, window.until). */
  async listAssignmentOptions(
    id: string,
    window: { from: Date; until: Date } | null = null,
    q: Queryable = this.db,
  ): Promise<AssignmentOptions> {
    const params = [id, window?.from ?? null, window?.until ?? null];
    const [vehicles, drivers] = await Promise.all([
      q.query<{ id: string; model: string; plate_number: string; usual_driver_id: string | null }>(
        LIST_FREE_VEHICLES,
        params,
      ),
      q.query<{ id: string; full_name: string }>(LIST_FREE_DRIVERS, params),
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
  async confirm(q: Queryable, id: string, finalTotalJpy: number, assignment: Assignment): Promise<boolean> {
    const fleet = 'vehicleId' in assignment;
    const { rowCount } = await q.query(CONFIRM_BOOKING, [
      id,
      finalTotalJpy,
      fleet ? assignment.vehicleId : null,
      fleet ? assignment.driverId : null,
      fleet ? null : assignment.partner.vehicle,
      fleet ? null : assignment.partner.driverName,
      fleet ? null : (assignment.partner.driverPhone ?? null),
    ]);
    return rowCount === 1;
  }

  /** False when the booking was already cancelled. */
  async cancel(id: string): Promise<boolean> {
    const { rowCount } = await this.db.query(CANCEL_BOOKING, [id]);
    return rowCount === 1;
  }
}
