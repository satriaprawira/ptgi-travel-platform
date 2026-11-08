"use client";

import { useEffect, useState } from "react";
import styles from "../AdminDashboard.module.css";
import { FormModal } from "./ui";
import { tripDateTime, yen } from "@/lib/api/format";
import {
  getReschedulePreview,
  rescheduleBooking,
  type AdminBooking,
  type ReschedulePreview,
} from "@/lib/api/bookings";

const PREVIEW_DEBOUNCE_MS = 300;
const TOKYO_OFFSET_MS = 9 * 3_600_000; // Japan has no daylight saving time

/** The Tokyo clock time ("17:30") of an ISO timestamp. */
const tokyoTime = (iso: string) => new Date(Date.parse(iso) + TOKYO_OFFSET_MS).toISOString().slice(11, 16);

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

interface Props {
  /** The booking being moved; null = closed. */
  booking: AdminBooking | null;
  onClose: () => void;
  onSaved: (booking: AdminBooking) => void;
}

/**
 * Moves a new or confirmed booking to another time (FT-10): staff pick the new date and time, see
 * whether a car is free then (buffer included), choose the vehicle and driver for a confirmed trip,
 * and keep the old price or take the recalculated one.
 */
export default function RescheduleModal({ booking, onClose, onSaved }: Props) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [preview, setPreview] = useState<ReschedulePreview | null>(null);
  const [checking, setChecking] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [priceChoice, setPriceChoice] = useState<"keep" | "new">("keep");
  const [finalPrice, setFinalPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fleetTrip = booking?.status === "confirmed" && booking.vehicle !== null;
  const quotedConfirmed = booking?.status === "confirmed" && booking.quoteRequired;

  // Start from the booking's current time each time the dialog opens.
  useEffect(() => {
    if (!booking) return;
    setDate(booking.pickupDate);
    setTime(booking.pickupTime);
    setPreview(null);
    setVehicleId("");
    setDriverId("");
    setPriceChoice("keep");
    setFinalPrice(booking.finalTotalJpy !== null ? String(booking.finalTotalJpy) : "");
    setError(null);
  }, [booking]);

  // Check the new time as it's typed: availability, free vehicles and drivers, price.
  useEffect(() => {
    if (!booking || !date || !time) return;
    const timer = setTimeout(() => {
      setChecking(true);
      setError(null);
      getReschedulePreview(booking.id, date, time)
        .then((result) => {
          setPreview(result);
          // Keep the current vehicle and driver when they're free at the new time.
          setVehicleId((prev) => {
            const keep = prev || booking.vehicle?.id;
            return result.vehicles.some((v) => v.id === keep) ? keep! : (result.vehicles[0]?.id ?? "");
          });
          setDriverId((prev) => {
            const keep = prev || booking.driver?.id;
            return result.drivers.some((d) => d.id === keep) ? keep! : (result.drivers[0]?.id ?? "");
          });
        })
        .catch((err: unknown) => {
          setPreview(null);
          setError(errorMessage(err));
        })
        .finally(() => setChecking(false));
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [booking, date, time]);

  const save = async () => {
    if (!booking) return;
    if (!preview) {
      setError("Wait for the availability check to finish.");
      return;
    }
    if (!preview.fits) {
      setError(`No ${booking.vehicleClassName} is free at the new time. Choose another time.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await rescheduleBooking(booking.id, {
        pickupDate: date,
        pickupTime: time,
        ...(fleetTrip ? { vehicleId, driverId } : {}),
        priceChoice,
        ...(quotedConfirmed && finalPrice && Number(finalPrice) !== booking.finalTotalJpy
          ? { finalTotalJpy: Number(finalPrice) }
          : {}),
      });
      onSaved(saved);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const currentPrice = preview?.current.finalTotalJpy ?? preview?.current.totalJpy ?? null;
  const priceChanged = preview?.newPrice && preview.newPrice.totalJpy !== preview.current.totalJpy;

  return (
    <FormModal
      open={booking !== null}
      title={booking ? `Edit ${booking.reference}` : "Edit booking"}
      error={error}
      saving={saving}
      onClose={onClose}
      onSubmit={() => void save()}
    >
      {booking && (
        <>
          <p className={styles.fieldHint} style={{ margin: "0 0 14px" }}>
            {booking.salutation} {booking.passengerName} · {booking.vehicleLabel} · now{" "}
            {tripDateTime(booking.pickupDate, booking.pickupTime)}
            {booking.vehicle && booking.driver
              ? ` · ${booking.vehicle.plateNumber}, ${booking.driver.fullName}`
              : booking.partner
                ? ` · partner car (${booking.partner.driverName})`
                : ""}
          </p>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="reschedule-date">New pick-up date</label>
              <input id="reschedule-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="reschedule-time">New pick-up time (Japan time)</label>
              <input id="reschedule-time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <p className={styles.fieldHint} role="status" style={{ marginTop: 0 }}>
            {checking
              ? "Checking that time…"
              : preview
                ? preview.fits
                  ? `✓ Free at that time. The car is busy until ${tokyoTime(preview.holdUntil)}, including the ${preview.bufferMinutes} min buffer.`
                  : `✗ No ${booking.vehicleClassName} is free at that time.`
                : ""}
          </p>

          {fleetTrip && preview && preview.fits && (
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label htmlFor="reschedule-vehicle">Vehicle</label>
                <select id="reschedule-vehicle" required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  {preview.vehicles.length === 0 && <option value="">No vehicle of this type is free</option>}
                  {preview.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.model} · {v.plateNumber}
                      {v.id === booking.vehicle?.id ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="reschedule-driver">Driver</label>
                <select id="reschedule-driver" required value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                  {preview.drivers.length === 0 && <option value="">No driver is free</option>}
                  {preview.drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}
                      {d.id === booking.driver?.id ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {preview && (
            <div className={styles.field}>
              <span className={styles.groupLabel}>Price</span>
              {preview.newPrice ? (
                priceChanged ? (
                  <div className={styles.choiceList}>
                    <label>
                      <input
                        type="radio"
                        name="price-choice"
                        checked={priceChoice === "keep"}
                        onChange={() => setPriceChoice("keep")}
                      />
                      Keep the current price: {currentPrice !== null ? yen(currentPrice) : "—"}
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="price-choice"
                        checked={priceChoice === "new"}
                        onChange={() => setPriceChoice("new")}
                      />
                      Use the price for the new time: {preview.newPrice.quoteRequired ? "from " : ""}
                      {yen(preview.newPrice.totalJpy)}
                      <span className={styles.choiceNote}>
                        {preview.newPrice.lines.map((line) => line.label).join(" · ")}
                      </span>
                    </label>
                  </div>
                ) : (
                  <p className={styles.fieldHint}>Unchanged at the new time: {currentPrice !== null ? yen(currentPrice) : "—"}</p>
                )
              ) : (
                <p className={styles.fieldHint}>
                  The price can&apos;t be recalculated ({preview.newPriceError}); the current price is kept.
                </p>
              )}
            </div>
          )}

          {quotedConfirmed && (
            <div className={styles.field}>
              <label htmlFor="reschedule-final-price">Quoted price (¥)</label>
              <input
                id="reschedule-final-price"
                type="number"
                min={1}
                max={10000000}
                step={1}
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
              />
            </div>
          )}
          <p className={styles.fieldHint}>The customer isn&apos;t notified automatically: let them know the new time.</p>
        </>
      )}
    </FormModal>
  );
}
