import { Controller, Get } from '@nestjs/common';
import { PaymentMethodsRepository } from '../payment-methods/payment-methods.repository.js';
import { PricingRepository } from '../pricing/pricing.repository.js';
import { VehicleTypesRepository } from '../vehicle-types/vehicle-types.repository.js';
import { buildFareTable, type FareTable } from './fare-table.js';
import { FareTableRepository } from './fare-table.repository.js';

/**
 * Public: the current price list for the customer pages (Fare and Policy, Services, the About page's
 * fleet). Active rows only, and only the car types the reservation form offers.
 */
@Controller('fare-table')
export class FareTableController {
  constructor(
    private readonly fareTable: FareTableRepository,
    private readonly pricing: PricingRepository,
    private readonly vehicleTypes: VehicleTypesRepository,
    private readonly paymentMethods: PaymentMethodsRepository,
  ) {}

  @Get()
  async get(): Promise<FareTable> {
    const [airports, fares, offeredTypes, typeClasses, vehicleClasses, timeSurcharges, leadTimeSurcharges, addOns, paymentMethods] =
      await Promise.all([
        this.pricing.listAirports(),
        this.fareTable.listActiveFares(),
        this.vehicleTypes.listOffered(),
        this.fareTable.mapTypeClasses(),
        this.fareTable.listAvailableClasses(),
        this.pricing.listActiveTimeSurcharges(),
        this.pricing.listActiveLeadTimeSurcharges(),
        this.pricing.listActiveAddOns(),
        this.paymentMethods.listActive(),
      ]);

    const vehicleTypes = offeredTypes.flatMap((type) => {
      const classCode = typeClasses.get(type.id);
      return classCode ? [{ ...type, classCode }] : [];
    });

    return buildFareTable({
      airports,
      fares,
      vehicleTypes,
      vehicleClasses,
      timeSurcharges,
      leadTimeSurcharges,
      addOns,
      paymentMethods,
    });
  }
}
