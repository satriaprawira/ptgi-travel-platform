import { apiRequest } from "./client";
import type { QuoteLine, QuoteRequest } from "./reservation";

// Mirrors apps/api/src/bookings: POST /v1/bookings (public) and /v1/admin/bookings (staff).

export type BookingStatus = "new" | "confirmed" | "cancelled";
export type TripDirection = "from_airport" | "to_airport";

/** What the reservation form submits: the priced trip plus who is travelling. */
export interface BookingRequest extends QuoteRequest {
  direction: TripDirection;
  address: string;
  flightCode: string | null;
  salutation: string;
  passengerName: string;
  bookerName: string | null;
  countryOrigin: string;
  passengers: string;
  luggage: string;
  ageAdults: boolean;
  ageInfants: boolean;
  ageChildren: boolean;
  email: string;
  phoneCountryCode: string;
  phone: string;
  timesUsed: string | null;
  additionalRequests: string | null;
  petInfo: string | null;
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
  address: string;
  /** Tokyo local date ("2026-10-16") and time ("14:30") of the pickup. */
  pickupDate: string;
  pickupTime: string;
  flightCode: string | null;
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
  salutation: string;
  passengerName: string;
  bookerName: string | null;
  countryOrigin: string;
  passengers: string;
  luggage: string;
  ageAdults: boolean;
  ageInfants: boolean;
  ageChildren: boolean;
  email: string;
  phoneCountryCode: string;
  phone: string;
  timesUsed: string | null;
  additionalRequests: string | null;
  petInfo: string | null;
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

export interface Confirmation {
  vehicleId: string;
  driverId: string;
  /** Required for quote-required bookings, not accepted for fixed-price ones. */
  finalTotalJpy?: number;
}

export const confirmBooking = (id: string, confirmation: Confirmation) =>
  apiRequest<AdminBooking>(`/admin/bookings/${id}/confirm`, { method: "POST", body: confirmation });

export const cancelBooking = (id: string) =>
  apiRequest<AdminBooking>(`/admin/bookings/${id}/cancel`, { method: "POST", body: {} });
