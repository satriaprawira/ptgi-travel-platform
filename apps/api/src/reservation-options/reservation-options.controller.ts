import { Controller, Get } from '@nestjs/common';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository.js';
import { PricingRepository } from '../pricing/pricing.repository.js';
import { VehicleTypesRepository } from '../vehicle-types/vehicle-types.repository.js';

/**
 * Public: everything the reservation form offers, active rows only, sorted (design doc D7).
 * Vehicle types additionally follow the fleet: only types with an Available vehicle are listed.
 */
@Controller('reservation-options')
export class ReservationOptionsController {
  constructor(
    private readonly vehicleTypes: VehicleTypesRepository,
    private readonly paymentMethods: PaymentMethodsRepository,
    private readonly pricing: PricingRepository,
  ) {}

  @Get()
  async list() {
    const [vehicleTypes, paymentMethods, airports, serviceRegions, addOns] = await Promise.all([
      this.vehicleTypes.listOffered(),
      this.paymentMethods.listActive(),
      this.pricing.listAirports(),
      this.pricing.listPricedRegions(),
      this.pricing.listActiveAddOns(),
    ]);
    return { vehicleTypes, paymentMethods, airports, serviceRegions, addOns };
  }
}
