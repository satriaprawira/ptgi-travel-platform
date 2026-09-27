import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { DriversModule } from './drivers/drivers.module.js';
import { HealthModule } from './health/health.module.js';
import { PricingModule } from './pricing/pricing.module.js';
import { ReservationOptionsModule } from './reservation-options/reservation-options.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    DatabaseModule,
    HealthModule,
    // Public (customer)
    ReservationOptionsModule,
    PricingModule,
    // Admin
    VehiclesModule,
    DriversModule,
  ],
})
export class AppModule {}
