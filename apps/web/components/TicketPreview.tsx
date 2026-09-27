"use client";

import { yen } from "@/lib/api/format";
import type { Quote } from "@/lib/api/reservation";

export type QuoteState =
  | { status: "idle" }
  | { status: "loading"; previous?: Quote }
  | { status: "ready"; quote: Quote }
  | { status: "error"; message: string };

interface TicketPreviewProps {
  salutation: string;
  fullName: string;
  origin?: string;
  destination?: string;
  pickupDate: string;
  pickupTime: string;
  hasFlightCode: "yes" | "no";
  flightCode: string;
  passengers: string;
  luggage: string;
  vehicleLabel?: string;
  paymentLabel?: string;
  quote: QuoteState;
}

function formatDate(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function PriceBlock({ state }: { state: QuoteState }) {
  if (state.status === "idle") {
    return <div className="ticket-price ticket-price-hint">Choose date, time, airport and area to see your price.</div>;
  }
  if (state.status === "error") {
    return (
      <div className="ticket-price ticket-price-error" role="alert">
        {state.message}
      </div>
    );
  }

  const quote = state.status === "ready" ? state.quote : state.previous;
  if (!quote) return <div className="ticket-price ticket-price-hint">Calculating your price…</div>;

  return (
    <div className={`ticket-price ${state.status === "loading" ? "ticket-price-stale" : ""}`} aria-live="polite">
      <ul className="price-lines">
        {quote.lines.map((line, index) => (
          <li key={`${line.code}-${index}`}>
            <span>{line.label}</span>
            <span>
              {line.amountJpy === null
                ? line.minAmountJpy
                  ? `from ${yen(line.minAmountJpy)}`
                  : "on request"
                : line.amountJpy === 0
                  ? "Free"
                  : yen(line.amountJpy)}
            </span>
          </li>
        ))}
      </ul>
      <div className="price-total">
        <span>{quote.quoteRequired ? "Estimated from" : "Total"}</span>
        <span>{yen(quote.totalJpy)}</span>
      </div>
      {quote.quoteRequired && (
        <p className="price-note">Part of this trip is quoted by our staff. We&apos;ll confirm the final price by email.</p>
      )}
    </div>
  );
}

export default function TicketPreview({
  salutation,
  fullName,
  origin,
  destination,
  pickupDate,
  pickupTime,
  hasFlightCode,
  flightCode,
  passengers,
  luggage,
  vehicleLabel,
  paymentLabel,
  quote,
}: TicketPreviewProps) {
  const passengerLabel = fullName.trim()
    ? [salutation, fullName.trim()].filter(Boolean).join(" ")
    : "Add your name above";
  const partyLabel = [passengers.trim(), luggage.trim()].filter(Boolean).join(" · ") || "—";
  const flightLabel = hasFlightCode === "yes" ? flightCode.trim() || "—" : "No code";

  return (
    <aside className="ticket-col">
      <div className="ticket">
        <div className="ticket-top">
          <div className="ticket-brand">Your E-Ticket preview</div>
          <div className="ticket-passenger">
            Passenger
            <span>{passengerLabel}</span>
          </div>
          <div className="ticket-route">
            <span>{origin || "Pick-up"}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12h16M14 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{destination || "Destination"}</span>
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
              <div className="val">{vehicleLabel ?? "Not selected"}</div>
            </div>
            <div className="m">
              <label>Payment</label>
              <div className="val">{paymentLabel ?? "Not selected"}</div>
            </div>
          </div>
          <PriceBlock state={quote} />
          <div className="barcode" aria-hidden="true" />
        </div>
      </div>
      <p className="ticket-hint">This preview and price update live as you complete the form.</p>
    </aside>
  );
}
