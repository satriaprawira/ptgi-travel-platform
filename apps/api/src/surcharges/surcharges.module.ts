import { Module } from '@nestjs/common';
import { SurchargesController } from './surcharges.controller.js';
import { SurchargesRepository } from './surcharges.repository.js';
import { SurchargesService } from './surcharges.service.js';

@Module({
  controllers: [SurchargesController],
  providers: [SurchargesRepository, SurchargesService],
})
export class SurchargesModule {}
