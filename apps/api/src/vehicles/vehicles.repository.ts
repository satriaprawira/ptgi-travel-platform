import { Injectable } from '@nestjs/common';
import { DatabaseService, type Queryable } from '../database/database.service.js';
import { buildSetClause } from '../database/set-clause.js';
import type { CreateVehicleDto, VehicleStatus } from './dto/create-vehicle.dto.js';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto.js';

interface VehicleClassRow {
  id: string;
  code: string;
  name: string;
}

interface VehicleRow {
  id: string;
  model: string;
  plate_number: string;
  capacity_pax: number;
  capacity_bags: number;
  status: VehicleStatus;
  created_at: Date;
  updated_at: Date;
  class_id: string;
  class_code: string;
  class_name: string;
  driver_id: string | null;
  driver_full_name: string | null;
}

export interface VehicleClass {
  id: string;
  code: string;
  name: string;
}

export interface Vehicle {
  id: string;
  model: string;
  plateNumber: string;
  vehicleClass: VehicleClass;
  capacityPax: number;
  capacityBags: number;
  status: VehicleStatus;
  assignedDriver: { id: string; fullName: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const LIST_CLASSES = `
  SELECT id, code, name
  FROM vehicle_classes
  ORDER BY sort_order, name`;

const SELECT_VEHICLES = `
  SELECT v.id, v.model, v.plate_number, v.capacity_pax, v.capacity_bags, v.status,
         v.created_at, v.updated_at,
         c.id AS class_id, c.code AS class_code, c.name AS class_name,
         d.id AS driver_id, d.full_name AS driver_full_name
  FROM vehicles v
  JOIN vehicle_classes c ON c.id = v.vehicle_class_id
  LEFT JOIN drivers d ON d.vehicle_id = v.id`;

const LIST_VEHICLES = `${SELECT_VEHICLES}
  ORDER BY c.sort_order, v.model, v.plate_number`;

const FIND_VEHICLE = `${SELECT_VEHICLES}
  WHERE v.id = $1`;

const INSERT_VEHICLE = `
  INSERT INTO vehicles (vehicle_class_id, model, plate_number, capacity_pax, capacity_bags, status)
  VALUES ($1, $2, $3, $4, $5, COALESCE($6::vehicle_status, 'active'))
  RETURNING id`;

const DELETE_VEHICLE = `
  DELETE FROM vehicles
  WHERE id = $1
  RETURNING id`;

// Code-side whitelist for PATCH (design doc 7.1): only these columns can appear in SET.
const UPDATABLE_COLUMNS: { [K in keyof UpdateVehicleDto]-?: string } = {
  vehicleClassId: 'vehicle_class_id',
  model: 'model',
  plateNumber: 'plate_number',
  capacityPax: 'capacity_pax',
  capacityBags: 'capacity_bags',
  status: 'status',
};

function toVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    model: row.model,
    plateNumber: row.plate_number,
    vehicleClass: { id: row.class_id, code: row.class_code, name: row.class_name },
    capacityPax: row.capacity_pax,
    capacityBags: row.capacity_bags,
    status: row.status,
    assignedDriver:
      row.driver_id === null ? null : { id: row.driver_id, fullName: row.driver_full_name ?? '' },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class VehiclesRepository {
  constructor(private readonly db: DatabaseService) {}

  async listClasses(): Promise<VehicleClass[]> {
    const { rows } = await this.db.query<VehicleClassRow>(LIST_CLASSES);
    return rows;
  }

  async list(): Promise<Vehicle[]> {
    const { rows } = await this.db.query<VehicleRow>(LIST_VEHICLES);
    return rows.map(toVehicle);
  }

  async findById(id: string, q: Queryable = this.db): Promise<Vehicle | null> {
    const { rows } = await q.query<VehicleRow>(FIND_VEHICLE, [id]);
    return rows[0] ? toVehicle(rows[0]) : null;
  }

  async insert(dto: CreateVehicleDto): Promise<string> {
    const { rows } = await this.db.query<{ id: string }>(INSERT_VEHICLE, [
      dto.vehicleClassId,
      dto.model,
      dto.plateNumber,
      dto.capacityPax,
      dto.capacityBags,
      dto.status ?? null,
    ]);
    return rows[0].id;
  }

  /** Returns false when no vehicle has this id. `patch` must set at least one column. */
  async update(id: string, patch: UpdateVehicleDto): Promise<boolean> {
    const set = buildSetClause(patch, UPDATABLE_COLUMNS);
    const { rowCount } = await this.db.query(
      `UPDATE vehicles SET ${set.sql} WHERE id = $${set.values.length + 1}`,
      [...set.values, id],
    );
    return rowCount === 1;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.db.query(DELETE_VEHICLE, [id]);
    return rowCount === 1;
  }
}
