"use client";

import { useRef, useState } from "react";
import { carOptions, countryCodes, countrySuggestions, paymentOptions } from "@/lib/options";
import TicketPreview from "./TicketPreview";

interface AgeGroups {
  adults: boolean;
  infants: boolean;
  children: boolean;
}

interface FormState {
  salutation: string;
  fullName: string;
  bookingFor: "yes" | "no";
  bookerName: string;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  destination: string;
  countryOrigin: string;
  hasFlightCode: "yes" | "no";
  flightCode: string;
  passengers: string;
  luggage: string;
  ageGroups: AgeGroups;
  carType: string;
  paymentMethod: string;
  email: string;
  countryCode: string;
  phone: string;
  timesUsed: string;
  additionalRequests: string;
  petInfo: string;
}

const initialState: FormState = {
  salutation: "",
  fullName: "",
  bookingFor: "yes",
  bookerName: "",
  pickupDate: "",
  pickupTime: "14:30",
  pickupLocation: "",
  destination: "",
  countryOrigin: "",
  hasFlightCode: "yes",
  flightCode: "",
  passengers: "",
  luggage: "",
  ageGroups: { adults: true, infants: false, children: false },
  carType: carOptions[0].value,
  paymentMethod: paymentOptions[0].value,
  email: "",
  countryCode: "",
  phone: "",
  timesUsed: "First time",
  additionalRequests: "",
  petInfo: "",
};

const timesUsedOptions = ["First time", "Second time", "Third time", "More than three"];

