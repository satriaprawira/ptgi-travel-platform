import { Module } from '@nestjs/common';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module.js';
import { PricingModule } from '../pricing/pricing.module.js';
import { VehicleTypesModule } from '../vehicle-types/vehicle-types.module.js';
import { ReservationOptionsController } from './reservation-options.controller.js';

@Module({
  imports: [VehicleTypesModule, PaymentMethodsModule, PricingModule],
  controllers: [ReservationOptionsController],
})
export class ReservationOptionsModule {}
