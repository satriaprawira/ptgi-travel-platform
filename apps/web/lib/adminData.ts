export type BadgeVariant = "indigo" | "accent" | "success" | "muted";

export interface Booking {
  id: string;
  passenger: string;
  origin: string;
  route: string;
  pickup: string;
  carType: string;
  status: string;
  statusVariant: BadgeVariant;
  actionLabel: string;
  actionToast: string;
}

export const bookings: Booking[] = [
  {
    id: "GI-2609-014",
    passenger: "Sarah Mitchell",
    origin: "Australia",
    route: "Narita Airport → Shibuya",
    pickup: "06 Sep · 14:30",
    carType: "New Alphard (NRT)",
    status: "New Request",
    statusVariant: "indigo",
    actionLabel: "Quote",
    actionToast: "Opening quotation form (mockup)",
  },
  {
    id: "GI-2609-011",
    passenger: "Michael Chen",
    origin: "Indonesia",
    route: "Haneda Airport → Ginza",
    pickup: "06 Sep · 09:00",
    carType: "Medium car",
    status: "Quotation Sent",
    statusVariant: "indigo",
    actionLabel: "Follow up",
    actionToast: "Reminder sent to customer",
  },
  {
    id: "GI-2609-009",
    passenger: "Elena Fischer",
    origin: "Germany",
    route: "Shinjuku → Narita Airport",
    pickup: "07 Sep · 11:15",
    carType: "Standard car",
    status: "Availability Checking",
    statusVariant: "indigo",
    actionLabel: "Check",
    actionToast: "Opening availability check (mockup)",
  },
  {
    id: "GI-2608-098",
    passenger: "James Carter",
    origin: "United States",
    route: "Narita Airport → Roppongi",
    pickup: "07 Sep · 16:00",
    carType: "Grand Cabin",
    status: "Waiting List",
    statusVariant: "accent",
    actionLabel: "Offer slot",
    actionToast: "Alternative slot offered",
  },
  {
    id: "GI-2608-092",
    passenger: "Aiko Tanaka",
    origin: "Indonesia",
    route: "Haneda Airport → Odaiba",
    pickup: "06 Sep · 19:45",
    carType: "Medium car",
    status: "Payment Pending",
    statusVariant: "accent",
    actionLabel: "Confirm",
    actionToast: "Marked as paid – booking confirmed",
  },
  {
    id: "GI-2608-081",
    passenger: "Laura Dubois",
    origin: "France",
    route: "Narita Airport → Asakusa",
    pickup: "08 Sep · 13:00",
    carType: "Standard car",
    status: "Confirmed",
    statusVariant: "success",
    actionLabel: "Assign",
    actionToast: "Opening driver assignment (mockup)",
  },
  {
    id: "GI-2608-077",
    passenger: "Thomas Reid",
    origin: "Australia",
    route: "Haneda Airport → Shinagawa",
    pickup: "05 Sep · 20:30",
    carType: "New Alphard (HND)",
    status: "Driver Assigned",
    statusVariant: "success",
    actionLabel: "View",
    actionToast: "Viewing trip detail (mockup)",
  },
  {
    id: "GI-2607-140",
    passenger: "Priya Nair",
    origin: "Australia",
    route: "Narita Airport → Ueno",
    pickup: "03 Sep · 10:00",
    carType: "Standard car",
    status: "Cancelled",
    statusVariant: "muted",
    actionLabel: "View",
    actionToast: "Viewing cancellation note (mockup)",
  },
];

export interface ScheduleBlock {
  variant: "booked" | "hold";
  left: string;
  width: string;
  label: string;
}

export interface DriverSchedule {
  driver: string;
  vehicle: string;
  blocks: ScheduleBlock[];
}

export const scheduleAxis = ["06", "10", "14", "18", "22"];

export const todaySchedule: DriverSchedule[] = [
  {
    driver: "Hiroshi Sato",
    vehicle: "Alphard · JP-3021",
    blocks: [
      { variant: "booked", left: "12%", width: "18%", label: "09:00–11:30" },
      { variant: "hold", left: "55%", width: "12%", label: "Hold" },
    ],
  },
  {
    driver: "Kenji Watanabe",
    vehicle: "Standard · JP-1187",
    blocks: [
      { variant: "booked", left: "4%", width: "14%", label: "07:00–09:00" },
      { variant: "booked", left: "40%", width: "22%", label: "13:30–17:00" },
    ],
  },
  {
    driver: "Yuki Nakamura",
    vehicle: "Grand Cabin · JP-4402",
    blocks: [{ variant: "booked", left: "70%", width: "20%", label: "18:00–20:30" }],
  },
];

export interface WaitlistEntry {
  position: number;
  bookingId: string;
  passenger: string;
  requested: string;
  reason: string;
  actionLabel: string;
  actionToast: string;
}

export const waitlist: WaitlistEntry[] = [
  {
    position: 1,
    bookingId: "GI-2608-098",
    passenger: "James Carter",
    requested: "07 Sep · 16:00",
    reason: "No Grand Cabin free",
    actionLabel: "Offer alternative",
    actionToast: "Alternative time offered to customer",
  },
  {
    position: 2,
    bookingId: "GI-2608-085",
    passenger: "Nadia Putri",
    requested: "08 Sep · 09:30",
    reason: "No driver in window",
    actionLabel: "Notify when free",
    actionToast: "Will notify when a slot opens",
  },
];

// Drivers and vehicles are live data now: see lib/api/fleet.ts and components/admin/.

export interface PricingRow {
  packageName: string;
  note: string;
  price: string;
}