export default function ReservationForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitMsg, setSubmitMsg] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAgeGroup(key: keyof AgeGroups) {
    setForm((prev) => ({ ...prev, ageGroups: { ...prev.ageGroups, [key]: !prev.ageGroups[key] } }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // This mockup has no backend wired up yet — see NEXT_PUBLIC_API_URL in .env.example
    // for where the NestJS API call would go once Phase 1 backend work lands.
    setSubmitMsg(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSubmitMsg(false), 2200);
  }

  const selectedCar = carOptions.find((c) => c.value === form.carType);
  const selectedPayment = paymentOptions.find((p) => p.value === form.paymentMethod);

  return (
    <div className="layout">
      <main>
        <form id="resForm" onSubmit={handleSubmit}>
          {/* 01 Trip details */}
          <section className="card">
            <div className="card-head">
              <span className="step-no">01</span>
              <h2>Trip details</h2>
            </div>

            <div className="grid-4">
              <div className="field">
                <label htmlFor="salutation">
                  Salutation <span className="req">*</span>
                </label>
                <select
                  id="salutation"
                  required
                  value={form.salutation}
                  onChange={(e) => update("salutation", e.target.value)}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option>Mr.</option>
                  <option>Mrs.</option>
                  <option>Ms.</option>
                </select>
              </div>
              <div className="field span-3">
                <label htmlFor="fullName">
                  Passenger name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  placeholder="As shown on passport"
                  required
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 18 }}>
              <label>
                Booking for yourself? <span className="req">*</span>
              </label>
              <div className="segmented">
                <input
                  type="radio"
                  name="bookingFor"
                  id="bfYes"
                  checked={form.bookingFor === "yes"}
                  onChange={() => update("bookingFor", "yes")}
                />
                <label htmlFor="bfYes">Yes, it&apos;s me</label>
                <input
                  type="radio"
                  name="bookingFor"
                  id="bfNo"
                  checked={form.bookingFor === "no"}
                  onChange={() => update("bookingFor", "no")}
                />
                <label htmlFor="bfNo">No, for someone else</label>
              </div>
              {form.bookingFor === "no" && (
                <div className="conditional">
                  <div className="field">
                    <label htmlFor="bookerName">
                      Your name (person booking) <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="bookerName"
                      placeholder="Your full name"
                      value={form.bookerName}
                      onChange={(e) => update("bookerName", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid-2" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="pickupDate">
                  Pick-up date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  id="pickupDate"
                  required
                  value={form.pickupDate}
                  onChange={(e) => update("pickupDate", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="pickupTime">
                  Pick-up time <span className="req">*</span>
                </label>
                <input
                  type="time"
                  id="pickupTime"
                  required
                  value={form.pickupTime}
                  onChange={(e) => update("pickupTime", e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="pickupLocation">
                  Pick-up location <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="pickupLocation"
                  placeholder="Building name and full address"
                  required
                  value={form.pickupLocation}
                  onChange={(e) => update("pickupLocation", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="destination">
                  Destination <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="destination"
                  placeholder="Building name and full address"
                  required
                  value={form.destination}
                  onChange={(e) => update("destination", e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="countryOrigin">
                  Country of origin <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="countryOrigin"
                  list="countryList"
                  placeholder="Start typing…"
                  required
                  value={form.countryOrigin}
                  onChange={(e) => update("countryOrigin", e.target.value)}
                />
                <datalist id="countryList">
                  {countrySuggestions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="field">
                <label>
                  Do you have a flight code? <span className="req">*</span>
                </label>
                <div className="segmented">
                  <input
                    type="radio"
                    name="hasFlight"
                    id="fcYes"
                    checked={form.hasFlightCode === "yes"}
                    onChange={() => update("hasFlightCode", "yes")}
                  />
                  <label htmlFor="fcYes">Yes</label>
                  <input
                    type="radio"
                    name="hasFlight"
                    id="fcNo"
                    checked={form.hasFlightCode === "no"}
                    onChange={() => update("hasFlightCode", "no")}
                  />
                  <label htmlFor="fcNo">No</label>
                </div>
              </div>
            </div>

            {form.hasFlightCode === "yes" && (
              <div className="conditional">
                <div className="field">
                  <label htmlFor="flightCode">Flight code</label>
                  <input
                    type="text"
                    id="flightCode"
                    placeholder="e.g. JL11"
                    value={form.flightCode}
                    onChange={(e) => update("flightCode", e.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          {/* 02 Passengers & luggage */}
          <section className="card">
            <div className="card-head">
              <span className="step-no">02</span>
              <h2>Passengers &amp; luggage</h2>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="passengers">
                  Passengers <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="passengers"
                  placeholder="e.g. 1 adult, 2 children"
                  required
                  value={form.passengers}
                  onChange={(e) => update("passengers", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="luggage">
                  Luggage — Large / Medium / Small <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="luggage"
                  placeholder="e.g. L=1, M=2, S=1"
                  required
                  value={form.luggage}
                  onChange={(e) => update("luggage", e.target.value)}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 18 }}>
              <label>
                Ages travelling <span className="hint">— select all that apply</span>
              </label>
              <div className="pill-group">
                <div className="pill">
                  <input
                    type="checkbox"
                    id="ageAdults"
                    checked={form.ageGroups.adults}
                    onChange={() => toggleAgeGroup("adults")}
                  />
                  <label htmlFor="ageAdults">All adults</label>
                </div>
                <div className="pill">
                  <input
                    type="checkbox"
                    id="ageInfants"
                    checked={form.ageGroups.infants}
                    onChange={() => toggleAgeGroup("infants")}
                  />
                  <label htmlFor="ageInfants">Infant(s), 0–2</label>
                </div>
                <div className="pill">
                  <input
                    type="checkbox"
                    id="ageChildren"
                    checked={form.ageGroups.children}
                    onChange={() => toggleAgeGroup("children")}
                  />
                  <label htmlFor="ageChildren">Child(ren), 2–12</label>
                </div>
              </div>
            </div>
          </section>

          {/* 03 Vehicle & payment */}
          <section className="card">
            <div className="card-head">
              <span className="step-no">03</span>
              <h2>Vehicle &amp; payment</h2>
            </div>

            <div className="field">
              <label>
                Requested car type <span className="req">*</span>
              </label>
              <div className="car-options">
                {carOptions.map((car) => (
                  <div className="car-card" key={car.id}>
                    <input
                      type="radio"
                      name="carType"
                      id={car.id}
                      checked={form.carType === car.value}
                      onChange={() => update("carType", car.value)}
                    />
                    <label htmlFor={car.id}>
                      <span className="name">{car.name}</span>
                      <span className="note">{car.note}</span>
                      {car.surcharge && <span className="surcharge">{car.surcharge}</span>}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginTop: 22 }}>
              <label>
                Payment method <span className="req">*</span>
              </label>
              <div className="pill-group">
                {paymentOptions.map((pay) => (
                  <div className="pill" key={pay.id}>
                    <input
                      type="radio"
                      name="payMethod"
                      id={pay.id}
                      checked={form.paymentMethod === pay.value}
                      onChange={() => update("paymentMethod", pay.value)}
                    />
                    <label htmlFor={pay.id}>{pay.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 04 Contact & extras */}
          <section className="card">
            <div className="card-head">
              <span className="step-no">04</span>
              <h2>Contact &amp; extras</h2>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="email">
                  Email <span className="req">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div className="field">
                <label>
                  Phone number <span className="req">*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 10 }}>
                  <select
                    aria-label="Country code"
                    required
                    value={form.countryCode}
                    onChange={(e) => update("countryCode", e.target.value)}
                  >
                    <option value="" disabled>
                      Code
                    </option>
                    {countryCodes.map((code) => (
                      <option key={code}>{code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="12345678"
                    required
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="field" style={{ marginTop: 18 }}>
              <label>Times you&apos;ve used our service</label>
              <div className="pill-group">
                {timesUsedOptions.map((t, i) => (
                  <div className="pill" key={t}>
                    <input
                      type="radio"
                      name="timesUsed"
                      id={`tu${i + 1}`}
                      checked={form.timesUsed === t}
                      onChange={() => update("timesUsed", t)}
                    />
                    <label htmlFor={`tu${i + 1}`}>{t}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="additionalRequests">Additional requests</label>
                <textarea
                  id="additionalRequests"
                  placeholder="Baby seat, wheelchair, etc."
                  value={form.additionalRequests}
                  onChange={(e) => update("additionalRequests", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="petInfo">Pet information</label>
                <textarea
                  id="petInfo"
                  placeholder="Breed, size, and cage dimensions"
                  value={form.petInfo}
                  onChange={(e) => update("petInfo", e.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="submit-row">
            <button type="submit" className="submit-btn">
              {submitMsg ? "This is a mockup — no data sent" : "Confirm reservation"}
            </button>
            <p className="form-footnote">*Please complete all required fields before submitting.</p>
          </div>
        </form>
      </main>

      <TicketPreview
        salutation={form.salutation}
        fullName={form.fullName}
        pickupLocation={form.pickupLocation}
        destination={form.destination}
        pickupDate={form.pickupDate}
        pickupTime={form.pickupTime}
        hasFlightCode={form.hasFlightCode}
        flightCode={form.flightCode}
        passengers={form.passengers}
        luggage={form.luggage}
        selectedCar={selectedCar}
        selectedPayment={selectedPayment}
      />
    </div>
  );
}
