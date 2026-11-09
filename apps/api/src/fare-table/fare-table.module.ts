import { Module } from '@nestjs/common';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { VehicleTypesModule } from '../vehicle-types/vehicle-types.module.js';
import { FareTableController } from './fare-table.controller.js';
import { FareTableRepository } from './fare-table.repository.js';

@Module({
  imports: [PricingModule, VehicleTypesModule, PaymentMethodsModule],
  controllers: [FareTableController],
  providers: [FareTableRepository],
})
export class FareTableModule {}
