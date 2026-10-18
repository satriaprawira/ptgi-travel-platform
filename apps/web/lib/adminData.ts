export type BadgeVariant = "indigo" | "accent" | "success" | "muted";

// Bookings, the weekly schedule and the waitlist are live data now: see lib/api/bookings.ts and
// components/admin/BookingsQueue.tsx, AvailabilityCalendar.tsx.

// Live data now, see lib/api/ and components/admin/: drivers and vehicles (fleet.ts),
// route pricing (fares.ts), surcharges (surcharges.ts) and users (users.ts).

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

export type ModalKind = "highseason" | "template";

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
};