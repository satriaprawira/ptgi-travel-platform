import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { isPgError, PgErrorCode } from '../database/pg-error.js';
import type { UpdateFareDto } from './dto/update-fare.dto.js';
import { FaresRepository, type AdminFare } from './fares.repository.js';

@Injectable()
export class FaresService {
  constructor(private readonly fares: FaresRepository) {}

  list(): Promise<AdminFare[]> {
    return this.fares.list();
  }

  async get(id: string): Promise<AdminFare> {
    const fare = await this.fares.findById(id);
    if (!fare) throw new NotFoundException(`Fare ${id} not found`);
    return fare;
  }

  async update(id: string, dto: UpdateFareDto): Promise<AdminFare> {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('No fields to update');
    }
    if (typeof dto.priceJpy === 'number' && typeof dto.minPriceJpy === 'number') {
      throw new UnprocessableEntityException('A fixed price cannot also have a "from" price');
    }

    // Switching to a fixed price drops the "from" hint, which only applies to quote-on-request routes.
    const patch: UpdateFareDto =
      typeof dto.priceJpy === 'number' && dto.minPriceJpy === undefined ? { ...dto, minPriceJpy: null } : dto;

    const found = await this.fares.update(id, patch).catch((error: unknown) => {
      if (isPgError(error, PgErrorCode.CheckViolation, 'fares_min_price_only_when_quoted')) {
        throw new UnprocessableEntityException('A "from" price only applies to quote-on-request routes');
      }
      throw error;
    });
    if (!found) throw new NotFoundException(`Fare ${id} not found`);
    return this.get(id);
  }
}
