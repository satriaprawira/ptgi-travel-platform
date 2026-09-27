import { Module } from '@nestjs/common';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module.js';
import { VehicleTypesModule } from '../vehicle-types/vehicle-types.module.js';
import { PricingRepository } from './pricing.repository.js';
import { PricingService } from './pricing.service.js';
import { QuotesController } from './quotes.controller.js';

@Module({
  imports: [VehicleTypesModule, PaymentMethodsModule],
  controllers: [QuotesController],
  providers: [PricingRepository, PricingService],
  exports: [PricingRepository],
})
export class PricingModule {}
