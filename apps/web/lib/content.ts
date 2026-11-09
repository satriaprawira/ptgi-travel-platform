// Customer-facing texts supplied by Goal International (Phase 1 feedback FT-1, FT-2, FT-5, FT-8).
// Wording changes happen here only; the reservation form, its pop-ups, the T&C box and the site header and
// footer all read from it.

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

// ---------- Site header and footer (docs/header.png, docs/footer.png) ----------

export const COMPANY_NAME = "Goal International Co., Ltd";

/** The yellow menu bar, in order. Contact has no page: it scrolls to the footer of the current page. */
export const SITE_NAV = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "How to Book", href: "/how-to-book" },
  { label: "Fare and Policy", href: "/fare-and-policy" },
  { label: "Quotation", href: "/reservation-form" },
  { label: "Contact", href: "#contact" },
] as const;

export interface Office {
  name: string;
  company?: string;
  address: string;
  /** Part of the address shown in bold, as in the design. */
  emphasis?: string;
}

/** Office addresses exactly as written in the footer design. */
export const OFFICES = {
  head: { name: "Head Office", address: "Kugahara 3-13-4 Ota City Tokyo" },
  osaka: {
    name: "Osaka Branch",
    address: "〒592-0002 Osaka, Takaishi, Hagoromo, 1-chōme−11−9 グリーンガーデン羽衣",
    emphasis: "Osaka, Takaishi, Hagoromo",
  },
  narita: { name: "Narita Branch", address: "Chiba, Narita City, Kawakami 245-249" },
  indonesia: {
    name: "Indonesia Branch",
    company: "PT. JALAN-JALAN TOURS AND TRAVEL",
    address:
      "Gedung gajah Jl. Dr. Saharjo No.111 Blk an, RT.1/RW.1, Tebet Bar., Kec. Tebet, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12810",
  },
} satisfies Record<string, Office>;

export const CONTACT = {
  /** The WhatsApp number as shown; the link itself opens WHATSAPP_URL. */
  chat: "+81 70 3258 0333",
  fax: "+81 03 6410 4156",
  emails: ["info@pickupairport.online", "info@jalanjalantravel.co"],
};

export const SUPPORT_NOTE = "We are available 24/7 via our website chat and email.";
/** Footer line linking to the WhatsApp chat (the design's "Live Chat"). */
export const LIVE_CHAT_NOTE = "For a quick response, please use the Live Chat";

export const SOCIAL_LINKS = [
  { name: "Instagram", href: "https://www.instagram.com/gi_japantaxi" },
  { name: "Facebook", href: "https://www.facebook.com/goal.int.coltd" },
  { name: "Threads", href: "https://www.threads.com/@gi_japantaxi" },
  { name: "WhatsApp", href: WHATSAPP_URL },
] as const;

export const COPYRIGHT = "© 2023 by Goal International";

// ---------- Customer pages (docs/site-content: wording.md, team.csv, testimonials.csv, photos) ----------
// Approved by the client on 2026-11-08. Prices are not here: they come from the API (GET /v1/fare-table).
// A section whose list is empty (CUSTOMERS, TESTIMONIALS, TEAM) or null (ANNOUNCEMENT) isn't shown.

/** The live address, for canonical links, the sitemap and social previews. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.pickupairport.online").replace(/\/+$/, "");

export const ESTABLISHED = { iso: "2001-03-13", text: "13 March 2001" };
export const CAPITAL = "¥30,000,000";
export const PARTNER = {
  name: "Jalan-Jalan Travel Co., Ltd",
  url: "https://www.jalanjalantravel.online/",
  site: "www.jalanjalantravel.online",
};
export const GOOGLE_REVIEWS_URL = "https://maps.app.goo.gl/gcMnXkmL9KjpEkEh8";

/** Full years since ESTABLISHED, in Japan time ("25 years of excellent services"). */
export function yearsInBusiness(now = new Date()): number {
  const tokyo = new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
  const [y, m, d] = tokyo.split("-").map(Number);
  const [ey, em, ed] = ESTABLISHED.iso.split("-").map(Number);
  return y - ey - (m < em || (m === em && d < ed) ? 1 : 0);
}

export interface Photo {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** CSS object-position, to keep the subject in a cropped frame. */
  position?: string;
}

export interface Link {
  label: string;
  href: string;
  external?: boolean;
}

export const QUOTATION_HREF = "/reservation-form";

