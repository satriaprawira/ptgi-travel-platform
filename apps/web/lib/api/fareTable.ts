import { apiRequest } from "./client";
import type { AddOn, Airport, PaymentMethod } from "./reservation";

// Mirrors GET /v1/fare-table in apps/api (src/fare-table/fare-table.ts): the current price list for the
// customer pages. It changes when staff edit prices, surcharges or cars in admin.

export interface FareGroup {
  /** null = staff quote it; minPriceJpy is then the lowest it can be ("from"). */
  priceJpy: number | null;
  minPriceJpy: number | null;
  regions: { code: string; name: string }[];
}

export interface FareTableAirport extends Airport {
  fareGroups: FareGroup[];
}

export interface VehicleClassCapacity {
  code: string;
  name: string;
  maxPassengers: number;
  maxSuitcases: number;
}

export interface VehicleCharge {
  classCode: string;
  name: string;
  /** One option per airport or area where the price differs, e.g. variant "Haneda". */
  options: { code: string; variant: string | null; surchargeJpy: number | null }[];
}

export interface TimeSurcharge {
  label: string;
  startsAt: string;
  endsAt: string;
  amountJpy: number;
}

export interface LeadTimeSurcharge {
  label: string;
  withinHours: number;
  amountJpy: number;
}

export interface FareTable {
  airports: FareTableAirport[];
  vehicleClasses: VehicleClassCapacity[];
  vehicleCharges: VehicleCharge[];
  timeSurcharges: TimeSurcharge[];
  leadTimeSurcharges: LeadTimeSurcharge[];
  addOns: AddOn[];
  paymentMethods: PaymentMethod[];
}

export const getFareTable = () => apiRequest<FareTable>("/fare-table");

/** The price list, or null when the API can't be reached (the page then shows what it can without it). */
export async function loadFareTable(): Promise<FareTable | null> {
  try {
    return await getFareTable();
  } catch (error) {
    console.error("Fare table unavailable:", error);
    return null;
  }
}
