import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository.js';
import { VehicleTypesRepository } from '../vehicle-types/vehicle-types.repository.js';
import type { AddOnSelectionDto, CreateQuoteDto } from './dto/create-quote.dto.js';
import type { CreateRentalQuoteDto } from './dto/create-rental-quote.dto.js';
import { PricingRepository } from './pricing.repository.js';
import { calculateQuote, calculateRentalQuote, tokyoInstant, type Quote, type QuoteInput } from './quote.js';

@Injectable()
export class PricingService {
  constructor(
    private readonly pricing: PricingRepository,
    private readonly vehicleTypes: VehicleTypesRepository,
    private readonly paymentMethods: PaymentMethodsRepository,
  ) {}

  /** Prices a trip from the database; the client never sends amounts. `now` is injectable for tests. */
  async quote(dto: CreateQuoteDto, now: Date = new Date()): Promise<Quote> {
    const pickupAt = this.futurePickup(dto.pickupDate, dto.pickupTime, now);

    const [fare, vehicle, payment, timeSurcharges, leadTimeSurcharges, selectedAddOns] = await Promise.all([
      this.pricing.findActiveFare(dto.airportId, dto.serviceRegionId),
      this.vehicleTypes.findOffered(dto.vehicleTypeId),
      this.paymentMethods.findActive(dto.paymentMethodId),
      this.pricing.listActiveTimeSurcharges(),
      this.pricing.listActiveLeadTimeSurcharges(),
      this.selectedAddOns(dto.addOns),
    ]);

    if (!fare) throw new UnprocessableEntityException('There is no fare for this airport and area');
    // Also covers a type that was offered when the form loaded but whose last Available vehicle has
    // since gone into maintenance.
    if (!vehicle) throw new UnprocessableEntityException('This vehicle type is not available right now');
    if (!payment) throw new UnprocessableEntityException('paymentMethodId does not match an available payment method');

    return calculateQuote({
      fare,
      vehicle: { label: vehicle.label, surchargeJpy: vehicle.surchargeJpy },
      payment: { label: payment.label, feeJpy: payment.feeJpy },
      pickupTime: dto.pickupTime,
      hoursUntilPickup: (pickupAt.getTime() - now.getTime()) / 3_600_000,
      timeSurcharges,
      leadTimeSurcharges,
      addOns: selectedAddOns,
    });
  }

  /** Prices a car rental for an "Others" trip (FT-4): staff quote the rental; extras are priced here. */
  async quoteRental(dto: CreateRentalQuoteDto, now: Date = new Date()): Promise<Quote> {
    this.futurePickup(dto.pickupDate, dto.pickupTime, now);
    const [vehicleClass, payment, selectedAddOns] = await Promise.all([
      this.vehicleTypes.findOfferedClass(dto.vehicleClassId),
      this.paymentMethods.findActive(dto.paymentMethodId),
      this.selectedAddOns(dto.addOns),
    ]);
    if (!vehicleClass) throw new UnprocessableEntityException('This car category is not available right now');
    if (!payment) throw new UnprocessableEntityException('paymentMethodId does not match an available payment method');
    return calculateRentalQuote({
      vehicleName: vehicleClass.name,
      hours: dto.rentalHours,
      payment: { label: payment.label, feeJpy: payment.feeJpy },
      addOns: selectedAddOns,
    });
  }

  /** The pickup instant, refused when it isn't a real date or has already passed. */
  private futurePickup(date: string, time: string, now: Date): Date {
    const pickupAt = tokyoInstant(date, time);
    if (!pickupAt) throw new UnprocessableEntityException('pickupDate is not a valid calendar date');
    if (pickupAt.getTime() <= now.getTime()) {
      throw new UnprocessableEntityException('The pickup time has already passed');
    }
    return pickupAt;
  }

  /** The chosen add-ons with their prices, checked against what is offered and the per-booking maximum. */
  private async selectedAddOns(selections: AddOnSelectionDto[] = []): Promise<QuoteInput['addOns']> {
    if (new Set(selections.map((s) => s.addOnId)).size !== selections.length) {
      throw new UnprocessableEntityException('Each add-on can be listed only once');
    }
    if (selections.length === 0) return [];
    const addOns = await this.pricing.listActiveAddOns();
    return selections.map((selection) => {
      const addOn = addOns.find((a) => a.id === selection.addOnId);
      if (!addOn) throw new UnprocessableEntityException('addOnId does not match an available add-on');
      if (selection.quantity > addOn.maxQuantity) {
        throw new UnprocessableEntityException(`${addOn.label}: at most ${addOn.maxQuantity} per booking`);
      }
      return { label: addOn.label, priceJpy: addOn.priceJpy, freeQuantity: addOn.freeQuantity, quantity: selection.quantity };
    });
  }
}