/** The "Ready to book?" band above the footer on each page (not on the reservation form itself). */
export const CTA_BAND = {
  heading: "Ready to book your",
  highlight: "pickup",
  text: "Get your price in a few minutes. No payment until we confirm.",
};

// Home

export const HOME = {
  eyebrow: "Airport transfers · Haneda & Narita",
  title: "GOAL INTERNATIONAL",
  titleSub: "AIRPORT PICK-UP/TRANSFER",
  /** Followed by the partner's name and website. */
  intro:
    "Low-Cost Hire Taxi Service. Need a private car? Airport Transfers, Business Trips, and Private Tours — in collaboration with",
  est: "Est. 2001",
  points: ["No payment until we confirm", "Free cancellation up to 3 days before"],
  photo: {
    src: "/site/photos/hero.jpg",
    width: 328,
    height: 415,
    alt: "Black Toyota Alphard at night on a Tokyo shopping street",
  } satisfies Photo,
};

export function homeStats(years: number) {
  return [
    { value: "24/7", label: "Support by chat and email" },
    { value: "2", label: "Airports: Haneda and Narita" },
    { value: "23", label: "Tokyo wards, plus Kawasaki and Yokohama" },
    { value: String(years), label: "Years of excellent services" },
  ];
}

export const HOME_SERVICES = {
  eyebrow: "Services",
  heading: "Getting to and from the airport, sorted",
  lead: "Airport transfers are what we do best. When you need a car for something else, we can help with that too.",
  cards: [
    {
      icon: "car",
      title: "Private/Hire Taxi",
      text: "We offer private drivers and vehicles for your comfort and convenience.",
      href: "/services",
    },
    {
      icon: "plane-landing",
      title: "Pick up/Transfer",
      text: "We provide 24-hour transfer and pick-up services to and from Narita and Haneda airports.",
      href: "/services#pickup",
    },
    {
      icon: "clock",
      title: "Hourly car rental",
      text: "A car and driver for 1 to 12 hours, for business, sightseeing or anything in between.",
      href: "/services#hourly",
    },
    {
      icon: "map",
      title: "Tour and Travel",
      text: "We provide tour and travel services throughout Japan (jalanjalantravel.online).",
      href: PARTNER.url,
      external: true,
    },
  ],
} as const;

export const HOME_ABOUT = {
  eyebrow: "About us",
  heading: "We provide 24-hour transfer and pick-up services to and from Narita and Haneda airports.",
  text: "Your satisfaction is our priority — we guarantee competitive prices and exceptional service.",
};

/** Payment logos on the Home page. A logo without a file shows its name. */
export const PAYMENT = {
  label: "Payment",
  logos: [
    { name: "JCB", src: "/site/payment/jcb.svg", width: 300, height: 232 },
    { name: "Square", src: "/site/payment/square.svg", width: 400, height: 100 },
    { name: "PayPal", src: "/site/payment/paypal.svg", width: 124, height: 33 },
    { name: "PayPay", src: null, width: 0, height: 0 },
  ],
  cash: "Cash payment available upon pick-up",
  note: "Tax included — No tipping required",
};

/** Companies or partners shown on the Home page, only with their permission. Empty: section hidden. */
export const CUSTOMERS: { name: string; logo: Photo; url?: string }[] = [];

export const TESTIMONIALS_SECTION = {
  eyebrow: "Testimonials",
  heading: "What travellers say",
  more: "Read more reviews on Google",
};

/** Customer reviews, word for word, quoted with permission (testimonials.csv). Empty: section hidden. */
export const TESTIMONIALS: { quote: string; name: string; country: string; trip?: string }[] = [
  {
    quote:
      "My reservation time was 22:45, but I finished all my procedures much earlier. When I contacted them, they agree to come 1 hour earlier, so that i wouldn't wait too long. Highly recommend.",
    name: "Mr. Kudratzoda",
    country: "Turkey",
  },
  {
    quote:
      "Yes! Everything was quick & easy. We arrived earlier unexpected, but we receive driver contact, he promptly picked us up earlier than scheduled after we contact him.",
    name: "Ms. Li Jun Tan",
    country: "Australia",
  },
  {
    quote:
      "I am very pleassed with the service. There was good communication and easy to follow instruction to ensure the pickup was smooth.",
    name: "Ms. Nur Hanis",
    country: "Singapore",
  },
];

// Services

