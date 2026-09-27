import { Injectable } from '@nestjs/common';
import { DatabaseService, type Queryable } from '../database/database.service.js';
import { buildSetClause } from '../database/set-clause.js';
import type { CreateDriverDto, DriverStatus } from './dto/create-driver.dto.js';
import type { UpdateDriverDto } from './dto/update-driver.dto.js';

interface DriverRow {
  id: string;
  full_name: string;
  phone: string;
  license_number: string | null;
  status: DriverStatus;
  created_at: Date;
  updated_at: Date;
  vehicle_id: string | null;
  vehicle_model: string | null;
  vehicle_plate_number: string | null;
  vehicle_class_name: string | null;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string | null;
  status: DriverStatus;
  vehicle: { id: string; model: string; plateNumber: string; vehicleClassName: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const SELECT_DRIVERS = `
  SELECT d.id, d.full_name, d.phone, d.license_number, d.status, d.created_at, d.updated_at,
         v.id AS vehicle_id, v.model AS vehicle_model, v.plate_number AS vehicle_plate_number,
         c.name AS vehicle_class_name
  FROM drivers d
  LEFT JOIN vehicles v ON v.id = d.vehicle_id
  LEFT JOIN vehicle_classes c ON c.id = v.vehicle_class_id`;

const LIST_DRIVERS = `${SELECT_DRIVERS}
  ORDER BY d.full_name, d.created_at`;

const FIND_DRIVER = `${SELECT_DRIVERS}
  WHERE d.id = $1`;

// FOR SHARE OF v: the vehicle can't be deleted or change status until the assigning transaction ends.
const LOCK_VEHICLE = `
  SELECT v.status, d.id AS driver_id
  FROM vehicles v
  LEFT JOIN drivers d ON d.vehicle_id = v.id
  WHERE v.id = $1
  FOR SHARE OF v`;

const INSERT_DRIVER = `
  INSERT INTO drivers (full_name, phone, license_number, vehicle_id, status)
  VALUES ($1, $2, $3, $4, COALESCE($5::driver_status, 'active'))
  RETURNING id`;

const DELETE_DRIVER = `
  DELETE FROM drivers
  WHERE id = $1`;

// Code-side whitelist for PATCH (design doc 7.1): only these columns can appear in SET.
const UPDATABLE_COLUMNS: { [K in keyof UpdateDriverDto]-?: string } = {
  fullName: 'full_name',
  phone: 'phone',
  licenseNumber: 'license_number',
  vehicleId: 'vehicle_id',
  status: 'status',
};

function toDriver(row: DriverRow): Driver {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    licenseNumber: row.license_number,
    status: row.status,
    vehicle:
      row.vehicle_id === null
        ? null
        : {
            id: row.vehicle_id,
            model: row.vehicle_model ?? '',
            plateNumber: row.vehicle_plate_number ?? '',
            vehicleClassName: row.vehicle_class_name ?? '',
          },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class DriversRepository {
  constructor(private readonly db: DatabaseService) {}

  async list(): Promise<Driver[]> {
    const { rows } = await this.db.query<DriverRow>(LIST_DRIVERS);
    return rows.map(toDriver);
  }

  async findById(id: string): Promise<Driver | null> {
    const { rows } = await this.db.query<DriverRow>(FIND_DRIVER, [id]);
    return rows[0] ? toDriver(rows[0]) : null;
  }

  /** Locks the vehicle row for the rest of the transaction; null when it doesn't exist. */
  async lockVehicle(
    q: Queryable,
    vehicleId: string,
  ): Promise<{ status: string; driverId: string | null } | null> {
    const { rows } = await q.query<{ status: string; driver_id: string | null }>(LOCK_VEHICLE, [vehicleId]);
    return rows[0] ? { status: rows[0].status, driverId: rows[0].driver_id } : null;
  }

  async insert(q: Queryable, dto: CreateDriverDto): Promise<string> {
    const { rows } = await q.query<{ id: string }>(INSERT_DRIVER, [
      dto.fullName,
      dto.phone,
      dto.licenseNumber ?? null,
      dto.vehicleId ?? null,
      dto.status ?? null,
    ]);
    return rows[0].id;
  }

  /** Returns false when no driver has this id. `patch` must set at least one column. */
  async update(q: Queryable, id: string, patch: UpdateDriverDto): Promise<boolean> {
    const set = buildSetClause(patch, UPDATABLE_COLUMNS);
    const { rowCount } = await q.query(
      `UPDATE drivers SET ${set.sql} WHERE id = $${set.values.length + 1}`,
      [...set.values, id],
    );
    return rowCount === 1;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.db.query(DELETE_DRIVER, [id]);
    return rowCount === 1;
  }
}
