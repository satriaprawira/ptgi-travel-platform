"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import styles from "../AdminDashboard.module.css";
import { FormModal, PanelHead, TableMessage, badgeClass } from "./ui";
import type { BadgeVariant } from "@/lib/adminData";
import { tripDateTime, yen } from "@/lib/api/format";
import {
  cancelBooking,
  confirmBooking,
  getAssignmentOptions,
  listBookings,
  type AdminBooking,
  type AssignmentOptions,
  type BookingStatus,
} from "@/lib/api/bookings";

const STATUS: Record<BookingStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: "New Request", variant: "indigo" },
  confirmed: { label: "Confirmed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "muted" },
};

type StatusFilter = "all" | BookingStatus;

const pickupText = (booking: AdminBooking) => tripDateTime(booking.pickupDate, booking.pickupTime);

function routeText(booking: AdminBooking): string {
  return booking.direction === "from_airport"
    ? `${booking.airport.name} → ${booking.regionName}`
    : `${booking.regionName} → ${booking.airport.name}`;
}

function priceText(booking: AdminBooking): string {
  if (booking.finalTotalJpy !== null) return yen(booking.finalTotalJpy);
  return booking.quoteRequired ? `from ${yen(booking.totalJpy)}` : yen(booking.totalJpy);
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

interface Props {
  title: string;
  description: string;
  showToast: (message: string) => void;
}

export default function BookingsQueue({ title, description, showToast }: Props) {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Confirming assigns the vehicle and driver for the trip (and the final price if it was quoted).
  const [confirming, setConfirming] = useState<AdminBooking | null>(null);
  const [options, setOptions] = useState<AssignmentOptions | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setBookings(await listBookings());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const query = search.trim().toLowerCase();
  const visible = bookings.filter(
    (booking) =>
      (statusFilter === "all" || booking.status === statusFilter) &&
      (query === "" ||
        booking.reference.toLowerCase().includes(query) ||
        booking.passengerName.toLowerCase().includes(query)),
  );
  const newCount = bookings.filter((booking) => booking.status === "new").length;

  // Opens the confirm dialog with the vehicles and drivers that are free for this booking's time.
  // The first free vehicle is preselected, with its usual driver when that driver is free too.
  const startConfirm = async (booking: AdminBooking) => {
    setConfirming(booking);
    setOptions(null);
    setVehicleId("");
    setDriverId("");
    setFinalPrice("");
    setConfirmError(null);
    try {
      const free = await getAssignmentOptions(booking.id);
      setOptions(free);
      const vehicle = free.vehicles[0];
      setVehicleId(vehicle?.id ?? "");
      setDriverId(usualDriver(free, vehicle?.id) ?? free.drivers[0]?.id ?? "");
    } catch (error) {
      setConfirmError(errorMessage(error));
    }
  };

  const chooseVehicle = (id: string) => {
    setVehicleId(id);
    const usual = options && usualDriver(options, id);
    if (usual) setDriverId(usual);
  };

  const confirm = async () => {
    if (!confirming) return;
    setBusyId(confirming.id);
    setConfirmError(null);
    try {
      await confirmBooking(confirming.id, {
        vehicleId,
        driverId,
        ...(confirming.quoteRequired ? { finalTotalJpy: Number(finalPrice) } : {}),
      });
      showToast(`${confirming.reference} confirmed`);
      setConfirming(null);
      await load();
    } catch (error) {
      setConfirmError(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (booking: AdminBooking) => {
    if (!window.confirm(`Cancel booking ${booking.reference} for ${booking.passengerName}? Its car and driver are released.`)) {
      return;
    }
    setBusyId(booking.id);
    try {
      await cancelBooking(booking.id);
      showToast(`${booking.reference} cancelled`);
      await load();
    } catch (error) {
      showToast(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PanelHead title={title} description={description} />

      {loadError && (
        <div className={styles.alert} role="alert">
          <span>Couldn&apos;t load bookings: {loadError}</span>
          <button className={styles.iconBtn} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search passenger or booking number…"
          aria-label="Search passenger or booking number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All statuses</option>
          <option value="new">New Request{newCount > 0 ? ` (${newCount})` : ""}</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className={styles.btnSecondary} onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Booking</th>
              <th>Passenger</th>
              <th>Route</th>
              <th>Pick-up</th>
              <th>Car type</th>
              <th>Price</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && bookings.length === 0 ? (
              <TableMessage colSpan={8}>Loading bookings…</TableMessage>
            ) : visible.length === 0 ? (
              <TableMessage colSpan={8}>
                {loadError ? "—" : bookings.length === 0 ? "No bookings yet." : "No bookings match."}
              </TableMessage>
            ) : (
              visible.map((booking) => (
                <Fragment key={booking.id}>
                  <tr>
                    <td className={styles.mono}>{booking.reference}</td>
                    <td>
                      {booking.salutation} {booking.passengerName}
                      <span className={styles.cellSub}>{booking.countryOrigin}</span>
                    </td>
                    <td>{routeText(booking)}</td>
                    <td>{pickupText(booking)}</td>
                    <td>{booking.vehicleLabel}</td>
                    <td className={styles.mono}>{priceText(booking)}</td>
                    <td>
                      <span className={badgeClass(STATUS[booking.status].variant)}>{STATUS[booking.status].label}</span>
                      {booking.status === "new" && booking.quoteRequired && (
                        <span className={styles.cellSub}>Needs a quote</span>
                      )}
                      {booking.status === "confirmed" && booking.vehicle && booking.driver && (
                        <span className={styles.cellSub}>
                          {booking.driver.fullName} · {booking.vehicle.plateNumber}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.iconBtn}
                          aria-expanded={openId === booking.id}
                          onClick={() => setOpenId(openId === booking.id ? null : booking.id)}
                        >
                          {openId === booking.id ? "Hide" : "Details"}
                        </button>
                        {booking.status === "new" && (
                          <button
                            className={styles.iconBtn}
                            onClick={() => void startConfirm(booking)}
                            disabled={busyId === booking.id}
                          >
                            Confirm
                          </button>
                        )}
                        {booking.status !== "cancelled" && (
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => void cancel(booking)}
                            disabled={busyId === booking.id}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {openId === booking.id && (
                    <tr>
                      <td colSpan={8}>
                        <BookingDetails booking={booking} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && !loadError && (
        <p className={styles.offeredNote}>
          <strong>A new request already holds a car of its type for the pick-up time.</strong>
          <span>
            Confirming assigns a specific vehicle and driver; neither can then be given to another confirmed
            booking that overlaps. Cancelling releases them. Bookings with a &ldquo;please inquire&rdquo; item
            also need your quoted price.
          </span>
        </p>
      )}

      <FormModal
        open={confirming !== null}
        title={confirming ? `Confirm ${confirming.reference}` : "Confirm booking"}
        error={confirmError}
        saving={confirming !== null && busyId === confirming.id}
        onClose={() => setConfirming(null)}
        onSubmit={() => void confirm()}
      >
        {confirming && (
          <>
            <p className={styles.fieldHint} style={{ margin: "0 0 14px" }}>
              {confirming.salutation} {confirming.passengerName} · {routeText(confirming)} · {pickupText(confirming)} ·{" "}
              {confirming.vehicleLabel}
            </p>
            {!options && !confirmError && <p className={styles.fieldHint}>Checking who is free at that time…</p>}
            {options && (
              <>
                <div className={styles.field}>
                  <label htmlFor="booking-vehicle">Vehicle</label>
                  <select
                    id="booking-vehicle"
                    required
                    value={vehicleId}
                    onChange={(e) => chooseVehicle(e.target.value)}
                  >
                    {options.vehicles.length === 0 && <option value="">No vehicle of this type is free</option>}
                    {options.vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} · {vehicle.plateNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="booking-driver">Driver</label>
                  <select id="booking-driver" required value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                    {options.drivers.length === 0 && <option value="">No driver is free</option>}
                    {options.drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.fullName}
                        {driver.id === usualDriver(options, vehicleId) ? " (usual driver)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <p className={styles.fieldHint}>
                  Only Available vehicles of this car type and Available drivers with no other confirmed trip at
                  that time are listed.
                </p>
              </>
            )}
            {confirming.quoteRequired && (
              <div className={styles.field}>
                <label htmlFor="booking-final-price">
                  Final price (¥) — customer was shown &ldquo;from {yen(confirming.totalJpy)}&rdquo;
                </label>
                <input
                  id="booking-final-price"
                  type="number"
                  required
                  min={1}
                  max={10000000}
                  step={1}
                  placeholder={`e.g. ${confirming.totalJpy}`}
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                />
              </div>
            )}
          </>
        )}
      </FormModal>
    </>
  );
}

/** The driver who normally drives this vehicle, if they are among the free drivers. */
function usualDriver(options: AssignmentOptions, vehicleId: string | undefined): string | null {
  const usual = options.vehicles.find((vehicle) => vehicle.id === vehicleId)?.usualDriverId;
  return usual && options.drivers.some((driver) => driver.id === usual) ? usual : null;
}

function BookingDetails({ booking }: { booking: AdminBooking }) {
  const ages = [
    booking.ageAdults && "adults",
    booking.ageChildren && "children (2–12)",
    booking.ageInfants && "infants (0–2)",
  ].filter(Boolean);

  const items: [string, string | null][] = [
    [booking.direction === "from_airport" ? "Drop-off address" : "Pick-up address", booking.address],
    ["Flight", booking.flightCode],
    ["Passengers", booking.passengers],
    ["Ages travelling", ages.join(", ") || null],
    ["Luggage", booking.luggage],
    ["Contact", `${booking.email} · ${booking.phoneCountryCode} ${booking.phone}`],
    ["Booked by", booking.bookerName],
    ["Payment", booking.paymentLabel],
    [
      booking.status === "cancelled" ? "Was assigned to" : "Assigned",
      booking.vehicle && booking.driver
        ? `${booking.driver.fullName} (${booking.driver.phone}) · ${booking.vehicle.model} ${booking.vehicle.plateNumber}`
        : null,
    ],
    ["Extras", booking.addOns.map((a) => `${a.label} × ${a.quantity}`).join(", ") || null],
    ["Used our service", booking.timesUsed],
    ["Other requests", booking.additionalRequests],
    ["Pets", booking.petInfo],
  ];

  return (
    <div className={styles.bookingDetails}>
      <dl>
        {items
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
      <ul aria-label="Price breakdown">
        {booking.priceLines.map((line, index) => (
          <li key={index}>
            <span>{line.label}</span>
            <span className={styles.mono}>
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
        <li className={styles.bookingTotal}>
          <span>{booking.finalTotalJpy !== null ? "Final price" : booking.quoteRequired ? "Estimated from" : "Total"}</span>
          <span className={styles.mono}>{yen(booking.finalTotalJpy ?? booking.totalJpy)}</span>
        </li>
      </ul>
    </div>
  );
}