export const SERVICES_PAGE = {
  eyebrow: "Services",
  title:
    "We are fully licensed professional chauffeurs, registered under the Ministry of Land, Infrastructure, Transport and Tourism.",
  credentials: [
    { label: "Languages", value: "English, Japanese, Indonesian" },
    { label: "Hire taxi license", value: "関自旅二第461", lang: "ja" },
    { label: "Bus license", value: "関自旅一第１２８６", lang: "ja" },
  ],
};

export const SERVICES = [
  {
    id: "pickup",
    icon: "plane-landing",
    title: "Airport pickup",
    text: "Land, collect your bags and walk out to a driver holding a sign with your name. No taxi queue, no train transfers with luggage.",
    points: [
      "Meet and greet at arrivals, with your name on a sign",
      "We follow your flight online; tell us about any delay",
      "Pickup 1–1.5 hours after landing, time for immigration and baggage",
      "Travelling with a pet? We plan 2.5–3 hours for quarantine",
    ],
    photo: { src: "/site/photos/pickup.jpg", width: 255, height: 302, alt: "People in suits outside an airport terminal", position: "50% 18%" },
    /** Show the cheapest fare from each airport next to the link. */
    showFromPrices: true,
    link: { label: "Get a quotation", href: QUOTATION_HREF },
  },
  {
    id: "drop-off",
    icon: "plane-takeoff",
    title: "Airport drop-off",
    text: "We pick you up at your hotel or home and drive you to Haneda or Narita, so you arrive relaxed and on time.",
    points: [
      "Pickup at your address at the time you choose",
      "The same area fares as airport pickups",
      "Tell us your suitcase sizes and we'll make sure they fit",
    ],
    photo: { src: "/site/photos/dropoff.jpg", width: 267, height: 299, alt: "Two people smiling for a photo outdoors" },
    link: { label: "Get a quotation", href: QUOTATION_HREF },
  },
  {
    id: "hourly",
    icon: "clock",
    title: "Hourly car rental",
    text: "Need a car for meetings, a day of sightseeing or several stops? Book a car and driver by the hour.",
    points: [
      "From 1 to 12 hours",
      "Pick-up and drop-off wherever you need",
      "Choose the car; we send you a price for your trip",
    ],
    photo: { src: "/site/photos/hourly.jpg", width: 600, height: 800, alt: "Silver minivan parked by a building", position: "50% 62%" },
    chip: "Price quoted by our staff",
    link: { label: "Request a quotation", href: QUOTATION_HREF },
  },
  {
    id: "groups",
    icon: "group",
    title: "Groups and big luggage",
    text: "Travelling as a family or team, or with golf bags, surfboards, snowboards or a pet carrier? We'll suggest the right vehicle.",
    points: [
      "Toyota HiAce Grand Cabin for larger groups and bulky items",
      "Buses for group travel, on request",
      "Tell us about oversized items when you book, and we'll check the fit",
    ],
    photo: { src: "/site/photos/groups.jpg", width: 264, height: 298, alt: "Travellers with luggage trolleys at the airport", position: "50% 38%" },
    link: { label: "See our fleet", href: "/about#fleet" },
  },
] as const satisfies readonly {
  id: string;
  icon: string;
  title: string;
  text: string;
  points: readonly string[];
  photo: Photo;
  showFromPrices?: boolean;
  chip?: string;
  link: Link;
}[];

export const EXTRAS_SECTION = {
  eyebrow: "Extras",
  heading: "Add what you need",
  lead: "Choose extras in the reservation form.",
  petBefore: "Travelling with a pet? Read our",
  petLink: "pet policy",
  petAfter: "before you book.",
};

// About

export const ABOUT_PAGE = {
  eyebrow: "About us",
  title: "About Goal International",
  intro:
    "We're a Tokyo transport company based in Ota City. Our drivers take travellers between Haneda or Narita and Tokyo, Kawasaki and Yokohama.",
  facts: [
    { label: "Established", value: ESTABLISHED.text },
    { label: "Capital", value: CAPITAL },
  ],
  officesHeading: "Our offices",
};

export const VALUES = [
  {
    icon: "tag",
    title: "Clear prices",
    text: "Fares are set by area and published on our Fare page, so you know the price before you book.",
  },
  {
    icon: "plane",
    title: "Pickups timed to your flight",
    text: "We plan your pickup around your landing time and follow your flight online.",
  },
  { icon: "headset", title: "Help any time", text: SUPPORT_NOTE },
] as const;

