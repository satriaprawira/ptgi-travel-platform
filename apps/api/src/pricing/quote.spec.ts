import { describe, expect, it } from 'vitest';
import { calculateQuote, isInTimeWindow, tokyoInstant, windowText, type QuoteInput } from './quote.js';

// Seed data from the staff price sheets (database/migrations/*seed-pricing.sql).
const TIME_SURCHARGES = [
  { label: 'Night time pickup', startsAt: '22:00:00', endsAt: '23:00:00', amountJpy: 2000 },
  { label: 'Late night pickup', startsAt: '23:00:00', endsAt: '06:00:00', amountJpy: 4000 },
  { label: 'Early morning pickup', startsAt: '06:00:00', endsAt: '07:00:00', amountJpy: 2000 },
];
const LAST_MINUTE = [{ label: 'Booking on arrival / last-minute booking', withinHours: 24, amountJpy: 1000 }];

function input(overrides: Partial<QuoteInput> = {}): QuoteInput {
  return {
    fare: { airportName: 'Haneda Airport', regionName: 'Shibuya', priceJpy: 11000, minPriceJpy: null },
    vehicle: { label: 'Standard car', surchargeJpy: 0 },
    payment: { label: 'Credit card', feeJpy: 0 },
    pickupTime: '14:30',
    hoursUntilPickup: 72,
    timeSurcharges: TIME_SURCHARGES,
    leadTimeSurcharges: LAST_MINUTE,
    addOns: [],
    ...overrides,
  };
}

describe('calculateQuote', () => {
  it('prices a plain daytime Standard-car trip at the base fare', () => {
    const quote = calculateQuote(input());
    expect(quote).toEqual({
      currency: 'JPY',
      lines: [{ code: 'base-fare', label: 'Base fare · Haneda Airport ⇄ Shibuya', amountJpy: 11000 }],
      totalJpy: 11000,
      quoteRequired: false,
    });
  });

  it('adds every surcharge from the price sheet', () => {
    const quote = calculateQuote(
      input({
        vehicle: { label: 'Grand Cabin (outside 23 wards)', surchargeJpy: 5000 },
        payment: { label: 'Cash on arrival', feeJpy: 1000 },
        pickupTime: '23:30',
        hoursUntilPickup: 5,
        addOns: [
          { label: 'Baby seat', priceJpy: 1000, freeQuantity: 1, quantity: 3 },
          { label: 'Wheelchair', priceJpy: 2500, freeQuantity: 0, quantity: 1 },
        ],
      }),
    );
    expect(quote.lines.map((l) => [l.code, l.label, l.amountJpy])).toEqual([
      ['base-fare', 'Base fare · Haneda Airport ⇄ Shibuya', 11000],
      ['vehicle', 'Grand Cabin (outside 23 wards)', 5000],
      ['pickup-time', 'Late night pickup (23:00–05:59)', 4000],
      ['lead-time', 'Booking on arrival / last-minute booking', 1000],
      ['add-on', 'Baby seat × 3 (1 included)', 2000],
      ['add-on', 'Wheelchair', 2500],
      ['payment', 'Cash on arrival fee', 1000],
    ]);
    expect(quote.totalJpy).toBe(26500);
    expect(quote.quoteRequired).toBe(false);
  });

  it('includes the first baby seat for free', () => {
    const quote = calculateQuote(input({ addOns: [{ label: 'Baby seat', priceJpy: 1000, freeQuantity: 1, quantity: 1 }] }));
    expect(quote.lines[1]).toEqual({ code: 'add-on', label: 'Baby seat (included)', amountJpy: 0 });
    expect(quote.totalJpy).toBe(11000);
  });

  it('skips add-ons with quantity 0', () => {
    const quote = calculateQuote(input({ addOns: [{ label: 'Wheelchair', priceJpy: 2500, freeQuantity: 0, quantity: 0 }] }));
    expect(quote.lines).toHaveLength(1);
  });

  it('charges the last-minute fee strictly under 24 hours before pickup', () => {
    expect(calculateQuote(input({ hoursUntilPickup: 23.99 })).totalJpy).toBe(12000);
    expect(calculateQuote(input({ hoursUntilPickup: 24 })).totalJpy).toBe(11000);
  });

  it('applies the most specific lead-time rule when several match', () => {
    const rules = [...LAST_MINUTE, { label: 'Within 3 hours', withinHours: 3, amountJpy: 3000 }];
    const quote = calculateQuote(input({ hoursUntilPickup: 2, leadTimeSurcharges: rules }));
    expect(quote.lines.find((l) => l.code === 'lead-time')?.label).toBe('Within 3 hours');
  });

  it('marks "will be adjusted" fares as quote required, priced from the minimum', () => {
    const quote = calculateQuote(
      input({
        fare: { airportName: 'Narita Airport', regionName: 'Other area', priceJpy: null, minPriceJpy: 23000 },
        vehicle: { label: 'Medium car', surchargeJpy: 1000 },
      }),
    );
    expect(quote.lines[0]).toMatchObject({ amountJpy: null, minAmountJpy: 23000 });
    expect(quote.quoteRequired).toBe(true);
    expect(quote.totalJpy).toBe(24000);
  });

  it('marks "please inquire" vehicles (Bus) as quote required', () => {
    const quote = calculateQuote(input({ vehicle: { label: 'Bus (please inquire)', surchargeJpy: null } }));
    expect(quote.lines[1]).toEqual({ code: 'vehicle', label: 'Bus (please inquire)', amountJpy: null });
    expect(quote.quoteRequired).toBe(true);
    expect(quote.totalJpy).toBe(11000);
  });
});

