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
}
