import { Injectable } from '@nestjs/common';
import { DatabaseService, type Queryable } from '../database/database.service.js';
import { buildSetClause } from '../database/set-clause.js';
import { windowText } from '../pricing/quote.js';
import type {
  UpdateAddOnDto,
  UpdateLeadTimeSurchargeDto,
  UpdatePaymentFeeDto,
  UpdateTimeSurchargeDto,
  UpdateVehicleSurchargeDto,
} from './dto/update-surcharges.dto.js';

// Admin view of the "Additional Cost" price sheet: every row, including inactive ones.

export interface VehicleSurcharge {
  id: string;
  label: string;
  /** null = "please inquire". */
  surchargeJpy: number | null;
}

export interface TimeSurcharge {
  id: string;
  /** Just the name; the window is appended where it's shown to customers. */
  label: string;
  startsAt: string; // "HH:MM"
  endsAt: string; // exclusive
  /** As customers see it, last minute inclusive: "23:00–05:59". */
  windowText: string;
  amountJpy: number;
  isActive: boolean;
}

export interface LeadTimeSurcharge {
  id: string;
  label: string;
  withinHours: number;
  amountJpy: number;
  isActive: boolean;
}

export interface AddOnCost {
  id: string;
  label: string;
  priceJpy: number;
  freeQuantity: number;
  maxQuantity: number;
  isActive: boolean;
}

export interface PaymentFee {
  id: string;
  label: string;
  description: string | null;
  feeJpy: number;
}

export interface Surcharges {
  vehicleTypes: VehicleSurcharge[];
  timeSurcharges: TimeSurcharge[];
  leadTimeSurcharges: LeadTimeSurcharge[];
  addOns: AddOnCost[];
  paymentMethods: PaymentFee[];
}

const LIST_VEHICLE_SURCHARGES = `
  SELECT id, label, surcharge_jpy FROM vehicle_types ORDER BY sort_order, label`;

const SELECT_TIME_SURCHARGES = `
  SELECT id, label, to_char(starts_at, 'HH24:MI') AS starts_at, to_char(ends_at, 'HH24:MI') AS ends_at,
         amount_jpy, is_active
  FROM time_surcharges`;

const LIST_LEAD_TIME_SURCHARGES = `
  SELECT id, label, within_hours, amount_jpy, is_active FROM lead_time_surcharges ORDER BY within_hours DESC`;

const LIST_ADD_ONS = `
  SELECT id, label, price_jpy, free_quantity, max_quantity, is_active FROM add_ons ORDER BY sort_order, label`;

const LIST_PAYMENT_FEES = `
  SELECT id, label, description, fee_jpy FROM payment_methods ORDER BY sort_order, label`;

// Serializes edits to pickup-time windows so two admins can't create overlapping windows at once.
const LOCK_TIME_SURCHARGES = `SELECT pg_advisory_xact_lock(hashtext('time_surcharges'))`;

// Code-side whitelists for PATCH (design doc 7.1): only these columns can appear in SET.
const TIME_COLUMNS: { [K in keyof UpdateTimeSurchargeDto]-?: string } = {
  label: 'label',
  startsAt: 'starts_at',
  endsAt: 'ends_at',
  amountJpy: 'amount_jpy',
  isActive: 'is_active',
};
const LEAD_TIME_COLUMNS: { [K in keyof UpdateLeadTimeSurchargeDto]-?: string } = {
  label: 'label',
  withinHours: 'within_hours',
  amountJpy: 'amount_jpy',
  isActive: 'is_active',
};
const ADD_ON_COLUMNS: { [K in keyof UpdateAddOnDto]-?: string } = {
  label: 'label',
  priceJpy: 'price_jpy',
  freeQuantity: 'free_quantity',
  maxQuantity: 'max_quantity',
  isActive: 'is_active',
};
const VEHICLE_COLUMNS: { [K in keyof UpdateVehicleSurchargeDto]-?: string } = { surchargeJpy: 'surcharge_jpy' };
const PAYMENT_COLUMNS: { [K in keyof UpdatePaymentFeeDto]-?: string } = { feeJpy: 'fee_jpy' };

