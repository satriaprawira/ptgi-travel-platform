import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { buildSetClause } from '../database/set-clause.js';
import type { UpdateFareDto } from './dto/update-fare.dto.js';

interface FareRow {
  id: string;
  zone: string;
  price_jpy: number | null;
  min_price_jpy: number | null;
  is_active: boolean;
  updated_at: Date;
  airport_id: string;
  airport_code: string;
  airport_name: string;
  region_id: string;
  region_code: string;
  region_name: string;
  inside_23_wards: boolean;
}

export interface AdminFare {
  id: string;
  airport: { id: string; code: string; name: string };
  region: { id: string; code: string; name: string; inside23Wards: boolean };
  zone: string;
  /** null = "will be adjusted": quote on request. */
  priceJpy: number | null;
  minPriceJpy: number | null;
  isActive: boolean;
  updatedAt: Date;
}

const SELECT_FARES = `
  SELECT f.id, f.zone, f.price_jpy, f.min_price_jpy, f.is_active, f.updated_at,
         a.id AS airport_id, a.code AS airport_code, a.name AS airport_name,
         r.id AS region_id, r.code AS region_code, r.name AS region_name, r.inside_23_wards
  FROM fares f
  JOIN airports a ON a.id = f.airport_id
  JOIN service_regions r ON r.id = f.service_region_id`;

// Same order as the staff price sheet: per airport, by zone, then area.
const LIST_FARES = `${SELECT_FARES}
  ORDER BY a.sort_order, f.zone, r.sort_order, r.name`;

const FIND_FARE = `${SELECT_FARES}
  WHERE f.id = $1`;

// Code-side whitelist for PATCH (design doc 7.1): only these columns can appear in SET.
const UPDATABLE_COLUMNS: { [K in keyof UpdateFareDto]-?: string } = {
  zone: 'zone',
  priceJpy: 'price_jpy',
  minPriceJpy: 'min_price_jpy',
  isActive: 'is_active',
};

function toFare(row: FareRow): AdminFare {
  return {
    id: row.id,
    airport: { id: row.airport_id, code: row.airport_code, name: row.airport_name },
    region: { id: row.region_id, code: row.region_code, name: row.region_name, inside23Wards: row.inside_23_wards },
    zone: row.zone,
    priceJpy: row.price_jpy,
    minPriceJpy: row.min_price_jpy,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class FaresRepository {
  constructor(private readonly db: DatabaseService) {}

  async list(): Promise<AdminFare[]> {
    const { rows } = await this.db.query<FareRow>(LIST_FARES);
    return rows.map(toFare);
  }

  async findById(id: string): Promise<AdminFare | null> {
    const { rows } = await this.db.query<FareRow>(FIND_FARE, [id]);
    return rows[0] ? toFare(rows[0]) : null;
  }

  /** Returns false when no fare has this id. `patch` must set at least one column. */
  async update(id: string, patch: UpdateFareDto): Promise<boolean> {
    const set = buildSetClause(patch, UPDATABLE_COLUMNS);
    const { rowCount } = await this.db.query(
      `UPDATE fares SET ${set.sql} WHERE id = $${set.values.length + 1}`,
      [...set.values, id],
    );
    return rowCount === 1;
  }
}
