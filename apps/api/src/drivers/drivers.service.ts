import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DatabaseService, type Queryable } from '../database/database.service.js';
import { isPgError, PgErrorCode } from '../database/pg-error.js';
import { DriversRepository, type Driver } from './drivers.repository.js';
import type { CreateDriverDto } from './dto/create-driver.dto.js';
import type { UpdateDriverDto } from './dto/update-driver.dto.js';

@Injectable()
export class DriversService {
  constructor(
    private readonly db: DatabaseService,
    private readonly drivers: DriversRepository,
  ) {}

  list(): Promise<Driver[]> {
    return this.drivers.list();
  }

  async get(id: string): Promise<Driver> {
    const driver = await this.drivers.findById(id);
    if (!driver) throw new NotFoundException(`Driver ${id} not found`);
    return driver;
  }

  async create(dto: CreateDriverDto): Promise<Driver> {
    const id = await this.db
      .transaction(async (client) => {
        if (dto.vehicleId) await this.assertAssignable(client, dto.vehicleId);
        return this.drivers.insert(client, dto);
      })
      .catch(translateWriteError);
    return this.get(id);
  }

  async update(id: string, dto: UpdateDriverDto): Promise<Driver> {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('No fields to update');
    }
    const found = await this.db
      .transaction(async (client) => {
        if (dto.vehicleId) await this.assertAssignable(client, dto.vehicleId, id);
        return this.drivers.update(client, id, dto);
      })
      .catch(translateWriteError);
    if (!found) throw new NotFoundException(`Driver ${id} not found`);
    return this.get(id);
  }

  async delete(id: string): Promise<void> {
    const found = await this.drivers.delete(id);
    if (!found) throw new NotFoundException(`Driver ${id} not found`);
  }

  /**
   * The vehicle must exist and, unless `driverId` already has it, not be retired (a driver can keep a
   * vehicle that was retired after assignment). Holds a row lock until the transaction ends.
   */
  private async assertAssignable(client: Queryable, vehicleId: string, driverId?: string): Promise<void> {
    const vehicle = await this.drivers.lockVehicle(client, vehicleId);
    if (vehicle === null) {
      throw new UnprocessableEntityException('vehicleId does not match any vehicle');
    }
    if (vehicle.status === 'retired' && vehicle.driverId !== driverId) {
      throw new UnprocessableEntityException('A retired vehicle cannot be assigned to a driver');
    }
  }
}

function translateWriteError(error: unknown): never {
  if (isPgError(error, PgErrorCode.UniqueViolation, 'drivers_vehicle_id_key')) {
    throw new ConflictException('That vehicle is already assigned to another driver');
  }
  if (isPgError(error, PgErrorCode.UniqueViolation, 'drivers_license_number_key')) {
    throw new ConflictException('A driver with this license number already exists');
  }
  throw error;
}
