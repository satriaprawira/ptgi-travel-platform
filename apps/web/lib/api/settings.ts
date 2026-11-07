import { apiRequest } from "./client";

// Mirrors apps/api/src/settings: booking rules staff can change. Everyone signed in reads, admins change.

export interface BookingSettings {
  /** Minutes added after each booking's 3-hour hold before its car can take another booking (FT-12). */
  bufferMinutes: number;
  updatedAt: string;
}

export const getSettings = () => apiRequest<BookingSettings>("/admin/settings");

export const updateSettings = (bufferMinutes: number) =>
  apiRequest<BookingSettings>("/admin/settings", { method: "PATCH", body: { bufferMinutes } });
