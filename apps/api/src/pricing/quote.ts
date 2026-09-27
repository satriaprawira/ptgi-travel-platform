/**
 * Trip price calculation (design doc section 5.4). Pure: no database, no clock, no framework,
 * so every rule here is unit-tested in quote.spec.ts. PricingService loads the rows and calls it.
 *
 * price = base fare + vehicle surcharge + pickup-time surcharge + last-minute fee + add-ons + payment fee
 * A NULL amount ("will be adjusted" / "please inquire") makes the whole quote "quote required".
 */

export interface QuoteLine {
  code: 'base-fare' | 'vehicle' | 'pickup-time' | 'lead-time' | 'add-on' | 'payment';
  label: string;
  /** null = staff will quote this part. */
  amountJpy: number | null;
  /** Lower bound shown as "from ¥N" when amountJpy is null and one is known. */
  minAmountJpy?: number;
}

export interface Quote {
  currency: 'JPY';
  lines: QuoteLine[];
  /** The price, or when quoteRequired, the lowest it can be ("from ¥N"). */
  totalJpy: number;
  quoteRequired: boolean;
}

export interface QuoteInput {
  fare: { airportName: string; regionName: string; priceJpy: number | null; minPriceJpy: number | null };
  vehicle: { label: string; surchargeJpy: number | null };
  payment: { label: string; feeJpy: number };
  /** "HH:MM" or "HH:MM:SS", Tokyo local time. */
  pickupTime: string;
  hoursUntilPickup: number;
  timeSurcharges: { label: string; startsAt: string; endsAt: string; amountJpy: number }[];
  leadTimeSurcharges: { label: string; withinHours: number; amountJpy: number }[];
  addOns: { label: string; priceJpy: number; freeQuantity: number; quantity: number }[];
}

/** Minutes since midnight for "HH:MM" or "HH:MM:SS". */
export function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Window is [startsAt, endsAt). endsAt earlier than startsAt means it wraps midnight (23:00–06:00). */
export function isInTimeWindow(time: string, startsAt: string, endsAt: string): boolean {
  const t = minutesOfDay(time);
  const start = minutesOfDay(startsAt);
  const end = minutesOfDay(endsAt);
  return start < end ? t >= start && t < end : t >= start || t < end;
}

export function calculateQuote(input: QuoteInput): Quote {
  const lines: QuoteLine[] = [];

  const { fare } = input;
  lines.push({
    code: 'base-fare',
    label: `Base fare · ${fare.airportName} ⇄ ${fare.regionName}`,
    amountJpy: fare.priceJpy,
    ...(fare.priceJpy === null && fare.minPriceJpy !== null ? { minAmountJpy: fare.minPriceJpy } : {}),
  });

  if (input.vehicle.surchargeJpy !== 0) {
    lines.push({ code: 'vehicle', label: input.vehicle.label, amountJpy: input.vehicle.surchargeJpy });
  }

  // Windows don't overlap (checked when they're edited), so at most one matches.
  const timeSurcharge = input.timeSurcharges.find((s) => isInTimeWindow(input.pickupTime, s.startsAt, s.endsAt));
  if (timeSurcharge) {
    lines.push({ code: 'pickup-time', label: timeSurcharge.label, amountJpy: timeSurcharge.amountJpy });
  }

  // If several rules match (e.g. "within 24 h" and a stricter "within 3 h"), the most specific one wins.
  const leadTime = input.leadTimeSurcharges
    .filter((s) => input.hoursUntilPickup < s.withinHours)
    .sort((a, b) => a.withinHours - b.withinHours)[0];
  if (leadTime) {
    lines.push({ code: 'lead-time', label: leadTime.label, amountJpy: leadTime.amountJpy });
  }

  for (const addOn of input.addOns) {
    if (addOn.quantity <= 0) continue;
    const charged = Math.max(addOn.quantity - addOn.freeQuantity, 0);
    const free = addOn.quantity - charged;
    const detail =
      addOn.quantity === 1
        ? free === 1
          ? ' (included)'
          : ''
        : ` × ${addOn.quantity}${free > 0 ? ` (${free} included)` : ''}`;
    lines.push({ code: 'add-on', label: `${addOn.label}${detail}`, amountJpy: charged * addOn.priceJpy });
  }

  if (input.payment.feeJpy > 0) {
    lines.push({ code: 'payment', label: `${input.payment.label} fee`, amountJpy: input.payment.feeJpy });
  }

  const quoteRequired = lines.some((line) => line.amountJpy === null);
  const totalJpy = lines.reduce((sum, line) => sum + (line.amountJpy ?? line.minAmountJpy ?? 0), 0);

  return { currency: 'JPY', lines, totalJpy, quoteRequired };
}

const TOKYO_OFFSET = '+09:00'; // Japan has no daylight saving time.

/**
 * The instant of a Tokyo-local pickup date ("YYYY-MM-DD") and time ("HH:MM"), or null if either is
 * not a real calendar date / clock time (e.g. 2026-02-30 or 24:10).
 */
export function tokyoInstant(date: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const instant = new Date(`${date}T${time}:00${TOKYO_OFFSET}`);
  if (Number.isNaN(instant.getTime())) return null;
  // Reject dates JavaScript silently rolls over: 2026-02-30 would become 2026-03-02.
  const tokyoDate = new Date(instant.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
  return tokyoDate === date ? instant : null;
}
