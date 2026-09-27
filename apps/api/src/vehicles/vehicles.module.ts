import { Module } from '@nestjs/common';
import { VehicleClassesController, VehiclesController } from './vehicles.controller.js';
import { VehiclesRepository } from './vehicles.repository.js';
import { VehiclesService } from './vehicles.service.js';

@Module({
  controllers: [VehiclesController, VehicleClassesController],
  providers: [VehiclesRepository, VehiclesService],
})
export class VehiclesModule {}
