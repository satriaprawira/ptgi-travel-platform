import { Module } from '@nestjs/common';
import { PaymentMethodsRepository } from './payment-methods.repository.js';

@Module({
  providers: [PaymentMethodsRepository],
  exports: [PaymentMethodsRepository],
})
export class PaymentMethodsModule {}
