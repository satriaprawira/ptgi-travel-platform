import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository.js';
import { VehicleTypesRepository } from '../vehicle-types/vehicle-types.repository.js';
import type { CreateQuoteDto } from './dto/create-quote.dto.js';
import { PricingRepository } from './pricing.repository.js';
import { calculateQuote, tokyoInstant, type Quote } from './quote.js';

@Injectable()
export class PricingService {
  constructor(
    private readonly pricing: PricingRepository,
    private readonly vehicleTypes: VehicleTypesRepository,
    private readonly paymentMethods: PaymentMethodsRepository,
  ) {}

  /** Prices a trip from the database; the client never sends amounts. `now` is injectable for tests. */
  async quote(dto: CreateQuoteDto, now: Date = new Date()): Promise<Quote> {
    const pickupAt = tokyoInstant(dto.pickupDate, dto.pickupTime);
    if (!pickupAt) throw new UnprocessableEntityException('pickupDate is not a valid calendar date');
    if (pickupAt.getTime() <= now.getTime()) {
      throw new UnprocessableEntityException('The pickup time has already passed');
    }

    const selections = dto.addOns ?? [];
    if (new Set(selections.map((s) => s.addOnId)).size !== selections.length) {
      throw new UnprocessableEntityException('Each add-on can be listed only once');
    }

    const [fare, vehicle, payment, timeSurcharges, leadTimeSurcharges, addOns] = await Promise.all([
      this.pricing.findActiveFare(dto.airportId, dto.serviceRegionId),
      this.vehicleTypes.findOffered(dto.vehicleTypeId),
      this.paymentMethods.findActive(dto.paymentMethodId),
      this.pricing.listActiveTimeSurcharges(),
      this.pricing.listActiveLeadTimeSurcharges(),
      selections.length > 0 ? this.pricing.listActiveAddOns() : Promise.resolve([]),
    ]);

    if (!fare) throw new UnprocessableEntityException('There is no fare for this airport and area');
    // Also covers a type that was offered when the form loaded but whose last Available vehicle has
    // since gone into maintenance.
    if (!vehicle) throw new UnprocessableEntityException('This vehicle type is not available right now');
    if (!payment) throw new UnprocessableEntityException('paymentMethodId does not match an available payment method');

    const selectedAddOns = selections.map((selection) => {
      const addOn = addOns.find((a) => a.id === selection.addOnId);
      if (!addOn) throw new UnprocessableEntityException('addOnId does not match an available add-on');
      if (selection.quantity > addOn.maxQuantity) {
        throw new UnprocessableEntityException(`${addOn.label}: at most ${addOn.maxQuantity} per booking`);
      }
      return { label: addOn.label, priceJpy: addOn.priceJpy, freeQuantity: addOn.freeQuantity, quantity: selection.quantity };
    });

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
}
