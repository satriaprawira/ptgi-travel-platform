import { apiRequest } from "./client";

// Mirrors GET /v1/reservation-options and POST /v1/quotes in apps/api (pricing, reservation-options).

export interface VehicleType {
  id: string;
  code: string;
  name: string;
  note: string | null;
  label: string;
  /** null = "please inquire". */
  surchargeJpy: number | null;
}

export interface PaymentMethod {
  id: string;
  code: string;
  kind: "card" | "paypal" | "cash" | "bank_transfer";
  label: string;
  description: string | null;
  feeJpy: number;
}

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
}

export interface AddOn {
  id: string;
  code: string;
  label: string;
  priceJpy: number;
  freeQuantity: number;
  maxQuantity: number;
}

export interface ReservationOptions {
  vehicleTypes: VehicleType[];
  paymentMethods: PaymentMethod[];
  airports: Airport[];
  serviceRegions: ServiceRegion[];
  addOns: AddOn[];
}

export interface QuoteRequest {
  airportId: string;
  serviceRegionId: string;
  vehicleTypeId: string;
  paymentMethodId: string;
  pickupDate: string;
  pickupTime: string;
  addOns: { addOnId: string; quantity: number }[];
}

export interface QuoteLine {
  code: "base-fare" | "vehicle" | "pickup-time" | "lead-time" | "add-on" | "payment";
  label: string;
  /** null = staff will quote this part. */
  amountJpy: number | null;
  minAmountJpy?: number;
}

export interface Quote {
  currency: "JPY";
  lines: QuoteLine[];
  /** The price, or when quoteRequired, the lowest it can be ("from"). */
  totalJpy: number;
  quoteRequired: boolean;
}

export const getReservationOptions = () => apiRequest<ReservationOptions>("/reservation-options");

export const requestQuote = (request: QuoteRequest, signal?: AbortSignal) =>
  apiRequest<Quote>("/quotes", { method: "POST", body: request, signal });