type TimeRow = { id: string; label: string; starts_at: string; ends_at: string; amount_jpy: number; is_active: boolean };

const toTimeSurcharge = (row: TimeRow): TimeSurcharge => ({
  id: row.id,
  label: row.label,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  windowText: windowText(row.starts_at, row.ends_at),
  amountJpy: row.amount_jpy,
  isActive: row.is_active,
});

@Injectable()
export class SurchargesRepository {
  constructor(private readonly db: DatabaseService) {}

  async listAll(): Promise<Surcharges> {
    const [vehicles, times, leadTimes, addOns, payments] = await Promise.all([
      this.db.query<{ id: string; label: string; surcharge_jpy: number | null }>(LIST_VEHICLE_SURCHARGES),
      this.listTimeSurcharges(this.db),
      this.db.query<{ id: string; label: string; within_hours: number; amount_jpy: number; is_active: boolean }>(
        LIST_LEAD_TIME_SURCHARGES,
      ),
      this.db.query<{
        id: string;
        label: string;
        price_jpy: number;
        free_quantity: number;
        max_quantity: number;
        is_active: boolean;
      }>(LIST_ADD_ONS),
      this.db.query<{ id: string; label: string; description: string | null; fee_jpy: number }>(LIST_PAYMENT_FEES),
    ]);

    return {
      vehicleTypes: vehicles.rows.map((r) => ({ id: r.id, label: r.label, surchargeJpy: r.surcharge_jpy })),
      timeSurcharges: times,
      leadTimeSurcharges: leadTimes.rows.map((r) => ({
        id: r.id,
        label: r.label,
        withinHours: r.within_hours,
        amountJpy: r.amount_jpy,
        isActive: r.is_active,
      })),
      addOns: addOns.rows.map((r) => ({
        id: r.id,
        label: r.label,
        priceJpy: r.price_jpy,
        freeQuantity: r.free_quantity,
        maxQuantity: r.max_quantity,
        isActive: r.is_active,
      })),
      paymentMethods: payments.rows.map((r) => ({
        id: r.id,
        label: r.label,
        description: r.description,
        feeJpy: r.fee_jpy,
      })),
    };
  }

  async listTimeSurcharges(q: Queryable): Promise<TimeSurcharge[]> {
    const { rows } = await q.query<TimeRow>(`${SELECT_TIME_SURCHARGES} ORDER BY sort_order, starts_at`);
    return rows.map(toTimeSurcharge);
  }

  lockTimeSurcharges(q: Queryable): Promise<unknown> {
    return q.query(LOCK_TIME_SURCHARGES);
  }

  updateVehicleSurcharge(id: string, dto: UpdateVehicleSurchargeDto) {
    return this.update(this.db, 'vehicle_types', id, dto, VEHICLE_COLUMNS);
  }

  updateTimeSurcharge(q: Queryable, id: string, dto: UpdateTimeSurchargeDto) {
    return this.update(q, 'time_surcharges', id, dto, TIME_COLUMNS);
  }

  updateLeadTimeSurcharge(id: string, dto: UpdateLeadTimeSurchargeDto) {
    return this.update(this.db, 'lead_time_surcharges', id, dto, LEAD_TIME_COLUMNS);
  }

  updateAddOn(id: string, dto: UpdateAddOnDto) {
    return this.update(this.db, 'add_ons', id, dto, ADD_ON_COLUMNS);
  }

  updatePaymentFee(id: string, dto: UpdatePaymentFeeDto) {
    return this.update(this.db, 'payment_methods', id, dto, PAYMENT_COLUMNS);
  }

  /** `table` is always one of the constants above, never user input. Returns false if no row has `id`. */
  private async update<T extends object>(
    q: Queryable,
    table: 'vehicle_types' | 'time_surcharges' | 'lead_time_surcharges' | 'add_ons' | 'payment_methods',
    id: string,
    patch: T,
    columns: { [K in keyof T]?: string },
  ): Promise<boolean> {
    const set = buildSetClause(patch, columns);
    const { rowCount } = await q.query(`UPDATE ${table} SET ${set.sql} WHERE id = $${set.values.length + 1}`, [
      ...set.values,
      id,
    ]);
    return rowCount === 1;
  }
}
