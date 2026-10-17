import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { tokyoInstant } from '../pricing/quote.js';
import { isPgError, PgErrorCode } from '../database/pg-error.js';
import { BookingsRepository, type AssignmentOptions, type Booking } from './bookings.repository.js';
import type { ConfirmBookingDto } from './dto/confirm-booking.dto.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';

/**
 * How long one booking keeps a vehicle busy, counted from the pickup time: the drive, the wait at
 * arrivals and the return. One value for every route until staff give per-route figures.
 */
export const HOLD_HOURS = 3;

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
    const holdUntil = new Date(pickupAt.getTime() + HOLD_HOURS * 3_600_000);

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
   * Moves a waitlisted booking into the queue as a new request, which holds a vehicle for it.
   * Refused while no vehicle of its class is free at that time.
   */
  async promote(id: string): Promise<Booking> {
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
      if (held >= fleet) {
        throw new ConflictException(`No ${booking.vehicleClassName} is free at that time yet`);
      }
      const changed = await this.bookings.promote(client, id);
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

    const changed = await this.bookings
      .confirm(id, dto.finalTotalJpy ?? booking.totalJpy, dto.vehicleId, dto.driverId)
      .catch((error: unknown) => {
        // Someone confirmed an overlapping booking with the same vehicle or driver a moment ago.
        if (isPgError(error, PgErrorCode.ExclusionViolation, 'bookings_vehicle_no_overlap')) {
          throw new ConflictException('That vehicle was just assigned to another booking at that time');
        }
        if (isPgError(error, PgErrorCode.ExclusionViolation, 'bookings_driver_no_overlap')) {
          throw new ConflictException('That driver was just assigned to another booking at that time');
        }
        throw error;
      });
    if (!changed) throw new ConflictException(`Booking ${booking.reference} was changed by someone else`);
    return this.get(id);
  }

  /** Cancels a new, confirmed or waitlisted booking, which frees anything it held. */
  async cancel(id: string): Promise<Booking> {
    const booking = await this.get(id);
    const changed = await this.bookings.cancel(id);
    if (!changed) throw new ConflictException(`Booking ${booking.reference} is already cancelled`);
    return this.get(id);
  }
}
