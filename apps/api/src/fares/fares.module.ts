import { Module } from '@nestjs/common';
import { FaresController } from './fares.controller.js';
import { FaresRepository } from './fares.repository.js';
import { FaresService } from './fares.service.js';

@Module({
  controllers: [FaresController],
  providers: [FaresRepository, FaresService],
})
export class FaresModule {}
