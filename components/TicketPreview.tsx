"use client";

import type { CarOption, PaymentOption } from "@/lib/options";

interface TicketPreviewProps {
  salutation: string;
  fullName: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  hasFlightCode: "yes" | "no";
  flightCode: string;
  passengers: string;
  luggage: string;
  selectedCar?: CarOption;
  selectedPayment?: PaymentOption;
}

function formatDate(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function TicketPreview({
  salutation,
  fullName,
  pickupLocation,
  destination,
  pickupDate,
  pickupTime,
  hasFlightCode,
  flightCode,
  passengers,
  luggage,
  selectedCar,
  selectedPayment,
}: TicketPreviewProps) {
  const passengerLabel = fullName.trim()
    ? [salutation, fullName.trim()].filter(Boolean).join(" ")
    : "Add your name above";
  const partyLabel = [passengers.trim(), luggage.trim()].filter(Boolean).join(" · ") || "—";
  const flightLabel = hasFlightCode === "yes" ? flightCode.trim() || "—" : "No code";

  const notes: string[] = [];
  if (selectedCar?.surcharge) notes.push(`${selectedCar.value}: ${selectedCar.surcharge}`);
  if (selectedPayment?.surcharge) notes.push(`Cash on arrival: ${selectedPayment.surcharge}`);

  return (
    <aside className="ticket-col">
      <div className="ticket">
        <div className="ticket-top">
          <div className="ticket-brand">NRT ⇄ HND · E-Ticket preview</div>
          <div className="ticket-passenger">
            Passenger
            <span>{passengerLabel}</span>
          </div>
          <div className="ticket-route">
            <span>{pickupLocation.trim() || "Pick-up location"}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12h16M14 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{destination.trim() || "Destination"}</span>
          </div>
          <div className="ticket-meta-grid">
            <div className="m">
              <label>Date</label>
              <div className="val">{formatDate(pickupDate) || "—"}</div>
            </div>
            <div className="m">
              <label>Time</label>
              <div className="val">{pickupTime || "—"}</div>
            </div>
            <div className="m">
              <label>Flight</label>
              <div className="val">{flightLabel}</div>
            </div>
            <div className="m">
              <label>Party</label>
              <div className="val">{partyLabel}</div>
            </div>
          </div>
        </div>

        <div className="ticket-perf" />

        <div className="ticket-bottom">
          <div className="ticket-meta-grid">
            <div className="m">
              <label>Vehicle</label>
              <div className="val">{selectedCar?.value ?? "Not selected"}</div>
            </div>
            <div className="m">
              <label>Payment</label>
              <div className="val">{selectedPayment?.value ?? "Not selected"}</div>
            </div>
          </div>
          {notes.length > 0 && <div className="ticket-surcharge show">{notes.join("  ·  ")}</div>}
          <div className="barcode" aria-hidden="true" />
        </div>
      </div>
      <p className="ticket-hint">This preview fills in live as you complete the form.</p>
    </aside>
  );
}
