"use client";

import { useEffect, useRef, useState } from "react";
import { countryCodes, countrySuggestions } from "@/lib/options";
import { paymentLabel, surchargeBadge, yen } from "@/lib/api/format";
import { requestQuote, type Quote, type ReservationOptions } from "@/lib/api/reservation";
import TicketPreview, { type QuoteState } from "./TicketPreview";

interface AgeGroups {
  adults: boolean;
  infants: boolean;
  children: boolean;
}

export type Direction = "from-airport" | "to-airport";

interface FormState {
  salutation: string;
  fullName: string;
  bookingFor: "yes" | "no";
  bookerName: string;
  pickupDate: string;
  pickupTime: string;
  direction: Direction;
  airportId: string;
  serviceRegionId: string;
  address: string;
  countryOrigin: string;
  hasFlightCode: "yes" | "no";
  flightCode: string;
  passengers: string;
  luggage: string;
  ageGroups: AgeGroups;
  vehicleTypeId: string;
  paymentMethodId: string;
  /** add-on id → quantity */
  addOns: Record<string, number>;
  email: string;
  countryCode: string;
  phone: string;
  timesUsed: string;
  additionalRequests: string;
  petInfo: string;
}

const initialState = (options: ReservationOptions): FormState => ({
  salutation: "",
  fullName: "",
  bookingFor: "yes",
  bookerName: "",
  pickupDate: "",
  pickupTime: "14:30",
  direction: "from-airport",
  airportId: options.airports[0]?.id ?? "",
  serviceRegionId: "",
  address: "",
  countryOrigin: "",
  hasFlightCode: "yes",
  flightCode: "",
  passengers: "",
  luggage: "",
  ageGroups: { adults: true, infants: false, children: false },
  vehicleTypeId: options.vehicleTypes[0]?.id ?? "",
  paymentMethodId: options.paymentMethods[0]?.id ?? "",
  addOns: {},
  email: "",
  countryCode: "",
  phone: "",
  timesUsed: "First time",
  additionalRequests: "",
  petInfo: "",
});

const timesUsedOptions = ["First time", "Second time", "Third time", "More than three"];

const QUOTE_DEBOUNCE_MS = 300;

