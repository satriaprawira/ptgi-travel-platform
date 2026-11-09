import type { PaymentMethod } from '../payment-methods/payment-methods.repository.js';
import type { AddOn, Airport, LeadTimeSurcharge, TimeSurcharge } from '../pricing/pricing.repository.js';
import type { VehicleType } from '../vehicle-types/vehicle-types.repository.js';

// GET /v1/fare-table: the public price list for the Fare and Policy page, the Services page and the
// About page's fleet cards. Built from the same tables as the reservation form, so it changes when staff
// edit prices in admin. Pure functions here; the controller only loads the rows.

/** One active fare, in the order of its service region. */
export interface FareRow {
  airportId: string;
  regionCode: string;
  regionName: string;
  /** null = staff quote it ("from" minPriceJpy). */
  priceJpy: number | null;
  minPriceJpy: number | null;
}

/** Areas that cost the same from one airport. */
export interface FareGroup {
  priceJpy: number | null;
  minPriceJpy: number | null;
  regions: { code: string; name: string }[];
}

export interface FareTableAirport extends Airport {
  fareGroups: FareGroup[];
}

/** A fleet class with at least one Available car, and the most seats and suitcases among those cars. */
export interface VehicleClassCapacity {
  code: string;
  name: string;
  maxPassengers: number;
  maxSuitcases: number;
}

/** The extra cost of one car class, with one option per airport or area where it differs. */
export interface VehicleCharge {
  classCode: string;
  name: string;
  options: { code: string; variant: string | null; surchargeJpy: number | null }[];
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

export interface FareTableRows {
  airports: Airport[];
  fares: FareRow[];
  /** Offered vehicle types (the reservation form's list), with the fleet class each belongs to. */
  vehicleTypes: (VehicleType & { classCode: string })[];
  vehicleClasses: VehicleClassCapacity[];
  timeSurcharges: TimeSurcharge[];
  leadTimeSurcharges: LeadTimeSurcharge[];
  addOns: AddOn[];
  paymentMethods: PaymentMethod[];
}

/**
 * Groups one airport's fares by price: fixed prices cheapest first, then the quote-only areas
 * ("from ¥N"), cheapest first. Areas keep their order inside a group.
 */
export function groupFaresByPrice(fares: FareRow[]): FareGroup[] {
  const groups = new Map<string, FareGroup>();
  for (const fare of fares) {
    const key = fare.priceJpy !== null ? `fixed:${fare.priceJpy}` : `from:${fare.minPriceJpy}`;
    let group = groups.get(key);
    if (!group) {
      group = { priceJpy: fare.priceJpy, minPriceJpy: fare.priceJpy !== null ? null : fare.minPriceJpy, regions: [] };
      groups.set(key, group);
    }
    group.regions.push({ code: fare.regionCode, name: fare.regionName });
  }
  const rank = (group: FareGroup) =>
    group.priceJpy !== null ? [0, group.priceJpy] : [1, group.minPriceJpy ?? Number.MAX_SAFE_INTEGER];
  return [...groups.values()].sort((a, b) => {
    const [ka, pa] = rank(a);
    const [kb, pb] = rank(b);
    return ka - kb || pa - pb;
  });
}

/** "Alphard 4.0 (Haneda)" → "Haneda"; "Standard car" → null. */
export function labelVariant(label: string): string | null {
  const match = /\(([^()]+)\)\s*$/.exec(label);
  return match ? match[1].trim() : null;
}

/** Vehicle types grouped by fleet class, in the order given (the form's order). */
export function groupVehicleCharges(types: FareTableRows['vehicleTypes']): VehicleCharge[] {
  const charges = new Map<string, VehicleCharge>();
  for (const type of types) {
    let charge = charges.get(type.classCode);
    if (!charge) {
      charge = { classCode: type.classCode, name: type.name, options: [] };
      charges.set(type.classCode, charge);
    }
    charge.options.push({ code: type.code, variant: labelVariant(type.label), surchargeJpy: type.surchargeJpy });
  }
  return [...charges.values()];
}

export function buildFareTable(rows: FareTableRows): FareTable {
  return {
    // Airports without an active fare are left out.
    airports: rows.airports
      .map((airport) => ({ ...airport, fareGroups: groupFaresByPrice(rows.fares.filter((f) => f.airportId === airport.id)) }))
      .filter((airport) => airport.fareGroups.length > 0),
    vehicleClasses: rows.vehicleClasses,
    vehicleCharges: groupVehicleCharges(rows.vehicleTypes),
    timeSurcharges: rows.timeSurcharges,
    leadTimeSurcharges: rows.leadTimeSurcharges,
    addOns: rows.addOns,
    paymentMethods: rows.paymentMethods,
  };
}
