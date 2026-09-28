import { apiRequest } from "./client";

// Mirrors apps/api/src/surcharges: the "Additional Cost" price sheet (admin).

export interface VehicleSurcharge {
  id: string;
  label: string;
  /** null = "please inquire". */
  surchargeJpy: number | null;
}

export interface TimeSurcharge {
  id: string;
  /** Just the name; the API appends the window where customers see it. */
  label: string;
  startsAt: string; // "HH:MM", Tokyo time
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

/** Which list a row belongs to; also the API path segment for its PATCH. */
export type SurchargeKind = "vehicle-types" | "pickup-times" | "last-minute" | "add-ons" | "payment-methods";

export const listSurcharges = () => apiRequest<Surcharges>("/admin/surcharges");

/** Every PATCH returns the whole, updated sheet. */
export const updateSurcharge = (kind: SurchargeKind, id: string, update: Record<string, unknown>) =>
  apiRequest<Surcharges>(`/admin/surcharges/${kind}/${id}`, { method: "PATCH", body: update });
