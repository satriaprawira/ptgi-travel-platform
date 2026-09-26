import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { isPgError, PgErrorCode } from '../database/pg-error.js';
import type { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehiclesRepository, type Vehicle, type VehicleClass } from './vehicles.repository.js';

@Injectable()
export class VehiclesService {
  constructor(private readonly vehicles: VehiclesRepository) {}

  listClasses(): Promise<VehicleClass[]> {
    return this.vehicles.listClasses();
  }

  list(): Promise<Vehicle[]> {
    return this.vehicles.list();
  }

  async get(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const id = await this.vehicles.insert(dto).catch(translateWriteError);
    return this.get(id);
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('No fields to update');
    }
    const found = await this.vehicles.update(id, dto).catch(translateWriteError);
    if (!found) throw new NotFoundException(`Vehicle ${id} not found`);
    return this.get(id);
  }

  async delete(id: string): Promise<void> {
    const found = await this.vehicles.delete(id).catch((error: unknown) => {
      // Assigned drivers are unassigned by ON DELETE SET NULL; any other reference (trips, later) blocks it.
      if (isPgError(error, PgErrorCode.ForeignKeyViolation)) {
        throw new ConflictException('Vehicle is still referenced; retire it instead of deleting');
      }
      throw error;
    });
    if (!found) throw new NotFoundException(`Vehicle ${id} not found`);
  }
}

function translateWriteError(error: unknown): never {
  if (isPgError(error, PgErrorCode.UniqueViolation, 'vehicles_plate_number_key')) {
    throw new ConflictException('A vehicle with this plate number already exists');
  }
  if (isPgError(error, PgErrorCode.ForeignKeyViolation, 'vehicles_vehicle_class_id_fkey')) {
    throw new UnprocessableEntityException('vehicleClassId does not match any vehicle class');
  }
  throw error;
}
