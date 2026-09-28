import type { PaymentMethod } from "./reservation";

/** 12000 → "¥12,000" */
export const yen = (amount: number) => `¥${amount.toLocaleString("en-US")}`;

/**
 * A pickup-time window as customers see it, last minute inclusive: [23:00, 06:00) → "23:00–05:59".
 * Same rule as windowText in apps/api/src/pricing/quote.ts.
 */
export function windowText(startsAt: string, endsAt: string): string {
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return `${hhmm(minutes(startsAt))}–${hhmm((minutes(endsAt) + 24 * 60 - 1) % (24 * 60))}`;
}

/** Vehicle card badge: "+¥3,000", "Please inquire", or nothing for no surcharge. */
export function surchargeBadge(surchargeJpy: number | null): string | null {
  if (surchargeJpy === null) return "Please inquire";
  return surchargeJpy > 0 ? `+${yen(surchargeJpy)}` : null;
}

/** "Credit card (Square)", "Cash on arrival (+¥1,000 fee)", "Bank transfer (MUFJ / Japan Post)". */
export function paymentLabel(method: PaymentMethod): string {
  let label = method.label;
  if (method.description) label += ` (${method.description})`;
  if (method.feeJpy > 0) label += ` (+${yen(method.feeJpy)} fee)`;
  return label;
}
