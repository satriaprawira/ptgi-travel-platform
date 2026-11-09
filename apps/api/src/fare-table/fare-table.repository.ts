import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type { FareRow, VehicleClassCapacity } from './fare-table.js';

const LIST_ACTIVE_FARES = `
  SELECT f.airport_id, r.code AS region_code, r.name AS region_name, f.price_jpy, f.min_price_jpy
  FROM fares f
  JOIN service_regions r ON r.id = f.service_region_id
  WHERE f.is_active
  ORDER BY r.sort_order, r.name`;

// Classes with at least one Available car (the same rule as "offered" vehicle types), and the most seats
// and suitcases among those cars. Maintenance and Retired cars don't count.
const LIST_AVAILABLE_CLASSES = `
  SELECT c.code, c.name, max(v.capacity_pax) AS max_passengers, max(v.capacity_bags) AS max_suitcases
  FROM vehicle_classes c
  JOIN vehicles v ON v.vehicle_class_id = c.id AND v.status = 'active'
  GROUP BY c.id
  ORDER BY c.sort_order, c.name`;

const LIST_TYPE_CLASSES = `
  SELECT t.id, c.code AS class_code
  FROM vehicle_types t
  JOIN vehicle_classes c ON c.id = t.vehicle_class_id`;

@Injectable()
export class FareTableRepository {
  constructor(private readonly db: DatabaseService) {}

  async listActiveFares(): Promise<FareRow[]> {
    const { rows } = await this.db.query<{
      airport_id: string;
      region_code: string;
      region_name: string;
      price_jpy: number | null;
      min_price_jpy: number | null;
    }>(LIST_ACTIVE_FARES);
    return rows.map((row) => ({
      airportId: row.airport_id,
      regionCode: row.region_code,
      regionName: row.region_name,
      priceJpy: row.price_jpy,
      minPriceJpy: row.min_price_jpy,
    }));
  }

  async listAvailableClasses(): Promise<VehicleClassCapacity[]> {
    const { rows } = await this.db.query<{ code: string; name: string; max_passengers: number; max_suitcases: number }>(
      LIST_AVAILABLE_CLASSES,
    );
    return rows.map((row) => ({
      code: row.code,
      name: row.name,
      maxPassengers: row.max_passengers,
      maxSuitcases: row.max_suitcases,
    }));
  }

  /** Vehicle type id → fleet class code. */
  async mapTypeClasses(): Promise<Map<string, string>> {
    const { rows } = await this.db.query<{ id: string; class_code: string }>(LIST_TYPE_CLASSES);
    return new Map(rows.map((row) => [row.id, row.class_code]));
  }
}
