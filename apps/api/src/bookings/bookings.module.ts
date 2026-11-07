import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { AdminBookingsController, BookingsController } from './bookings.controller.js';
import { BookingsRepository } from './bookings.repository.js';
import { BookingsService } from './bookings.service.js';

@Module({
  imports: [PricingModule, SettingsModule],
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingsRepository, BookingsService],
})
export class BookingsModule {}
