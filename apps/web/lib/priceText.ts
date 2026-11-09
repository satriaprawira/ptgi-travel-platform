import type { FareTable, VehicleCharge } from "./api/fareTable";
import { windowText, yen } from "./api/format";
import type { AddOn } from "./api/reservation";

// Price wording on the customer pages, built from GET /v1/fare-table.

/** "Included" for no extra cost, "+¥1,000", or "Please inquire" when staff quote it. */
function surchargeText(amount: number | null): string {
  if (amount === null) return "Please inquire";
  return amount === 0 ? "Included" : `+${yen(amount)}`;
}

/**
 * A car class's extra cost as one line, or one line per option when they differ:
 * ["+¥1,000"], ["Haneda +¥3,000", "Narita +¥5,000"], ["Please inquire"].
 */
export function chargeLines(charge: VehicleCharge): string[] {
  const amounts = new Set(charge.options.map((option) => option.surchargeJpy));
  if (amounts.size === 1) return [surchargeText(charge.options[0].surchargeJpy)];
  return charge.options.map((option) => {
    const variant = option.variant ? option.variant[0].toUpperCase() + option.variant.slice(1) : "";
    return `${variant} ${surchargeText(option.surchargeJpy)}`.trim();
  });
}

/** Services page: "First one free, then +¥1,000 each" or "+¥2,000". */
export function addOnText(addOn: AddOn): string {
  if (addOn.freeQuantity <= 0) return `+${yen(addOn.priceJpy)}`;
  const free = addOn.freeQuantity === 1 ? "one" : String(addOn.freeQuantity);
  return `First ${free} free, then +${yen(addOn.priceJpy)} each`;
}

/** Fare page: "1st free · +¥1,000" or "+¥2,000". */
export function addOnShortText(addOn: AddOn): string {
  return addOn.freeQuantity > 0 ? `1st free · +${yen(addOn.priceJpy)}` : `+${yen(addOn.priceJpy)}`;
}

/** The cheapest fixed fare from each airport: "From ¥9,000 (Haneda) · ¥23,000 (Narita)". */
export function fromPricesText(table: FareTable): string | null {
  const parts = table.airports.flatMap((airport) => {
    const prices = airport.fareGroups.flatMap((group) => (group.priceJpy === null ? [] : [group.priceJpy]));
    return prices.length ? [`${yen(Math.min(...prices))} (${airport.name.replace(/\s*Airport$/i, "")})`] : [];
  });
  return parts.length ? `From ${parts.join(" · ")}` : null;
}

const minutesOfDay = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

/** [startsAt, endsAt), wrapping midnight when endsAt is earlier. Same rule as isInTimeWindow in apps/api. */
export function isInTimeWindow(time: string, startsAt: string, endsAt: string): boolean {
  const t = minutesOfDay(time);
  const start = minutesOfDay(startsAt);
  const end = minutesOfDay(endsAt);
  return start < end ? t >= start && t < end : t >= start || t < end;
}

export interface ExampleLine {
  label: string;
  amountJpy: number;
}

/**
 * The Fare page's worked example, priced from the live list: base fare + car + time of pickup + payment
 * fee. null when a part is missing or quoted by staff (the example is then left out).
 */
export function priceExample(
  table: FareTable,
  example: { airportCode: string; regionCode: string; vehicleTypeCode: string; pickupTime: string; paymentKind: string },
): { lines: ExampleLine[]; totalJpy: number } | null {
  const airport = table.airports.find((a) => a.code === example.airportCode);
  const group = airport?.fareGroups.find((g) => g.regions.some((r) => r.code === example.regionCode));
  const region = group?.regions.find((r) => r.code === example.regionCode);
  const car = table.vehicleCharges.flatMap((charge) =>
    charge.options.map((option) => ({ ...option, label: option.variant ? `${charge.name} (${option.variant})` : charge.name })),
  ).find((option) => option.code === example.vehicleTypeCode);
  const payment = table.paymentMethods.find((p) => p.kind === example.paymentKind);
  if (!airport || !group || group.priceJpy === null || !region || !car || car.surchargeJpy === null || !payment) return null;

  const lines: ExampleLine[] = [
    { label: `Base fare, ${airport.name.replace(/\s*Airport$/i, "")} → ${region.name}`, amountJpy: group.priceJpy },
  ];
  if (car.surchargeJpy > 0) lines.push({ label: car.label, amountJpy: car.surchargeJpy });
  for (const surcharge of table.timeSurcharges) {
    if (isInTimeWindow(example.pickupTime, surcharge.startsAt, surcharge.endsAt)) {
      lines.push({ label: `${surcharge.label} (${windowText(surcharge.startsAt, surcharge.endsAt)})`, amountJpy: surcharge.amountJpy });
    }
  }
  if (payment.feeJpy > 0) lines.push({ label: payment.label, amountJpy: payment.feeJpy });
  return { lines, totalJpy: lines.reduce((sum, line) => sum + line.amountJpy, 0) };
}