export const FLEET_SECTION = {
  eyebrow: "Our fleet",
  heading: "We offer a variety of vehicles",
  lead: "From everyday cars to the Toyota Alphard and roomy vans for groups. Extra costs are added to the area fare.",
};

/**
 * One card per fleet class (vehicle_classes.code). Seats, suitcases and extra costs come from the API.
 * text: null until the client describes the car (Alphard 2.0 / 3.0 / 4.0).
 */
export const FLEET: { classCode: string; name: string; models: string; text: string | null; photo: Photo }[] = [
  {
    classCode: "standard",
    name: "Standard car",
    models: "Nissan Serena / Honda Stepwagon",
    text: "Our everyday car, comfortable for most trips.",
    photo: { src: "/site/fleet/standard.jpg", width: 329, height: 373, alt: "Black Nissan Serena", position: "50% 62%" },
  },
  {
    classCode: "alphard-2",
    name: "Alphard 2.0",
    models: "Toyota Alphard",
    text: null,
    photo: { src: "/site/fleet/alphard-2.jpg", width: 900, height: 579, alt: "White Toyota Alphard 2.0, seen from the back", position: "50% 60%" },
  },
  {
    classCode: "alphard-3",
    name: "Alphard 3.0",
    models: "Toyota Alphard",
    text: null,
    photo: { src: "/site/fleet/alphard-3.jpg", width: 568, height: 522, alt: "White Toyota Alphard 3.0, seen from the front", position: "50% 62%" },
  },
  {
    classCode: "alphard-4",
    name: "Alphard 4.0",
    models: "Toyota Alphard",
    text: null,
    photo: { src: "/site/fleet/alphard-4.jpg", width: 567, height: 581, alt: "Black Toyota Alphard 4.0", position: "50% 58%" },
  },
  {
    classCode: "grand-cabin",
    name: "Grand Cabin",
    models: "Toyota HiAce Grand Cabin",
    text: "Room for bigger groups and bulky luggage like golf bags and surfboards.",
    photo: { src: "/site/fleet/grand-cabin.jpg", width: 900, height: 586, alt: "Silver Toyota HiAce Grand Cabin", position: "50% 55%" },
  },
  {
    classCode: "bus",
    name: "Bus",
    models: "Group travel",
    text: "For large groups. Contact us and we'll quote your trip.",
    photo: { src: "/site/fleet/bus.jpg", width: 444, height: 353, alt: "Silver minibus", position: "40% 60%" },
  },
];

export const TEAM_SECTION = { eyebrow: "Our team", heading: "The people behind your trip" };

/** Shown with each person's consent (team.csv). Empty: section hidden. */
export const TEAM: { name: string; role: string; photo: Photo }[] = [
  { name: "Dewi Chandra", role: "CEO/Marketing", photo: { src: "/site/team/dewi.jpg", width: 313, height: 420, alt: "" } },
  { name: "Kresna Hadi B.", role: "CEO/Operator/Driver", photo: { src: "/site/team/kresna.jpg", width: 312, height: 420, alt: "" } },
  {
    name: "Fukushima Yu",
    role: "Business Consultant",
    photo: { src: "/site/team/fukushima.jpg", width: 354, height: 420, alt: "", position: "50% 22%" },
  },
  {
    name: "Sugishita Hatsuo",
    role: "Law Consultant",
    photo: { src: "/site/team/sugishita.jpg", width: 393, height: 393, alt: "", position: "50% 50%" },
  },
];

// How to Book

export const HOW_TO_BOOK = {
  eyebrow: "How to book",
  title: "Book your pickup in five steps",
  intro:
    "The reservation form takes a few minutes. You'll see an estimated price as you go, and you don't pay anything until we confirm your booking.",
  start: "Start booking",
};

export interface Screenshot {
  src: string;
  width: number;
  height: number;
  /** Numbered callouts: [number, x %, y %] of the image. */
  dots: [number, number, number][];
}

/**
 * The reservation form's screens, desktop ("wide") and phone ("narrow"), taken with test details.
 * Retake them (and the dot positions) whenever the form changes.
 */
