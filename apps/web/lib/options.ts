export interface CarOption {
  id: string;
  value: string;
  name: string;
  note: string;
  surcharge?: string;
}

export const carOptions: CarOption[] = [
  { id: "carStd", value: "Standard car", name: "Standard car", note: "Nissan Serena / Honda Stepwagon" },
  { id: "carMed", value: "Medium car", name: "Medium car", note: "Alphard / Vellfire", surcharge: "+¥1,000" },
  {
    id: "carAlpH",
    value: "New Alphard 4.0 (Haneda)",
    name: "New Alphard 4.0",
    note: "Haneda pick-up",
    surcharge: "+¥3,000",
  },
  {
    id: "carAlpN",
    value: "New Alphard 4.0 (Narita)",
    name: "New Alphard 4.0",
    note: "Narita pick-up",
    surcharge: "+¥5,000",
  },
  {
    id: "carGC23",
    value: "Grand Cabin (within 23 wards)",
    name: "Grand Cabin",
    note: "Within 23 wards",
    surcharge: "+¥3,000",
  },
  {
    id: "carGCOut",
    value: "Grand Cabin (outside 23 wards)",
    name: "Grand Cabin",
    note: "Outside 23 wards",
    surcharge: "+¥5,000",
  },
  { id: "carBus", value: "Bus (please inquire)", name: "Bus", note: "Group travel — please inquire" },
];

export interface PaymentOption {
  id: string;
  value: string;
  label: string;
  surcharge?: string;
}

export const paymentOptions: PaymentOption[] = [
  { id: "payCard", value: "Credit card (Square)", label: "Credit card (Square)" },
  { id: "payPaypal", value: "PayPal", label: "PayPal" },
  { id: "payCash", value: "Cash on arrival", label: "Cash on arrival (+¥1,000 fee)", surcharge: "+¥1,000 fee" },
  { id: "payBank", value: "Bank transfer", label: "Bank transfer (MUFJ / Japan Post)" },
];

export const countryCodes = ["+62", "+1", "+61", "+44", "+49", "+33", "+81"];

export const countrySuggestions = [
  "Indonesia",
  "United States",
  "Australia",
  "United Kingdom",
  "Germany",
  "France",
  "Other",
];
