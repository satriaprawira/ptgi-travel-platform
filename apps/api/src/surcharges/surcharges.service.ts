import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { isPgError, PgErrorCode } from '../database/pg-error.js';
import type {
  UpdateAddOnDto,
  UpdateLeadTimeSurchargeDto,
  UpdatePaymentFeeDto,
  UpdateTimeSurchargeDto,
  UpdateVehicleSurchargeDto,
} from './dto/update-surcharges.dto.js';
import { SurchargesRepository, type Surcharges } from './surcharges.repository.js';
import { windowText } from '../pricing/quote.js';
import { findOverlap } from './time-windows.js';

const isEmpty = (dto: object) => Object.values(dto).every((value) => value === undefined);

/**
 * The "Additional Cost" price sheet. Every PATCH returns the whole sheet, so the admin panel
 * always shows exactly what the reservation form will use. Rows are edited, never created or deleted.
 */
@Injectable()
export class SurchargesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly surcharges: SurchargesRepository,
  ) {}

  list(): Promise<Surcharges> {
    return this.surcharges.listAll();
  }

  async updateVehicle(id: string, dto: UpdateVehicleSurchargeDto): Promise<Surcharges> {
    await this.found(this.surcharges.updateVehicleSurcharge(id, dto), 'Vehicle type', id);
    return this.list();
  }

  async updateTime(id: string, dto: UpdateTimeSurchargeDto): Promise<Surcharges> {
    if (isEmpty(dto)) throw new BadRequestException('No fields to update');

    await this.db.transaction(async (client) => {
      await this.surcharges.lockTimeSurcharges(client);
      const windows = await this.surcharges.listTimeSurcharges(client);
      const current = windows.find((w) => w.id === id);
      if (!current) throw new NotFoundException(`Pickup-time surcharge ${id} not found`);

      const next = { ...current, ...definedOnly(dto) };
      if (next.startsAt === next.endsAt) {
        throw new UnprocessableEntityException('The time window must start and end at different times');
      }
      if (next.isActive) {
        const clash = findOverlap(next, windows.filter((w) => w.isActive));
        if (clash) {
          throw new UnprocessableEntityException(
            `${windowText(next.startsAt, next.endsAt)} overlaps ${clash.label} (${clash.windowText})`,
          );
        }
      }
      await this.surcharges.updateTimeSurcharge(client, id, dto);
    });
    return this.list();
  }

  async updateLeadTime(id: string, dto: UpdateLeadTimeSurchargeDto): Promise<Surcharges> {
    if (isEmpty(dto)) throw new BadRequestException('No fields to update');
    await this.found(this.surcharges.updateLeadTimeSurcharge(id, dto), 'Last-minute surcharge', id);
    return this.list();
  }

  async updateAddOn(id: string, dto: UpdateAddOnDto): Promise<Surcharges> {
    if (isEmpty(dto)) throw new BadRequestException('No fields to update');
    const update = this.surcharges.updateAddOn(id, dto).catch((error: unknown) => {
      if (isPgError(error, PgErrorCode.CheckViolation, 'add_ons_free_within_max')) {
        throw new UnprocessableEntityException('Free quantity cannot be more than the maximum per booking');
      }
      if (isPgError(error, PgErrorCode.UniqueViolation, 'add_ons_label_key')) {
        throw new ConflictException('Another extra already has this name');
      }
      throw error;
    });
    await this.found(update, 'Extra', id);
    return this.list();
  }

  async updatePaymentFee(id: string, dto: UpdatePaymentFeeDto): Promise<Surcharges> {
    await this.found(this.surcharges.updatePaymentFee(id, dto), 'Payment method', id);
    return this.list();
  }

  private async found(update: Promise<boolean>, what: string, id: string): Promise<void> {
    if (!(await update)) throw new NotFoundException(`${what} ${id} not found`);
  }
}

function definedOnly<T extends object>(dto: T): Partial<T> {
  return Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined)) as Partial<T>;
}