export const pricingRows: PricingRow[] = [
  { packageName: "Standard car", note: "Nissan Serena / Honda Stepwagon", price: "8,000" },
  { packageName: "Medium car", note: "Alphard / Vellfire", price: "12,000" },
  { packageName: "New Alphard 4.0 (Haneda)", note: "Haneda pick-up", price: "16,000" },
  { packageName: "New Alphard 4.0 (Narita)", note: "Narita pick-up", price: "19,000" },
  { packageName: "Grand Cabin (within 23 wards)", note: "Within 23 wards", price: "22,000" },
  { packageName: "Grand Cabin (outside 23 wards)", note: "Outside 23 wards", price: "26,000" },
  { packageName: "Bus", note: "Group travel – quote on request", price: "Inquire" },
];

export interface SurchargeRow {
  rule: string;
  amount: string;
  active: boolean;
}

export const surchargeRows: SurchargeRow[] = [
  { rule: "Cash on arrival fee", amount: "1,000", active: true },
  { rule: "Late-night pick-up (22:00–05:00)", amount: "1,500", active: true },
  { rule: "Extra luggage (per item over limit)", amount: "500", active: true },
  { rule: "Additional stop", amount: "1,000", active: false },
];

export interface HighSeasonRow {
  period: string;
  dates: string;
  adjustment: string;
}

export const highSeasonRows: HighSeasonRow[] = [
  { period: "New Year Peak", dates: "28 Dec – 05 Jan", adjustment: "+20%" },
  { period: "Golden Week", dates: "29 Apr – 06 May", adjustment: "+15%" },
  { period: "Obon", dates: "13 Aug – 16 Aug", adjustment: "+15%" },
];

export interface NotificationTemplate {
  id: string;
  name: string;
  channels: string[];
  body: string;
  hint: string;
}

export const notificationTemplates: NotificationTemplate[] = [
  {
    id: "confirmation",
    name: "Booking Confirmation",
    channels: ["Email", "WhatsApp"],
    body: "Hi {{passenger_name}}, your pickup on {{pickup_date}} at {{pickup_time}} from {{pickup_location}} is confirmed. Driver details will follow 24h before your trip.",
    hint: "Variables: {{passenger_name}} {{pickup_date}} {{pickup_time}} {{pickup_location}}",
  },
  {
    id: "payment-reminder",
    name: "Payment Reminder",
    channels: ["Email"],
    body: "Hi {{passenger_name}}, please complete payment by {{payment_deadline}} to keep your reservation for {{pickup_date}}. Slots not paid by the deadline may be released.",
    hint: "Variables: {{passenger_name}} {{payment_deadline}} {{pickup_date}} — deadline is 3×24h normally, 1×24h for last-minute (H+1) bookings.",
  },
  {
    id: "waitlist-update",
    name: "Waitlist Update",
    channels: ["WhatsApp"],
    body: "Hi {{passenger_name}}, a slot has opened up close to your requested time of {{pickup_time}} on {{pickup_date}}. Reply to confirm within 2 hours to hold it.",
    hint: "Variables: {{passenger_name}} {{pickup_date}} {{pickup_time}}",
  },
];

export interface AdminUser {
  name: string;
  email: string;
  role: string;
  roleVariant: BadgeVariant;
  status: string;
  lastLogin: string;
}

export const adminUsers: AdminUser[] = [
  { name: "Wildaan Pratama", email: "wildaan@goalintl.co", role: "Admin", roleVariant: "indigo", status: "Active", lastLogin: "Today, 08:12" },
  { name: "Kresna Adjie", email: "kresna@goalintl.co", role: "Admin", roleVariant: "indigo", status: "Active", lastLogin: "Yesterday, 19:40" },
  { name: "Ayu Lestari", email: "ayu@goalintl.co", role: "Staff", roleVariant: "muted", status: "Active", lastLogin: "Today, 07:55" },
  { name: "Hiroshi Sato", email: "hiroshi.s@goalintl.co", role: "Driver", roleVariant: "muted", status: "Active", lastLogin: "Today, 06:30" },
];

export type ModalKind = "surcharge" | "highseason" | "template" | "user";

export type ModalField =
  | { type: "text" | "date"; label: string; placeholder?: string }
  | { type: "select"; label: string; options: string[] }
  | { type: "textarea"; label: string; placeholder?: string };

export interface ModalFormConfig {
  title: string;
  rows: (ModalField | ModalField[])[];
}

export const modalForms: Record<ModalKind, ModalFormConfig> = {
  surcharge: {
    title: "Add Surcharge Rule",
    rows: [
      { type: "text", label: "Rule name", placeholder: "e.g. Airport toll fee" },
      { type: "text", label: "Amount", placeholder: "¥ 0" },
      { type: "select", label: "Type", options: ["Flat fee", "Percentage of fare"] },
      { type: "select", label: "Status", options: ["Active", "Inactive"] },
    ],
  },
  highseason: {
    title: "Add High-Season Period",
    rows: [
      { type: "text", label: "Period name", placeholder: "e.g. Cherry Blossom Week" },
      [
        { type: "date", label: "Start date" },
        { type: "date", label: "End date" },
      ],
      { type: "text", label: "Rate adjustment (%)", placeholder: "e.g. 15" },
    ],
  },
  template: {
    title: "Add Notification Template",
    rows: [
      { type: "text", label: "Template name", placeholder: "e.g. Trip Reminder" },
      { type: "select", label: "Channel", options: ["Email", "WhatsApp", "Email + WhatsApp"] },
      { type: "textarea", label: "Message", placeholder: "Hi {{passenger_name}}, ..." },
    ],
  },
  user: {
    title: "Add User",
    rows: [
      { type: "text", label: "Full name", placeholder: "e.g. Dewi Anggraini" },
      { type: "text", label: "Email", placeholder: "name@goalintl.co" },
      { type: "select", label: "Role", options: ["Staff", "Admin", "Driver"] },
    ],
  },
};