export const BOOKING_STEPS: {
  title: string;
  text: string;
  callouts: string[];
  alt: string;
  wide: Screenshot;
  narrow: Screenshot;
  ticketTip?: boolean;
}[] = [
  {
    title: "Trip details",
    text: "Tell us who's travelling, when, and where.",
    callouts: [
      "Your name as on your passport, and whether you're booking for yourself or someone else.",
      "Pick-up date and time, in Japan time. For arrivals, choose 1–1.5 hours after landing.",
      "The trip: Airport Pickup, or Others for a car by the hour.",
      "The airport and terminal, then the area and address you're going to.",
      "Going to the airport instead? Tap Swap.",
      "Your flight code, so we can follow your flight.",
    ],
    alt: "Step 1 of the reservation form: Trip details",
    wide: { src: "/how-to-book/step-1-wide.jpg", width: 1038, height: 1367, dots: [[1, 0, 9.3], [2, 0, 27], [3, 0, 38.9], [4, 0, 52.4], [5, 41.2, 62.1], [6, 0, 90.3]] },
    narrow: { src: "/how-to-book/step-1-narrow.jpg", width: 700, height: 2652, dots: [[1, 0, 6], [2, 0, 25.6], [3, 0, 40.2], [4, 0, 49.5], [5, 32.6, 62.2], [6, 0, 93.8]] },
  },
  {
    title: "Passengers and luggage",
    text: "So we can send a car that fits everyone and everything.",
    callouts: [
      'Who\'s travelling, for example "2 adults, 1 child".',
      "Suitcases by size. Tap ⓘ to see the size guide.",
      "Golf bags, surfboards, pet carriers and other bulky items.",
      "Travelling with infants or children? Tick them; you can add a baby seat in step 4.",
    ],
    alt: "Step 2 of the reservation form: Passengers and luggage",
    wide: { src: "/how-to-book/step-2-wide.jpg", width: 1038, height: 726, dots: [[1, 0, 17.6], [2, 0, 34.8], [3, 0, 57.2], [4, 0, 89.6]] },
    narrow: { src: "/how-to-book/step-2-narrow.jpg", width: 700, height: 1108, dots: [[1, 0, 14.3], [2, 0, 29.3], [3, 0, 48.9], [4, 0, 83.5]] },
  },
  {
    title: "Vehicle and payment",
    text: "Pick your car and how you'd like to pay.",
    callouts: [
      "Choose a car. Any extra cost is shown on each card.",
      "How you'll pay: card, PayPal, bank transfer, or cash on arrival (+¥1,000).",
    ],
    alt: "Step 3 of the reservation form: Vehicle and payment",
    wide: { src: "/how-to-book/step-3-wide.jpg", width: 1038, height: 1232, dots: [[1, 0, 13.8], [2, 0, 88.2]] },
    narrow: { src: "/how-to-book/step-3-narrow.jpg", width: 700, height: 1810, dots: [[1, 0, 11.8], [2, 0, 82.7]] },
    ticketTip: true,
  },
  {
    title: "Contact and extras",
    text: "How we reach you, and anything else you need.",
    callouts: [
      "Email and phone number: we use them to confirm your booking.",
      "Extras: baby seat (the first one is free), pickup at the lobby, wheelchair.",
      "Anything else, including details of a pet travelling with you.",
    ],
    alt: "Step 4 of the reservation form: Contact and extras",
    wide: { src: "/how-to-book/step-4-wide.jpg", width: 1038, height: 752, dots: [[1, 0, 17], [2, 0, 55.7], [3, 0, 74.2]] },
    narrow: { src: "/how-to-book/step-4-narrow.jpg", width: 700, height: 1582, dots: [[1, 0, 10], [2, 0, 51.3], [3, 0, 69.4]] },
  },
  {
    title: "Terms and confirm",
    text: "Check the terms and send your request.",
    callouts: ["Read the terms: payment, cancellation and pickup times.", "Tick to agree, then press Confirm reservation."],
    alt: "Step 5 of the reservation form: Terms and Conditions",
    wide: { src: "/how-to-book/step-5-wide.jpg", width: 1038, height: 668, dots: [[1, 0, 20.7], [2, 0, 90.8]] },
    narrow: { src: "/how-to-book/step-5-narrow.jpg", width: 700, height: 900, dots: [[1, 0, 19.2], [2, 0, 90.4]] },
  },
];

export const BOOKING_DONE = {
  title: "You get a booking number",
  text: "Right after you confirm, you see your booking number and a summary of your trip. A car is held for your pick-up time while our staff review your request.",
  alt: "The confirmation screen after booking, with the booking number and trip summary",
  wide: { src: "/how-to-book/done-wide.jpg", width: 1038, height: 1076, dots: [] },
  narrow: { src: "/how-to-book/done-narrow.jpg", width: 700, height: 1866, dots: [] },
} satisfies { title: string; text: string; alt: string; wide: Screenshot; narrow: Screenshot };

