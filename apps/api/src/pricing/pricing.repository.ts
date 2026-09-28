import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface Airport {
  id: string;
  code: string;
  name: string;
}

export interface ServiceRegion {
  id: string;
  code: string;
  name: string;
  inside23Wards: boolean;
  /** Airports with an active fare to this area: the form only offers the area for these. */
  airportIds: string[];
}

export interface AddOn {
  id: string;
  code: string;
  label: string;
  priceJpy: number;
  freeQuantity: number;
  maxQuantity: number;
}

export interface Fare {
  airportName: string;
  regionName: string;
  /** null = "will be adjusted": staff quote it. */
  priceJpy: number | null;
  minPriceJpy: number | null;
}

export interface TimeSurcharge {
  label: string;
  startsAt: string; // "HH:MM:SS" — pg returns `time` as a string
  endsAt: string;
  amountJpy: number;
}

export interface LeadTimeSurcharge {
  label: string;
  withinHours: number;
  amountJpy: number;
}

const LIST_AIRPORTS = `
  SELECT id, code, name
  FROM airports
  ORDER BY sort_order, name`;

const LIST_ACTIVE_ADD_ONS = `
  SELECT id, code, label, price_jpy, free_quantity, max_quantity
  FROM add_ons
  WHERE is_active
  ORDER BY sort_order, label`;

// Only regions with an active fare from at least one airport are offered, each with those airports.
// airport_ids comes back as text[] so pg returns a plain string array.
const LIST_PRICED_REGIONS = `
  SELECT r.id, r.code, r.name, r.inside_23_wards,
         array_agg(f.airport_id::text ORDER BY a.sort_order) AS airport_ids
  FROM service_regions r
  JOIN fares f ON f.service_region_id = r.id AND f.is_active
  JOIN airports a ON a.id = f.airport_id
  GROUP BY r.id
  ORDER BY r.sort_order, r.name`;

const FIND_ACTIVE_FARE = `
  SELECT a.name AS airport_name, r.name AS region_name, f.price_jpy, f.min_price_jpy
  FROM fares f
  JOIN airports a ON a.id = f.airport_id
  JOIN service_regions r ON r.id = f.service_region_id
  WHERE f.airport_id = $1 AND f.service_region_id = $2 AND f.is_active`;

const LIST_ACTIVE_TIME_SURCHARGES = `
  SELECT label, starts_at, ends_at, amount_jpy
  FROM time_surcharges
  WHERE is_active
  ORDER BY sort_order`;

const LIST_ACTIVE_LEAD_TIME_SURCHARGES = `
  SELECT label, within_hours, amount_jpy
  FROM lead_time_surcharges
  WHERE is_active`;

@Injectable()
export class PricingRepository {
  constructor(private readonly db: DatabaseService) {}

  async listAirports(): Promise<Airport[]> {
    const { rows } = await this.db.query<Airport>(LIST_AIRPORTS);
    return rows;
  }

  async listPricedRegions(): Promise<ServiceRegion[]> {
    const { rows } = await this.db.query<{
      id: string;
      code: string;
      name: string;
      inside_23_wards: boolean;
      airport_ids: string[];
    }>(LIST_PRICED_REGIONS);
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      inside23Wards: row.inside_23_wards,
      airportIds: row.airport_ids,
    }));
  }

  async listActiveAddOns(): Promise<AddOn[]> {
    const { rows } = await this.db.query<{
      id: string;
      code: string;
      label: string;
      price_jpy: number;
      free_quantity: number;
      max_quantity: number;
    }>(LIST_ACTIVE_ADD_ONS);
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label,
      priceJpy: row.price_jpy,
      freeQuantity: row.free_quantity,
      maxQuantity: row.max_quantity,
    }));
  }

  async findActiveFare(airportId: string, serviceRegionId: string): Promise<Fare | null> {
    const { rows } = await this.db.query<{
      airport_name: string;
      region_name: string;
      price_jpy: number | null;
      min_price_jpy: number | null;
    }>(FIND_ACTIVE_FARE, [airportId, serviceRegionId]);
    const row = rows[0];
    return row
      ? { airportName: row.airport_name, regionName: row.region_name, priceJpy: row.price_jpy, minPriceJpy: row.min_price_jpy }
      : null;
  }

  async listActiveTimeSurcharges(): Promise<TimeSurcharge[]> {
    const { rows } = await this.db.query<{ label: string; starts_at: string; ends_at: string; amount_jpy: number }>(
      LIST_ACTIVE_TIME_SURCHARGES,
    );
    return rows.map((row) => ({ label: row.label, startsAt: row.starts_at, endsAt: row.ends_at, amountJpy: row.amount_jpy }));
  }

  async listActiveLeadTimeSurcharges(): Promise<LeadTimeSurcharge[]> {
    const { rows } = await this.db.query<{ label: string; within_hours: number; amount_jpy: number }>(
      LIST_ACTIVE_LEAD_TIME_SURCHARGES,
    );
    return rows.map((row) => ({ label: row.label, withinHours: row.within_hours, amountJpy: row.amount_jpy }));
  }
}