export default function ReservationForm({ options }: { options: ReservationOptions }) {
  const [form, setForm] = useState<FormState>(() => initialState(options));
  const [quote, setQuote] = useState<QuoteState>({ status: "idle" });
  const [submitMsg, setSubmitMsg] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAgeGroup(key: keyof AgeGroups) {
    setForm((prev) => ({ ...prev, ageGroups: { ...prev.ageGroups, [key]: !prev.ageGroups[key] } }));
  }

  function setAddOn(id: string, quantity: number) {
    setForm((prev) => ({ ...prev, addOns: { ...prev.addOns, [id]: quantity } }));
  }

  // Live price: re-quote whenever a price-relevant field changes. Debounced, and a newer request
  // cancels the older one so a slow response can never overwrite a fresher price.
  const { airportId, serviceRegionId, vehicleTypeId, paymentMethodId, pickupDate, pickupTime } = form;
  const addOnsKey = JSON.stringify(form.addOns);
  useEffect(() => {
    if (!airportId || !serviceRegionId || !vehicleTypeId || !paymentMethodId || !pickupDate || !pickupTime) {
      setQuote({ status: "idle" });
      return;
    }
    const addOns = Object.entries(JSON.parse(addOnsKey) as Record<string, number>)
      .filter(([, quantity]) => quantity > 0)
      .map(([addOnId, quantity]) => ({ addOnId, quantity }));

    const controller = new AbortController();
    const timer = setTimeout(() => {
      // Keep showing the last price (dimmed) while the new one loads, instead of flashing empty.
      setQuote((prev) => ({
        status: "loading",
        previous: prev.status === "ready" ? prev.quote : prev.status === "loading" ? prev.previous : undefined,
      }));
      requestQuote(
        { airportId, serviceRegionId, vehicleTypeId, paymentMethodId, pickupDate, pickupTime, addOns },
        controller.signal,
      )
        .then((result: Quote) => setQuote({ status: "ready", quote: result }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setQuote({ status: "error", message: error instanceof Error ? error.message : "Couldn't get a price" });
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [airportId, serviceRegionId, vehicleTypeId, paymentMethodId, pickupDate, pickupTime, addOnsKey]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Submitting bookings is the next backend milestone (POST /v1/bookings); the price is already live.
    setSubmitMsg(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setSubmitMsg(false), 2200);
  }

  const airport = options.airports.find((a) => a.id === form.airportId);
  const region = options.serviceRegions.find((r) => r.id === form.serviceRegionId);
  const selectedVehicle = options.vehicleTypes.find((v) => v.id === form.vehicleTypeId);
  const selectedPayment = options.paymentMethods.find((p) => p.id === form.paymentMethodId);
  // Only areas with a route (an active fare) from the chosen airport can be priced.
  const areas = options.serviceRegions.filter((r) => r.airportIds.includes(form.airportId));
  const wards = areas.filter((r) => r.inside23Wards);
  const otherAreas = areas.filter((r) => !r.inside23Wards);

  function changeAirport(id: string) {
    setForm((prev) => {
      const regionStillServed = options.serviceRegions.some(
        (r) => r.id === prev.serviceRegionId && r.airportIds.includes(id),
      );
      return { ...prev, airportId: id, serviceRegionId: regionStillServed ? prev.serviceRegionId : "" };
    });
  }
  const fromAirport = form.direction === "from-airport";

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
                  Pick-up time (Japan time) <span className="req">*</span>
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

            <div className="field" style={{ marginTop: 18 }}>
              <label>
                Trip <span className="req">*</span>
              </label>
              <div className="segmented">
                <input
                  type="radio"
                  name="direction"
                  id="dirFrom"
                  checked={fromAirport}
                  onChange={() => update("direction", "from-airport")}
                />
                <label htmlFor="dirFrom">From the airport</label>
                <input
                  type="radio"
                  name="direction"
                  id="dirTo"
                  checked={!fromAirport}
                  onChange={() => update("direction", "to-airport")}
                />
                <label htmlFor="dirTo">To the airport</label>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="airportId">
                  Airport <span className="req">*</span>
                </label>
                <select
                  id="airportId"
                  required
                  value={form.airportId}
                  onChange={(e) => changeAirport(e.target.value)}
                >
                  {options.airports.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="serviceRegionId">
                  {fromAirport ? "Drop-off area" : "Pick-up area"} <span className="req">*</span>
                </label>
                <select
                  id="serviceRegionId"
                  required
                  value={form.serviceRegionId}
                  onChange={(e) => update("serviceRegionId", e.target.value)}
                >
                  <option value="" disabled>
                    Select ward or city
                  </option>
                  {wards.length > 0 && (
                    <optgroup label="Tokyo 23 wards">
                      {wards.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {otherAreas.length > 0 && (
                    <optgroup label="Other areas">
                      {otherAreas.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            <div className="field" style={{ marginTop: 18 }}>
              <label htmlFor="address">
                {fromAirport ? "Drop-off address" : "Pick-up address"} <span className="req">*</span>
              </label>
              <input
                type="text"
                id="address"
                placeholder="Hotel or building name and full address"
                required
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
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
                {options.vehicleTypes.map((vehicle) => {
                  const badge = surchargeBadge(vehicle.surchargeJpy);
                  return (
                    <div className="car-card" key={vehicle.id}>
                      <input
                        type="radio"
                        name="vehicleType"
                        id={`vt-${vehicle.code}`}
                        checked={form.vehicleTypeId === vehicle.id}
                        onChange={() => update("vehicleTypeId", vehicle.id)}
                      />
                      <label htmlFor={`vt-${vehicle.code}`}>
                        <span className="name">{vehicle.name}</span>
                        {vehicle.note && <span className="note">{vehicle.note}</span>}
                        {badge && <span className="surcharge">{badge}</span>}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="field" style={{ marginTop: 22 }}>
              <label>
                Payment method <span className="req">*</span>
              </label>
              <div className="pill-group">
                {options.paymentMethods.map((method) => (
                  <div className="pill" key={method.id}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      id={`pm-${method.code}`}
                      checked={form.paymentMethodId === method.id}
                      onChange={() => update("paymentMethodId", method.id)}
                    />
                    <label htmlFor={`pm-${method.code}`}>{paymentLabel(method)}</label>
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

            {options.addOns.length > 0 && (
              <div className="field" style={{ marginTop: 18 }}>
                <label>
                  Extras <span className="hint">— optional</span>
                </label>
                <div className="pill-group">
                  {options.addOns.map((addOn) => {
                    const quantity = form.addOns[addOn.id] ?? 0;
                    const price = `+${yen(addOn.priceJpy)}`;
                    if (addOn.maxQuantity > 1) {
                      return (
                        <div className="addon-qty" key={addOn.id}>
                          <label htmlFor={`ao-${addOn.code}`}>
                            {addOn.label}
                            <span className="addon-price">
                              {addOn.freeQuantity === 0
                                ? `${price} each`
                                : `${addOn.freeQuantity === 1 ? "First one" : `First ${addOn.freeQuantity}`} free, then ${price} each`}
                            </span>
                          </label>
                          <select
                            id={`ao-${addOn.code}`}
                            value={quantity}
                            onChange={(e) => setAddOn(addOn.id, Number(e.target.value))}
                          >
                            {Array.from({ length: addOn.maxQuantity + 1 }, (_, n) => (
                              <option key={n} value={n}>
                                {n === 0 ? "None" : n}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    return (
                      <div className="pill" key={addOn.id}>
                        <input
                          type="checkbox"
                          id={`ao-${addOn.code}`}
                          checked={quantity > 0}
                          onChange={(e) => setAddOn(addOn.id, e.target.checked ? 1 : 0)}
                        />
                        <label htmlFor={`ao-${addOn.code}`}>
                          {addOn.label} ({price})
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid-2" style={{ marginTop: 18 }}>
              <div className="field">
                <label htmlFor="additionalRequests">Other requests</label>
                <textarea
                  id="additionalRequests"
                  placeholder="Anything else our driver should know?"
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
              {submitMsg ? "Booking submission is coming soon — no data sent" : "Confirm reservation"}
            </button>
            <p className="form-footnote">*Please complete all required fields before submitting.</p>
          </div>
        </form>
      </main>

      <TicketPreview
        salutation={form.salutation}
        fullName={form.fullName}
        origin={fromAirport ? airport?.name : region?.name}
        destination={fromAirport ? region?.name : airport?.name}
        pickupDate={form.pickupDate}
        pickupTime={form.pickupTime}
        hasFlightCode={form.hasFlightCode}
        flightCode={form.flightCode}
        passengers={form.passengers}
        luggage={form.luggage}
        vehicleLabel={selectedVehicle?.label}
        paymentLabel={selectedPayment?.label}
        quote={quote}
      />
    </div>
  );
}