export const TICKET_TIP = {
  image: { src: "/how-to-book/ticket.jpg", width: 570, height: 878, alt: "" } satisfies Photo,
  title: "Your e-ticket preview",
  text: "sits next to the form and updates as you fill it in, with the estimated price for your trip.",
};

/** The e-ticket image on the Home page. */
export const HERO_TICKET: Photo = {
  src: "/how-to-book/ticket.jpg",
  width: 570,
  height: 878,
  alt: "The reservation form's e-ticket preview, showing the route, date, car and estimated price",
};

export const AFTER_BOOKING = {
  eyebrow: "After you book",
  heading: "What happens next",
  cards: [
    {
      icon: "check",
      title: "We confirm your booking",
      text: "Our staff check your request and confirm it with you by email or WhatsApp. Your booking is confirmed only after our confirmation.",
    },
    {
      icon: "card",
      title: "You pay the invoice",
      text: "We send the invoice by email. Booked more than 3 days ahead: pay within 3 days of confirmation. Booked 3 days or less ahead: pay on the day the invoice is issued.",
    },
    {
      icon: "sign",
      title: "Meet your driver",
      text: "On the day, your driver waits at arrivals with your name on a sign, or at your address for drop-offs.",
    },
  ],
  chatHeading: "Rather book by chat?",
  chatText: "Message us on WhatsApp and we'll make the booking for you.",
} as const;

// Fare and Policy

export interface Announcement {
  title: string;
  text: string;
  /** Shown from the start of showFrom to the end of showUntil, Japan time (YYYY-MM-DD). */
  showFrom: string;
  showUntil: string;
}

/** A notice at the top of the Fare and Policy page; null for none. */
export const ANNOUNCEMENT: Announcement | null = {
  title: "Announcement",
  text: "Please be informed that for the period of December 18, 2026 – January 8, 2027, an additional 20% surcharge on our basic rates will apply due to the high season. Thank you for your kind understanding and cooperation.",
  showFrom: "2026-12-15",
  showUntil: "2027-01-08",
};

/** Whether the announcement is due today, Japan time. */
export function isAnnouncementShowing(announcement: Announcement | null, now = new Date()): announcement is Announcement {
  if (!announcement) return false;
  const today = new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
  return today >= announcement.showFrom && today <= announcement.showUntil;
}

export const FARE_PAGE = {
  eyebrow: "Fare and policy",
  title: "Fares and policies",
  intro:
    "Fares are per car, not per person, for the trip between the airport and your area. They're the same in both directions. Prices are in Japanese yen. All prices include tax and highway tolls.",
  baseHeading: "Base fares",
  baseLead: "For a Standard car. Choose your airport.",
  otherAreas: "Other areas are quoted by our staff; the price shown is the lowest it can be.",
  quotedByStaff: "Quoted by staff",
  exactPrice: "Get your exact price",
  chargesHeading: "Additional charges",
  chargesLead: "Added to the base fare when they apply.",
  /** Shown when the price list can't be loaded. */
  unavailable:
    "We couldn't load the current price list. Get your exact price in the reservation form, or chat with us on WhatsApp.",
  example: {
    title: "Example",
    text: "Haneda to Shinjuku in an Alphard 4.0, picked up at 23:30, paid by card.",
    /** What the example is built from (codes in the database). */
    airportCode: "HND",
    regionCode: "shinjuku",
    vehicleTypeCode: "alphard-4-haneda",
    pickupTime: "23:30",
    paymentKind: "card",
    total: "Estimated total",
  },
  lateArrival: {
    title: "Late arrival",
    paragraphs: [
      "Delays of more than 30 minutes beyond the agreed pickup time, without telling us first, cost ¥3,000 per 30 minutes.",
      "Prices shown in the form are estimates. The final amount may include additional charges like this one.",
    ],
  },
  policiesEyebrow: "Policies",
  policiesHeading: "Booking policies",
  cancellation: {
    title: "Cancellation",
    text: "Charged as a share of the total quoted price.",
    tiers: [
      { amount: "Free", when: "3 days or more before pickup" },
      { amount: "50%", when: "2 days before pickup" },
      { amount: "100%", when: "1 day before or on the pickup day" },
    ],
  },
  termsAgreement: "By confirming your reservation, you agree to these Terms & Conditions.",
};
