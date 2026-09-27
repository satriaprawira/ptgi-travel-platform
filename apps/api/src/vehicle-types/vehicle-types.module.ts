import { Module } from '@nestjs/common';
import { VehicleTypesRepository } from './vehicle-types.repository.js';

@Module({
  providers: [VehicleTypesRepository],
  exports: [VehicleTypesRepository],
})
export class VehicleTypesModule {}
