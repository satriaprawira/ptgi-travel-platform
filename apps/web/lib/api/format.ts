import type { PaymentMethod } from "./reservation";

/** 12000 → "¥12,000" */
export const yen = (amount: number) => `¥${amount.toLocaleString("en-US")}`;

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
