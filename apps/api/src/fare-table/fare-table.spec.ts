import { describe, expect, it } from 'vitest';
import { buildFareTable, groupFaresByPrice, groupVehicleCharges, labelVariant, type FareRow, type FareTableRows } from './fare-table.js';

const HND = 'airport-hnd';
const NRT = 'airport-nrt';

const fare = (airportId: string, regionCode: string, priceJpy: number | null, minPriceJpy: number | null = null): FareRow => ({
  airportId,
  regionCode,
  regionName: regionCode[0].toUpperCase() + regionCode.slice(1),
  priceJpy,
  minPriceJpy,
});

const type = (code: string, classCode: string, name: string, label: string, surchargeJpy: number | null) => ({
  id: `id-${code}`,
  code,
  classCode,
  name,
  note: null,
  label,
  surchargeJpy,
});

describe('groupFaresByPrice', () => {
  it('puts areas with the same price together, cheapest first, keeping the area order', () => {
    const groups = groupFaresByPrice([
      fare(HND, 'chuo', 10000),
      fare(HND, 'ota', 9000),
      fare(HND, 'meguro', 10000),
      fare(HND, 'shinagawa', 9000),
    ]);
    expect(groups).toEqual([
      { priceJpy: 9000, minPriceJpy: null, regions: [{ code: 'ota', name: 'Ota' }, { code: 'shinagawa', name: 'Shinagawa' }] },
      { priceJpy: 10000, minPriceJpy: null, regions: [{ code: 'chuo', name: 'Chuo' }, { code: 'meguro', name: 'Meguro' }] },
    ]);
  });

  it('lists quote-only areas ("from ¥N") after the fixed prices', () => {
    const groups = groupFaresByPrice([fare(HND, 'other', null, 13000), fare(HND, 'yokohama', 12000)]);
    expect(groups.map((g) => [g.priceJpy, g.minPriceJpy])).toEqual([
      [12000, null],
      [null, 13000],
    ]);
  });

  it('keeps a quote-only area apart from a fixed price of the same amount', () => {
    const groups = groupFaresByPrice([fare(HND, 'a', 13000), fare(HND, 'b', null, 13000)]);
    expect(groups).toHaveLength(2);
  });
});

describe('labelVariant', () => {
  it('reads the part in brackets at the end of a label', () => {
    expect(labelVariant('Alphard 4.0 (Haneda)')).toBe('Haneda');
    expect(labelVariant('Grand Cabin (within 23 wards)')).toBe('within 23 wards');
    expect(labelVariant('Standard car')).toBeNull();
  });
});

describe('groupVehicleCharges', () => {
  it('groups the Haneda and Narita options of a class, in the given order', () => {
    const charges = groupVehicleCharges([
      type('standard', 'standard', 'Standard car', 'Standard car', 0),
      type('alphard-4-haneda', 'alphard-4', 'Alphard 4.0', 'Alphard 4.0 (Haneda)', 3000),
      type('alphard-4-narita', 'alphard-4', 'Alphard 4.0', 'Alphard 4.0 (Narita)', 5000),
      type('bus', 'bus', 'Bus', 'Bus (please inquire)', null),
    ]);
    expect(charges).toEqual([
      { classCode: 'standard', name: 'Standard car', options: [{ code: 'standard', variant: null, surchargeJpy: 0 }] },
      {
        classCode: 'alphard-4',
        name: 'Alphard 4.0',
        options: [
          { code: 'alphard-4-haneda', variant: 'Haneda', surchargeJpy: 3000 },
          { code: 'alphard-4-narita', variant: 'Narita', surchargeJpy: 5000 },
        ],
      },
      { classCode: 'bus', name: 'Bus', options: [{ code: 'bus', variant: 'please inquire', surchargeJpy: null }] },
    ]);
  });
});

describe('buildFareTable', () => {
  const rows: FareTableRows = {
    airports: [
      { id: HND, code: 'HND', name: 'Haneda Airport' },
      { id: NRT, code: 'NRT', name: 'Narita Airport' },
      { id: 'airport-kix', code: 'KIX', name: 'Kansai Airport' },
    ],
    fares: [fare(HND, 'ota', 9000), fare(NRT, 'ota', 23000), fare(HND, 'other', null, 13000)],
    vehicleTypes: [type('standard', 'standard', 'Standard car', 'Standard car', 0)],
    vehicleClasses: [{ code: 'standard', name: 'Standard car', maxPassengers: 6, maxSuitcases: 4 }],
    timeSurcharges: [{ label: 'Late night pickup', startsAt: '23:00:00', endsAt: '06:00:00', amountJpy: 4000 }],
    leadTimeSurcharges: [{ label: 'Last-minute booking', withinHours: 24, amountJpy: 1000 }],
    addOns: [{ id: 'a1', code: 'baby-seat', label: 'Baby seat', priceJpy: 1000, freeQuantity: 1, maxQuantity: 3 }],
    paymentMethods: [{ id: 'p1', code: 'cash', kind: 'cash', label: 'Cash on arrival', description: null, feeJpy: 1000 }],
  };

  it('gives each airport its fare groups and leaves out airports without fares', () => {
    const table = buildFareTable(rows);
    expect(table.airports.map((a) => a.code)).toEqual(['HND', 'NRT']);
    expect(table.airports[0].fareGroups).toEqual([
      { priceJpy: 9000, minPriceJpy: null, regions: [{ code: 'ota', name: 'Ota' }] },
      { priceJpy: null, minPriceJpy: 13000, regions: [{ code: 'other', name: 'Other' }] },
    ]);
    expect(table.airports[1].fareGroups).toEqual([{ priceJpy: 23000, minPriceJpy: null, regions: [{ code: 'ota', name: 'Ota' }] }]);
  });

  it('passes the surcharges, extras, payment methods and capacities through unchanged', () => {
    const table = buildFareTable(rows);
    expect(Object.keys(table).sort()).toEqual(
      ['addOns', 'airports', 'leadTimeSurcharges', 'paymentMethods', 'timeSurcharges', 'vehicleCharges', 'vehicleClasses'].sort(),
    );
    expect(table.vehicleClasses).toBe(rows.vehicleClasses);
    expect(table.timeSurcharges).toBe(rows.timeSurcharges);
    expect(table.addOns).toBe(rows.addOns);
    expect(table.paymentMethods).toBe(rows.paymentMethods);
    expect(table.vehicleCharges).toEqual([
      { classCode: 'standard', name: 'Standard car', options: [{ code: 'standard', variant: null, surchargeJpy: 0 }] },
    ]);
  });
});
