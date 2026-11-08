import { ConflictException, HttpException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { tokyoInstant, type Quote } from '../pricing/quote.js';
import { isPgError, PgErrorCode } from '../database/pg-error.js';
import { SettingsRepository } from '../settings/settings.repository.js';
import {
  BookingsRepository,
  type Assignment,
  type AssignmentOptions,
  type Booking,
  type QuoteInputs,
} from './bookings.repository.js';
import type { ConfirmBookingDto } from './dto/confirm-booking.dto.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';
import type { RescheduleBookingDto, ReschedulePreviewQueryDto } from './dto/reschedule-booking.dto.js';
import { holdUntil as holdUntilFor } from './hold.js';

/** What staff see before moving a booking to another time (FT-10). */
export interface ReschedulePreview {
  pickupAt: Date;
  holdUntil: Date;
  bufferMinutes: number;
  /** A car of its type is free at the new time. Always true for bookings that hold no fleet car. */
  fits: boolean;
  /** Confirmed fleet trips: the vehicles and drivers free at the new time (its own included). */
  vehicles: AssignmentOptions['vehicles'];
  drivers: AssignmentOptions['drivers'];
  current: { totalJpy: number; quoteRequired: boolean; finalTotalJpy: number | null };
  /** The price for the new time; null (with `newPriceError`) when it can't be calculated any more. */
  newPrice: { totalJpy: number; quoteRequired: boolean; lines: Quote['lines'] } | null;
  newPriceError: string | null;
}

/** Someone gave the same vehicle or driver to an overlapping confirmed booking a moment ago. */
function translateAssignmentConflict(error: unknown): never {
  if (isPgError(error, PgErrorCode.ExclusionViolation, 'bookings_vehicle_no_overlap')) {
    throw new ConflictException('That vehicle was just assigned to another booking at that time');
  }
  if (isPgError(error, PgErrorCode.ExclusionViolation, 'bookings_driver_no_overlap')) {
    throw new ConflictException('That driver was just assigned to another booking at that time');
  }
  throw error;
}

/** What the customer gets back: no internal ids, no other people's data. */
export interface BookingReceipt {
  reference: string;
  status: Booking['status'];
  pickupDate: string;
  pickupTime: string;
  vehicleLabel: string;
  paymentLabel: string;
  priceLines: Booking['priceLines'];
  totalJpy: number;
  quoteRequired: boolean;
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly bookings: BookingsRepository,
    private readonly pricing: PricingService,
    private readonly settings: SettingsRepository,
  ) {}

  /**
   * Saves a reservation as 'new' and holds a vehicle of the requested class for it straight away.
   * Staff still confirm it. The price is recalculated here; nothing the client says about amounts
   * is trusted.
   */
  async create(dto: CreateBookingDto, now: Date = new Date()): Promise<BookingReceipt> {
    // Validates the trip (fare exists, vehicle type offered, pickup in the future, add-on limits).
    const quote = await this.pricing.quote(dto, now);

    const vehicleClass = await this.bookings.findVehicleClass(dto.vehicleTypeId);
    if (!vehicleClass) throw new UnprocessableEntityException('This vehicle type is not available right now');

    const selections = (dto.addOns ?? []).filter((selection) => selection.quantity > 0);
    const labels = await this.bookings.listAddOnLabels(selections.map((s) => s.addOnId));
    const addOns = selections.map((s) => ({ addOnId: s.addOnId, label: labels.get(s.addOnId) ?? '', quantity: s.quantity }));

    const pickupAt = tokyoInstant(dto.pickupDate, dto.pickupTime)!; // already validated by the quote
    const { bufferMinutes } = await this.settings.get();
    const holdUntil = holdUntilFor(pickupAt, bufferMinutes);

    const id = await this.db.transaction(async (client) => {
      await this.bookings.lockVehicleClass(client, vehicleClass.id);
      const { fleet, held } = await this.bookings.countFleetAndHeld(client, vehicleClass.id, pickupAt, holdUntil);
      const free = held < fleet;
      if (!free && !dto.joinWaitlist) {
        throw new ConflictException(
          `No ${vehicleClass.name} is free at that time. Please choose another time or car type, or join the waiting list.`,
        );
      }
      return this.bookings.insert(client, {
        dto,
        // A customer who asked for the waiting list still gets a normal booking if a car is free.
        status: free ? 'new' : 'waitlisted',
        vehicleClassId: vehicleClass.id,
        pickupAt,
        holdUntil,
        bufferMinutes,
        priceLines: quote.lines,
        addOns,
        totalJpy: quote.totalJpy,
        quoteRequired: quote.quoteRequired,
      });
    });

    const booking = await this.get(id);
    return {
      reference: booking.reference,
      status: booking.status,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      vehicleLabel: booking.vehicleLabel,
      paymentLabel: booking.paymentLabel,
      priceLines: booking.priceLines,
      totalJpy: booking.totalJpy,
      quoteRequired: booking.quoteRequired,
    };
  }

  list(): Promise<Booking[]> {
    return this.bookings.list();
  }

  async get(id: string): Promise<Booking> {
    const booking = await this.bookings.findById(id);
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    return booking;
  }

  /** New requests and confirmed trips that occupy a vehicle during `days` Tokyo calendar days from `date`. */
  schedule(date: string, days = 1): Promise<Booking[]> {
    const start = tokyoInstant(date, '00:00');
    if (!start) throw new UnprocessableEntityException('date is not a valid calendar date');
    return this.bookings.listSchedule(start, new Date(start.getTime() + days * 24 * 3_600_000));
  }

  /** The waiting list in the order people joined, each marked with whether a vehicle is free now. */
  async waitlist(): Promise<(Booking & { slotFree: boolean })[]> {
    const waiting = await this.bookings.listWaitlist();
    return Promise.all(
      waiting.map(async (booking) => {
        const window = await this.bookings.findHoldWindow(booking.id);
        const { fleet, held } = await this.bookings.countFleetAndHeld(
          this.db,
          window!.vehicleClassId,
          booking.pickupAt,
          booking.holdUntil,
        );
        return { ...booking, slotFree: held < fleet };
      }),
    );
  }

  /**
   * Moves a waitlisted booking into the queue as a new request, which holds a vehicle for it. While no
   * vehicle of its class is free it is refused, unless `overbook`: then it becomes a new request that
   * holds no fleet car, for staff to confirm with a partner car (FT-11).
   */
  async promote(id: string, overbook = false): Promise<Booking> {
    const booking = await this.get(id);
    if (booking.status !== 'waitlisted') {
      throw new ConflictException(`Booking ${booking.reference} is not on the waiting list (it is ${booking.status})`);
    }
    const window = await this.bookings.findHoldWindow(id);
    await this.db.transaction(async (client) => {
      await this.bookings.lockVehicleClass(client, window!.vehicleClassId);
      const { fleet, held } = await this.bookings.countFleetAndHeld(
        client,
        window!.vehicleClassId,
        booking.pickupAt,
        booking.holdUntil,
      );
      const free = held < fleet;
      if (!free && !overbook) {
        throw new ConflictException(
          `No ${booking.vehicleClassName} is free at that time yet. Move it anyway to overbook it and use a partner car.`,
        );
      }
      const changed = await this.bookings.promote(client, id, free);
      if (!changed) throw new ConflictException(`Booking ${booking.reference} was changed by someone else`);
    });
    return this.get(id);
  }

  /** The vehicles and drivers staff can assign to this booking: free for its whole time window. */
  async assignmentOptions(id: string): Promise<AssignmentOptions> {
    await this.get(id);
    return this.bookings.listAssignmentOptions(id);
  }

  /**
   * Staff accept a new booking and assign the vehicle and driver that will do the trip. From then on
   * neither can be assigned to another confirmed booking that overlaps in time.
   */
  async confirm(id: string, dto: ConfirmBookingDto): Promise<Booking> {
    const booking = await this.get(id);
    if (booking.status === 'waitlisted') {
      throw new ConflictException(
        `Booking ${booking.reference} is on the waiting list; move it to bookings first, once a vehicle is free`,
      );
    }
    if (booking.status !== 'new') {
      throw new ConflictException(`Booking ${booking.reference} is already ${booking.status}`);
    }
    if (booking.quoteRequired && dto.finalTotalJpy === undefined) {
      throw new UnprocessableEntityException('This booking needs a quoted price: send finalTotalJpy');
    }
    if (!booking.quoteRequired && dto.finalTotalJpy !== undefined) {
      throw new UnprocessableEntityException('This booking has a fixed price; finalTotalJpy is only for quoted bookings');
    }

    const finalTotalJpy = dto.finalTotalJpy ?? booking.totalJpy;
    if (dto.partner) {
      if (dto.vehicleId || dto.driverId) {
        throw new UnprocessableEntityException('Send either a fleet vehicle and driver, or a partner car, not both');
      }
      // A partner car does the trip: no fleet car or driver is involved, and the booking stops holding one.
      const changed = await this.bookings.confirm(this.db, id, finalTotalJpy, { partner: dto.partner });
      if (!changed) throw new ConflictException(`Booking ${booking.reference} was changed by someone else`);
      return this.get(id);
    }

    const options = await this.bookings.listAssignmentOptions(id);
    if (!options.vehicles.some((vehicle) => vehicle.id === dto.vehicleId)) {
      throw new UnprocessableEntityException(
        "That vehicle can't take this booking: it must be Available, of the booked car type, with no other confirmed trip at that time",
      );
    }
    if (!options.drivers.some((driver) => driver.id === dto.driverId)) {
      throw new UnprocessableEntityException(
        "That driver can't take this booking: they must be Available with no other confirmed trip at that time",
      );
    }
    const assignment: Assignment = { vehicleId: dto.vehicleId!, driverId: dto.driverId! };

    let changed: boolean;
    if (booking.holdsFleetCar) {
      // Its hold already counts against the fleet, so the vehicle is there for it.
      changed = await this.bookings.confirm(this.db, id, finalTotalJpy, assignment).catch(translateAssignmentConflict);
    } else {
      // An overbooked request taking a fleet car after all: only if one is spare beyond the other holds.
      const window = (await this.bookings.findHoldWindow(id))!;
      changed = await this.db.transaction(async (client) => {
        await this.bookings.lockVehicleClass(client, window.vehicleClassId);
        const { fleet, held } = await this.bookings.countFleetAndHeld(
          client,
          window.vehicleClassId,
          window.pickupAt,
          window.holdUntil,
          id,
        );
        if (held >= fleet) {
          throw new ConflictException(
            `No ${booking.vehicleClassName} is spare at that time (the others are held by other bookings): confirm it with a partner car`,
          );
        }
        return this.bookings.confirm(client, id, finalTotalJpy, assignment).catch(translateAssignmentConflict);
      });
    }
    if (!changed) throw new ConflictException(`Booking ${booking.reference} was changed by someone else`);
    return this.get(id);
  }

  /** Where a new or confirmed booking would stand at another time: availability, free cars and drivers, price. */
  async reschedulePreview(id: string, query: ReschedulePreviewQueryDto, now: Date = new Date()): Promise<ReschedulePreview> {
    const booking = await this.getReschedulable(id);
    const { pickupAt, holdUntil, bufferMinutes } = await this.newWindow(query, now);
    const inputs = (await this.bookings.findQuoteInputs(id))!;
    const fleetTrip = booking.status === 'confirmed' && booking.vehicle !== null;

    const [capacity, options, repriced] = await Promise.all([
      this.bookings.countFleetAndHeld(this.db, inputs.vehicleClassId, pickupAt, holdUntil, id),
      fleetTrip ? this.bookings.listAssignmentOptions(id, { from: pickupAt, until: holdUntil }) : null,
      this.reprice(inputs, query),
    ]);
    return {
      pickupAt,
      holdUntil,
      bufferMinutes,
      fits: !booking.holdsFleetCar || capacity.held < capacity.fleet,
      vehicles: options?.vehicles ?? [],
      drivers: options?.drivers ?? [],
      current: { totalJpy: booking.totalJpy, quoteRequired: booking.quoteRequired, finalTotalJpy: booking.finalTotalJpy },
      newPrice: repriced.quote
        ? { totalJpy: repriced.quote.totalJpy, quoteRequired: repriced.quote.quoteRequired, lines: repriced.quote.lines }
        : null,
      newPriceError: repriced.error,
    };
  }

  /**
   * Moves a new or confirmed booking to another time (FT-10), for example after a flight change. Under
   * the class lock it must still fit the fleet (buffer included), and a confirmed fleet trip's vehicle
   * and driver must be free then; the database's no-overlap rules back this up.
   */
  async reschedule(id: string, dto: RescheduleBookingDto, now: Date = new Date()): Promise<Booking> {
    const booking = await this.getReschedulable(id);
    const fleetTrip = booking.status === 'confirmed' && booking.vehicle !== null && booking.driver !== null;
    if ((dto.vehicleId || dto.driverId) && !fleetTrip) {
      throw new UnprocessableEntityException('Only a confirmed trip with a fleet car has a vehicle and driver to change');
    }
    if (dto.finalTotalJpy !== undefined && !(booking.status === 'confirmed' && booking.quoteRequired)) {
      throw new UnprocessableEntityException('finalTotalJpy is only for confirmed bookings with a quoted price');
    }
    const { pickupAt, holdUntil, bufferMinutes } = await this.newWindow(dto, now);
    const inputs = (await this.bookings.findQuoteInputs(id))!;

    let price = {
      totalJpy: booking.totalJpy,
      priceLines: booking.priceLines,
      quoteRequired: booking.quoteRequired,
      finalTotalJpy: booking.finalTotalJpy,
    };
    if (dto.priceChoice === 'new') {
      const { quote, error } = await this.reprice(inputs, dto);
      if (!quote) throw new UnprocessableEntityException(`The price can't be recalculated (${error}). Keep the current price.`);
      price = {
        totalJpy: quote.totalJpy,
        priceLines: quote.lines,
        quoteRequired: quote.quoteRequired,
        // A confirmed fixed-price trip is charged the new price; a quoted one keeps staff's quote.
        finalTotalJpy:
          booking.status === 'confirmed' ? (quote.quoteRequired ? booking.finalTotalJpy : quote.totalJpy) : null,
      };
    }
    if (dto.finalTotalJpy !== undefined) price.finalTotalJpy = dto.finalTotalJpy;

    const vehicleId = fleetTrip ? (dto.vehicleId ?? booking.vehicle!.id) : null;
    const driverId = fleetTrip ? (dto.driverId ?? booking.driver!.id) : null;

    await this.db.transaction(async (client) => {
      await this.bookings.lockVehicleClass(client, inputs.vehicleClassId);
      if (booking.holdsFleetCar) {
        const { fleet, held } = await this.bookings.countFleetAndHeld(
          client,
          inputs.vehicleClassId,
          pickupAt,
          holdUntil,
          id,
        );
        if (held >= fleet) {
          throw new ConflictException(`No ${booking.vehicleClassName} is free at the new time`);
        }
      }
      if (fleetTrip) {
        const options = await this.bookings.listAssignmentOptions(id, { from: pickupAt, until: holdUntil }, client);
        if (!options.vehicles.some((vehicle) => vehicle.id === vehicleId)) {
          throw new UnprocessableEntityException('That vehicle is not free at the new time: choose another one');
        }
        if (!options.drivers.some((driver) => driver.id === driverId)) {
          throw new UnprocessableEntityException('That driver is not free at the new time: choose another one');
        }
      }
      const changed = await this.bookings
        .reschedule(client, id, booking.status as 'new' | 'confirmed', {
          pickupAt,
          holdUntil,
          bufferMinutes,
          vehicleId,
          driverId,
          ...price,
        })
        .catch(translateAssignmentConflict);
      if (!changed) throw new ConflictException(`Booking ${booking.reference} was changed by someone else`);
    });
    return this.get(id);
  }

  private async getReschedulable(id: string): Promise<Booking> {
    const booking = await this.get(id);
    if (booking.status !== 'new' && booking.status !== 'confirmed') {
      throw new ConflictException(`Booking ${booking.reference} is ${booking.status}; only new and confirmed bookings can be moved`);
    }
    return booking;
  }

  /** The hold window for a new pickup time, with today's buffer between bookings. */
  private async newWindow(
    when: ReschedulePreviewQueryDto,
    now: Date,
  ): Promise<{ pickupAt: Date; holdUntil: Date; bufferMinutes: number }> {
    const pickupAt = tokyoInstant(when.pickupDate, when.pickupTime);
    if (!pickupAt) throw new UnprocessableEntityException('pickupDate is not a valid calendar date');
    if (pickupAt.getTime() <= now.getTime()) {
      throw new UnprocessableEntityException('The new pickup time has already passed');
    }
    const { bufferMinutes } = await this.settings.get();
    return { pickupAt, holdUntil: holdUntilFor(pickupAt, bufferMinutes), bufferMinutes };
  }

  /**
   * The booking's trip priced at a new time, with today's prices. The last-minute fee is judged from
   * when the customer originally booked, not from the change. Null with a reason when it can no longer
   * be priced (route hidden, car type no longer offered…).
   */
  private async reprice(inputs: QuoteInputs, when: ReschedulePreviewQueryDto): Promise<{ quote: Quote | null; error: string | null }> {
    try {
      const quote = await this.pricing.quote(
        {
          airportId: inputs.airportId,
          serviceRegionId: inputs.serviceRegionId,
          vehicleTypeId: inputs.vehicleTypeId,
          paymentMethodId: inputs.paymentMethodId,
          pickupDate: when.pickupDate,
          pickupTime: when.pickupTime,
          addOns: inputs.addOns,
        },
        inputs.createdAt,
      );
      return { quote, error: null };
    } catch (error) {
      if (error instanceof HttpException) return { quote: null, error: error.message };
      throw error;
    }
  }

  /** Cancels a new, confirmed or waitlisted booking, which frees anything it held. */
  async cancel(id: string): Promise<Booking> {
    const booking = await this.get(id);
    const changed = await this.bookings.cancel(id);
    if (!changed) throw new ConflictException(`Booking ${booking.reference} is already cancelled`);
    return this.get(id);
  }
}
