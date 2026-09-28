import { apiRequest } from "./client";

// Mirrors apps/api/src/fares (admin route pricing).

export interface AdminFare {
  id: string;
  airport: { id: string; code: string; name: string };
  region: { id: string; code: string; name: string; inside23Wards: boolean };
  zone: string;
  /** null = quote on request ("will be adjusted"). */
  priceJpy: number | null;
  /** "From ¥N" hint while quote on request. */
  minPriceJpy: number | null;
  isActive: boolean;
}

export interface FareUpdate {
  zone?: string;
  priceJpy?: number | null;
  minPriceJpy?: number | null;
  isActive?: boolean;
}

export const listFares = () => apiRequest<AdminFare[]>("/admin/fares");
export const updateFare = (id: string, update: FareUpdate) =>
  apiRequest<AdminFare>(`/admin/fares/${id}`, { method: "PATCH", body: update });
