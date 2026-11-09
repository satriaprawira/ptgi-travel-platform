import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

interface VehicleTypeRow {
  id: string;
  code: string;
  name: string;
  note: string | null;
  label: string;
  surcharge_jpy: number | null;
}

export interface VehicleType {
  id: string;
  code: string;
  name: string;
  note: string | null;
  label: string;
  /** null = "please inquire". */
  surchargeJpy: number | null;
}

// "Offered" = active in the catalog AND the fleet has at least one Available vehicle of the type's
// class. Maintenance and Retired vehicles don't count. Not time-aware yet: that needs bookings.
const OFFERED = `
  t.is_active
  AND EXISTS (
    SELECT 1 FROM vehicles v
    WHERE v.vehicle_class_id = t.vehicle_class_id AND v.status = 'active'
  )`;

const COLUMNS = `t.id, t.code, t.name, t.note, t.label, t.surcharge_jpy`;

const LIST_OFFERED = `
  SELECT ${COLUMNS}
  FROM vehicle_types t
  WHERE ${OFFERED}
  ORDER BY t.sort_order, t.name`;

const FIND_OFFERED = `
  SELECT ${COLUMNS}
  FROM vehicle_types t
  WHERE t.id = $1 AND ${OFFERED}`;

/** A car category customers can rent for an "Others" trip (FT-4). */
export interface OfferedClass {
  id: string;
  code: string;
  name: string;
}

// A class is offered while the fleet has at least one Available vehicle of it, like vehicle types.
const OFFERED_CLASS = `
  EXISTS (SELECT 1 FROM vehicles v WHERE v.vehicle_class_id = c.id AND v.status = 'active')`;

const LIST_OFFERED_CLASSES = `
  SELECT c.id, c.code, c.name
  FROM vehicle_classes c
  WHERE ${OFFERED_CLASS}
  ORDER BY c.sort_order, c.name`;

const FIND_OFFERED_CLASS = `
  SELECT c.id, c.code, c.name
  FROM vehicle_classes c
  WHERE c.id = $1 AND ${OFFERED_CLASS}`;

function toVehicleType(row: VehicleTypeRow): VehicleType {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    note: row.note,
    label: row.label,
    surchargeJpy: row.surcharge_jpy,
  };
}

@Injectable()
export class VehicleTypesRepository {
  constructor(private readonly db: DatabaseService) {}

  /** The vehicle types a customer can book right now. */
  async listOffered(): Promise<VehicleType[]> {
    const { rows } = await this.db.query<VehicleTypeRow>(LIST_OFFERED);
    return rows.map(toVehicleType);
  }

  async findOffered(id: string): Promise<VehicleType | null> {
    const { rows } = await this.db.query<VehicleTypeRow>(FIND_OFFERED, [id]);
    return rows[0] ? toVehicleType(rows[0]) : null;
  }

  /** The car categories a customer can rent for an "Others" trip right now. */
  async listOfferedClasses(): Promise<OfferedClass[]> {
    const { rows } = await this.db.query<OfferedClass>(LIST_OFFERED_CLASSES);
    return rows;
  }

  async findOfferedClass(id: string): Promise<OfferedClass | null> {
    const { rows } = await this.db.query<OfferedClass>(FIND_OFFERED_CLASS, [id]);
    return rows[0] ?? null;
  }
}