describe('isInTimeWindow', () => {
  const cases: [string, string | null][] = [
    ['05:59', 'Late night'],
    ['06:00', 'Early morning'],
    ['06:59', 'Early morning'],
    ['07:00', null],
    ['21:59', null],
    ['22:00', 'Night time'],
    ['22:59', 'Night time'],
    ['23:00', 'Late night'],
    ['00:00', 'Late night'],
  ];
  it.each(cases)('%s → %s', (time, expected) => {
    const match = TIME_SURCHARGES.find((s) => isInTimeWindow(time, s.startsAt, s.endsAt));
    expect(match?.label.split(' pickup')[0] ?? null).toBe(expected);
  });
});

describe('windowText', () => {
  it.each([
    ['22:00', '23:00', '22:00–22:59'],
    ['23:00', '06:00', '23:00–05:59'],
    ['22:30:00', '00:00:00', '22:30–23:59'], // pg's HH:MM:SS; ending at midnight
    ['00:00', '00:30', '00:00–00:29'],
  ])('[%s, %s) → %s', (startsAt, endsAt, expected) => {
    expect(windowText(startsAt, endsAt)).toBe(expected);
  });

  it('follows the window when staff move it, so the label can never go stale', () => {
    const moved = [{ ...TIME_SURCHARGES[1], startsAt: '22:30', endsAt: '05:00' }];
    const quote = calculateQuote(input({ pickupTime: '22:45', timeSurcharges: moved }));
    expect(quote.lines[1].label).toBe('Late night pickup (22:30–04:59)');
  });
});

describe('tokyoInstant', () => {
  it('reads the date and time as Tokyo local time (UTC+9)', () => {
    expect(tokyoInstant('2026-10-01', '08:00')?.toISOString()).toBe('2026-09-30T23:00:00.000Z');
  });

  it.each([
    ['2026-02-30', '10:00'],
    ['2026-13-01', '10:00'],
    ['2026-10-01', '24:00'],
    ['2026-10-01', '9:00'],
    ['01-10-2026', '10:00'],
  ])('rejects %s %s', (date, time) => {
    expect(tokyoInstant(date, time)).toBeNull();
  });
});
