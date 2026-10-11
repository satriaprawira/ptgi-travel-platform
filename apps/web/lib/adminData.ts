export type BadgeVariant = "indigo" | "accent" | "success" | "muted";

// Bookings are live data now: see lib/api/bookings.ts and components/admin/BookingsQueue.tsx.

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

// Live data now, see lib/api/ and components/admin/: drivers and vehicles (fleet.ts),
// route pricing (fares.ts) and surcharges (surcharges.ts).

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

export type ModalKind = "highseason" | "template" | "user";

export type ModalField =
  | { type: "text" | "date"; label: string; placeholder?: string }
  | { type: "select"; label: string; options: string[] }
  | { type: "textarea"; label: string; placeholder?: string };

export interface ModalFormConfig {
  title: string;
  rows: (ModalField | ModalField[])[];
}

export const modalForms: Record<ModalKind, ModalFormConfig> = {
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