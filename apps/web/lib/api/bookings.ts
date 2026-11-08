import { apiRequest } from "./client";
import type { QuoteLine, QuoteRequest } from "./reservation";

// Mirrors apps/api/src/bookings: POST /v1/bookings (public) and /v1/admin/bookings (staff).

/** new: holds a car, awaiting staff. confirmed: vehicle and driver assigned. waitlisted: no car was free. */
export type BookingStatus = "new" | "confirmed" | "waitlisted" | "cancelled";
export type TripDirection = "from_airport" | "to_airport";

/** What the reservation form submits: the priced trip plus who is travelling. */
export interface BookingRequest extends QuoteRequest {
  direction: TripDirection;
  address: string;
  /** Arrival (from the airport) or departure (to the airport) terminal, e.g. "Terminal 3". */
  terminal: string | null;
  flightCode: string | null;
  salutation: string;
  passengerName: string;
  bookerName: string | null;
  countryOrigin: string;
  passengers: string;
  /** e.g. "L=1, M=2", or "No luggage". */
  luggage: string;
  oversizedLuggage: string | null;
  ageAdults: boolean;
  ageInfants: boolean;
  ageChildren: boolean;
  email: string;
  phoneCountryCode: string;
  phone: string;
  timesUsed: string | null;
  additionalRequests: string | null;
  petInfo: string | null;
  /** Must be true: the customer ticked "I agree to the Terms & Conditions". */
  acceptTerms: boolean;
  /** lib/content.ts TERMS_VERSION, stored with the booking. */
  termsVersion: string;
  /** When no car is free: true saves the request on the waiting list instead of refusing it. */
  joinWaitlist?: boolean;
}

/** What the customer gets back after "Confirm reservation". */
export interface BookingReceipt {
  reference: string;
  status: BookingStatus;
  pickupDate: string;
  pickupTime: string;
  vehicleLabel: string;
  paymentLabel: string;
  priceLines: QuoteLine[];
  totalJpy: number;
  quoteRequired: boolean;
}

export interface AdminBooking {
  id: string;
  reference: string;
  status: BookingStatus;
  direction: TripDirection;
  airport: { code: string; name: string };
  regionName: string;
  /** The fleet type the booking needs, e.g. "Grand Cabin". */
  vehicleClassName: string;
  address: string;
  /** Start and end of the time the vehicle is needed (ISO timestamps). holdUntil includes the buffer. */
  pickupAt: string;
  holdUntil: string;
  /** The buffer between bookings this booking was made with; the trip itself ends this many minutes before holdUntil. */
  bufferMinutes: number;
  /** Tokyo local date ("2026-10-16") and time ("14:30") of the pickup. */
  pickupDate: string;
  pickupTime: string;
  flightCode: string | null;
  terminal: string | null;
  vehicleLabel: string;
  paymentLabel: string;
  priceLines: QuoteLine[];
  addOns: { addOnId: string; label: string; quantity: number }[];
  /** The calculated price, or the "from" price when quoteRequired. */
  totalJpy: number;
  quoteRequired: boolean;
  /** Set when staff confirm. */
  finalTotalJpy: number | null;
  /** Assigned when staff confirm (kept on a cancelled booking as a record). */
  vehicle: { id: string; model: string; plateNumber: string } | null;
  driver: { id: string; fullName: string; phone: string } | null;
  /** False for an overbooked request or a partner-car trip: it doesn't take a fleet car (FT-11). */
  holdsFleetCar: boolean;
  /** Set when the trip was confirmed with a partner (outsourced) car. */
  partner: PartnerVehicle | null;
  salutation: string;
  passengerName: string;
  bookerName: string | null;
  countryOrigin: string;
  passengers: string;
  luggage: string;
  oversizedLuggage: string | null;
  ageAdults: boolean;
  ageInfants: boolean;
  ageChildren: boolean;
  email: string;
  phoneCountryCode: string;
  phone: string;
  timesUsed: string | null;
  additionalRequests: string | null;
  petInfo: string | null;
  /** Which Terms & Conditions the customer agreed to, and when. Null for bookings made before the checkbox existed. */
  termsVersion: string | null;
  termsAcceptedAt: string | null;
  createdAt: string;
}

