import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export type PaymentKind = 'card' | 'paypal' | 'cash' | 'bank_transfer';

interface PaymentMethodRow {
  id: string;
  code: string;
  kind: PaymentKind;
  label: string;
  description: string | null;
  fee_jpy: number;
}

export interface PaymentMethod {
  id: string;
  code: string;
  kind: PaymentKind;
  label: string;
  description: string | null;
  feeJpy: number;
}

const COLUMNS = `id, code, kind, label, description, fee_jpy`;

const LIST_ACTIVE = `
  SELECT ${COLUMNS}
  FROM payment_methods
  WHERE is_active
  ORDER BY sort_order, label`;

const FIND_ACTIVE = `
  SELECT ${COLUMNS}
  FROM payment_methods
  WHERE id = $1 AND is_active`;

function toPaymentMethod(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    code: row.code,
    kind: row.kind,
    label: row.label,
    description: row.description,
    feeJpy: row.fee_jpy,
  };
}

@Injectable()
export class PaymentMethodsRepository {
  constructor(private readonly db: DatabaseService) {}

  async listActive(): Promise<PaymentMethod[]> {
    const { rows } = await this.db.query<PaymentMethodRow>(LIST_ACTIVE);
    return rows.map(toPaymentMethod);
  }

  async findActive(id: string): Promise<PaymentMethod | null> {
    const { rows } = await this.db.query<PaymentMethodRow>(FIND_ACTIVE, [id]);
    return rows[0] ? toPaymentMethod(rows[0]) : null;
  }
}
