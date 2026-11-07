// Customer-facing texts supplied by Goal International (Phase 1 feedback FT-1, FT-2, FT-5, FT-8).
// Wording changes happen here only; the reservation form, its pop-ups and the T&C box all read from it.

export interface PolicySection {
  title: string;
  paragraphs: string[];
}

export interface Policy {
  title: string;
  intro: string;
  sections: PolicySection[];
  outro?: string;
}

// ---------- FT-1: luggage ----------

export const LUGGAGE_SIZES = [
  { key: "large", code: "L", label: "Large", size: "24 inches and above" },
  { key: "medium", code: "M", label: "Medium", size: "21–23 inches" },
  { key: "small", code: "S", label: "Small", size: "18–20 inches" },
] as const;

export type LuggageSize = (typeof LUGGAGE_SIZES)[number]["key"];

/** Examples of items that need the "Oversized luggage" field. */
export const OVERSIZED_EXAMPLES = "Golf bags, surfboards, snowboards, pet carriers or kennels, boxes";

export const LUGGAGE_GUIDE: Policy = {
  title: "Luggage Size Guide",
  intro:
    "To ensure a comfortable and hassle-free journey, please check your luggage size and the luggage capacity of your selected vehicle before making a reservation.",
  sections: [
    {
      title: "Luggage size classification",
      paragraphs: [
        "We classify suitcases according to the following sizes:",
        ...LUGGAGE_SIZES.map((s) => `${s.label} (${s.code}): ${s.size}`).reverse(),
        "Please note that suitcase dimensions and shapes may vary between brands, even when they have the same listed size.",
      ],
    },
    {
      title: "Oversized and bulky items",
      paragraphs: [
        "Golf bags, surfboards, snowboards, pet carriers or kennels, and other bulky items may require a larger vehicle, such as a Toyota HiAce Grand Cabin, or an additional vehicle.",
        "Please inform us of these items when making your reservation. We will check the vehicle's suitability and availability in advance.",
      ],
    },
  ],
};

// ---------- FT-2: pets ----------

export const PET_SUMMARY =
  "Pets must travel inside their own carrier or kennel. Large pets may need a larger vehicle, and extra charges may apply.";

export const PET_POLICY: Policy = {
  title: "Pet Transportation Policy",
  intro:
    "We welcome passengers traveling with pets, subject to the following requirements to ensure a safe, comfortable, and hassle-free journey for everyone.",
  sections: [
    {
      title: "Airport pickup time for pets",
      paragraphs: [
        "Passengers arriving with pets should allow additional time for airport procedures, including animal quarantine and customs clearance, where applicable.",
        "We recommend scheduling the pickup approximately 2.5–3 hours after the flight's arrival time to allow sufficient time for these procedures.",
        "Please inform us in advance if you will be traveling with a pet so we can arrange the pickup accordingly.",
      ],
    },
    {
      title: "Mandatory pet carrier or kennel",
      paragraphs: [
        "Passengers must provide their own suitable pet carrier or kennel.",
        "For the entire duration of the transfer, pets must remain securely inside their carrier or kennel while in the vehicle. This requirement helps prevent pet hair from spreading throughout the vehicle and reduces the risk of pets moving uncontrollably, potentially causing injury to the driver or passengers or damage to the vehicle.",
        "The carrier or kennel must be appropriately sized, secure, and suitable for the pet's size and needs.",
      ],
    },
    {
      title: "Large pets and vehicle requirements",
      paragraphs: [
        "For large-sized pets, a larger vehicle, such as a Toyota HiAce Grand Cabin, may be required to accommodate the pet's carrier or kennel safely, together with the passengers and their luggage.",
        "Vehicle suitability depends on the pet's actual size, the dimensions of its carrier or kennel, the number of passengers, and the amount of luggage.",
        "Please provide your pet's breed, approximate weight, carrier or kennel dimensions, and total passenger and luggage details when making your reservation. We will check vehicle suitability and availability in advance.",
      ],
    },
    {
      title: "Advance notification and confirmation",
      paragraphs: [
        "Passengers must inform us when booking if they intend to travel with a pet. Pet transportation is subject to advance confirmation and vehicle availability.",
        "If the selected vehicle cannot safely accommodate the pet, carrier or kennel, passengers, and luggage, a larger vehicle or an additional vehicle may be required. Additional charges may apply.",
      ],
    },
  ],
  outro:
    "Thank you for your understanding and cooperation in helping us provide a safe and comfortable journey for all passengers.",
};

// ---------- Pickup time hints (from T&C point 4 and the pet policy) ----------

export const PICKUP_TIME_HINT = "Choose a time 1–1.5 hours after your flight lands.";
export const PET_PICKUP_TIME_HINT =
  "Travelling with a pet? We recommend 2.5–3 hours after landing, for quarantine and customs.";

// ---------- FT-5: Terms & Conditions ----------

/**
 * Stored with each booking, so it's clear which wording a customer agreed to.
 * Change it to the new date whenever TERMS changes.
 */
export const TERMS_VERSION = "2026-11-06";

export const TERMS: { title: string; text: string }[] = [
  {
    title: "Reservation",
    text: "Submitting a request does not guarantee confirmation. We will contact you if further information or clarification is required. Your booking is confirmed only after our confirmation.",
  },
  {
    title: "Payment",
    text: "Reservations made more than 3 days before pickup must be paid within 3 days of confirmation. Reservations made 3 days or less before pickup must be paid on the invoice issue date. Unpaid reservations may be cancelled.",
  },
  {
    title: "Cancellation Policy",
    text: "3 days or more before pickup: free cancellation. 2 days before pickup: 50% of the total quoted price. 1 day before or on the pickup day: 100% of the total quoted price.",
  },
  {
    title: "Airport Pickup",
    text: "Standard pickup is scheduled 1–1.5 hours after flight arrival, unless otherwise agreed. Please allow extra time for immigration, baggage collection, and customs if necessary.",
  },
  {
    title: "Flight Delays",
    text: "We monitor flight status online, but updates may not be real-time. Please inform us promptly of any official flight delay or schedule change.",
  },
  {
    title: "Late Arrival",
    text: "Delays exceeding 30 minutes beyond the agreed pickup time without prior notice will incur an additional charge of ¥3,000 per 30 minutes.",
  },
];

// ---------- FT-6: price ----------

export const ESTIMATE_NOTE =
  "This is an estimate. The final amount may include additional charges, such as late arrival without notice (¥3,000 per 30 minutes).";

// ---------- FT-8: WhatsApp ----------

/** Goal International's official WhatsApp, in international format without "+" (wa.me links need it that way). */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "817032580333";
const WHATSAPP_GREETING = "Hello Goal International, I'd like to ask about a reservation.";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_GREETING)}`;