export const createBooking = (request: BookingRequest) =>
  apiRequest<BookingReceipt>("/bookings", { method: "POST", body: request });

export const listBookings = () => apiRequest<AdminBooking[]>("/admin/bookings");

/** Vehicles and drivers that are free for a booking's whole time window. */
export interface AssignmentOptions {
  /** `usualDriverId`: the driver who normally drives this vehicle (Driver Management). */
  vehicles: { id: string; model: string; plateNumber: string; usualDriverId: string | null }[];
  drivers: { id: string; fullName: string }[];
}

export const getAssignmentOptions = (id: string) =>
  apiRequest<AssignmentOptions>(`/admin/bookings/${id}/assignment-options`);

export interface PartnerVehicle {
  /** e.g. "Toyota Alphard · Tokyo Limo Co." */
  vehicle: string;
  driverName: string;
  driverPhone: string | null;
}

/** A fleet vehicle and driver, or a partner car. */
export type Confirmation = ({ vehicleId: string; driverId: string } | { partner: PartnerVehicle }) & {
  /** Required for quote-required bookings, not accepted for fixed-price ones. */
  finalTotalJpy?: number;
};

export const confirmBooking = (id: string, confirmation: Confirmation) =>
  apiRequest<AdminBooking>(`/admin/bookings/${id}/confirm`, { method: "POST", body: confirmation });

/** New requests and confirmed trips that occupy a vehicle during `days` Tokyo days from `date` ("2026-10-16"). */
export const getSchedule = (date: string, days = 1) =>
  apiRequest<AdminBooking[]>(`/admin/bookings/schedule?date=${date}&days=${days}`);

/** The waiting list in joining order. `slotFree`: a vehicle of its type is free for its time right now. */
export type WaitlistedBooking = AdminBooking & { slotFree: boolean };
export const listWaitlist = () => apiRequest<WaitlistedBooking[]>("/admin/bookings/waitlist");

/**
 * Moves a waitlisted booking into the queue as a New Request, which holds a vehicle for it. With
 * `overbook`, it is moved even though no car is free, and holds none (FT-11).
 */
export const promoteBooking = (id: string, overbook = false) =>
  apiRequest<AdminBooking>(`/admin/bookings/${id}/promote`, { method: "POST", body: overbook ? { overbook } : {} });

/** Where a booking would stand at a new time (FT-10). */
export interface ReschedulePreview {
  pickupAt: string;
  /** When its car would be free again, buffer included. */
  holdUntil: string;
  bufferMinutes: number;
  /** A car of its type is free at the new time (always true when it holds no fleet car). */
  fits: boolean;
  /** Confirmed fleet trips: vehicles and drivers free at the new time, its own included. */
  vehicles: AssignmentOptions["vehicles"];
  drivers: AssignmentOptions["drivers"];
  current: { totalJpy: number; quoteRequired: boolean; finalTotalJpy: number | null };
  newPrice: { totalJpy: number; quoteRequired: boolean; lines: QuoteLine[] } | null;
  newPriceError: string | null;
}

export const getReschedulePreview = (id: string, pickupDate: string, pickupTime: string) =>
  apiRequest<ReschedulePreview>(
    `/admin/bookings/${id}/reschedule-preview?pickupDate=${pickupDate}&pickupTime=${encodeURIComponent(pickupTime)}`,
  );

export interface Reschedule {
  pickupDate: string;
  pickupTime: string;
  /** Confirmed fleet trips: omitted = keep the current vehicle / driver. */
  vehicleId?: string;
  driverId?: string;
  priceChoice: "keep" | "new";
  /** Confirmed quote-required bookings: a new quoted price. */
  finalTotalJpy?: number;
}

export const rescheduleBooking = (id: string, change: Reschedule) =>
  apiRequest<AdminBooking>(`/admin/bookings/${id}`, { method: "PATCH", body: change });

export const cancelBooking = (id: string) =>
  apiRequest<AdminBooking>(`/admin/bookings/${id}/cancel`, { method: "POST", body: {} });
