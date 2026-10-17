"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../AdminDashboard.module.css";
import { PanelHead, badgeClass } from "./ui";
import { tripDateTime, yen } from "@/lib/api/format";
import { getSchedule, type AdminBooking } from "@/lib/api/bookings";
import { listDrivers, listVehicles, type Driver, type Vehicle } from "@/lib/api/fleet";

const DAY_MS = 24 * 3_600_000;
const TOKYO_OFFSET_MS = 9 * 3_600_000; // Japan has no daylight saving time
const HOUR_PX = 44;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today's date in Tokyo as "YYYY-MM-DD", whatever time zone the browser is in. */
const todayInTokyo = () => new Date(Date.now() + TOKYO_OFFSET_MS).toISOString().slice(0, 10);

// Dates are handled as plain "YYYY-MM-DD" strings; UTC is only used to do calendar arithmetic on them.
const shiftDate = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** The Monday of the week that contains `date`. */
function weekStart(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return shiftDate(date, -((weekday + 6) % 7));
}

const dayParts = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  return { weekday: WEEKDAYS[d.getUTCDay()], day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()], year: d.getUTCFullYear() };
};

/** "12 – 18 Oct 2026", or "28 Sep – 4 Oct 2026" across months. */
function weekTitle(start: string): string {
  const a = dayParts(start);
  const b = dayParts(shiftDate(start, 6));
  return a.month === b.month ? `${a.day} – ${b.day} ${b.month} ${b.year}` : `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
}

/** The Tokyo clock time ("17:30") of an ISO timestamp. */
const tokyoTime = (iso: string) => new Date(Date.parse(iso) + TOKYO_OFFSET_MS).toISOString().slice(11, 16);

const routeText = (booking: AdminBooking) =>
  booking.direction === "from_airport"
    ? `${booking.airport.name} → ${booking.regionName}`
    : `${booking.regionName} → ${booking.airport.name}`;

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

/** The part of one booking that falls on one day, placed like a calendar event. */
interface Segment {
  booking: AdminBooking;
  /** Position within the day, 0–1. */
  start: number;
  end: number;
  /** Side-by-side placement among bookings that overlap in time. */
  column: number;
  columns: number;
}

/** Lays out a day's bookings: those that overlap in time share the width, side by side. */
function layOutDay(bookings: AdminBooking[], date: string): Segment[] {
  const dayStart = Date.parse(`${date}T00:00:00+09:00`);
  const segments = bookings
    .map((booking) => ({
      booking,
      start: Math.max((Date.parse(booking.pickupAt) - dayStart) / DAY_MS, 0),
      end: Math.min((Date.parse(booking.holdUntil) - dayStart) / DAY_MS, 1),
      column: 0,
      columns: 1,
    }))
    .filter((segment) => segment.end > segment.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  // A cluster is a run of segments connected by overlaps; its segments split the day's width equally.
  let cluster: Segment[] = [];
  let clusterEnd = 0;
  let columnEnds: number[] = [];
  const closeCluster = () => {
    for (const segment of cluster) segment.columns = columnEnds.length;
  };
  for (const segment of segments) {
    if (cluster.length > 0 && segment.start >= clusterEnd) {
      closeCluster();
      cluster = [];
      columnEnds = [];
    }
    let column = columnEnds.findIndex((end) => end <= segment.start);
    if (column === -1) column = columnEnds.length;
    columnEnds[column] = segment.end;
    segment.column = column;
    cluster.push(segment);
    clusterEnd = Math.max(clusterEnd, segment.end);
  }
  closeCluster();
  return segments;
}

interface Hovered {
  booking: AdminBooking;
  /** Viewport position of the block the card is attached to. */
  x: number;
  y: number;
}

/** Details card shown while a calendar block is hovered or focused. */
function BookingCard({ hovered }: { hovered: Hovered }) {
  const { booking } = hovered;
  const confirmed = booking.status === "confirmed";
  // Keep the card on screen: flip to the left / upwards near the right and bottom edges.
  const left = hovered.x + 300 > window.innerWidth ? Math.max(hovered.x - 300, 8) : hovered.x;
  const top = Math.min(hovered.y, window.innerHeight - 250);
  return (
    <div className={styles.calCard} style={{ left, top }} role="tooltip">
      <div className={styles.calCardHead}>
        <span className={styles.mono}>{booking.reference}</span>
        <span className={badgeClass(confirmed ? "success" : "indigo")}>{confirmed ? "Confirmed" : "New Request"}</span>
      </div>
      <strong>
        {booking.salutation} {booking.passengerName}
      </strong>
      <dl>
        <dt>When</dt>
        <dd>
          {tripDateTime(booking.pickupDate, booking.pickupTime)} – {tokyoTime(booking.holdUntil)}
        </dd>
        <dt>Route</dt>
        <dd>{routeText(booking)}</dd>
        <dt>Address</dt>
        <dd>{booking.address}</dd>
        <dt>Vehicle</dt>
        <dd>
          {booking.vehicle
            ? `${booking.vehicle.model} · ${booking.vehicle.plateNumber}`
            : `${booking.vehicleLabel} (not assigned yet)`}
        </dd>
        {booking.driver && (
          <>
            <dt>Driver</dt>
            <dd>
              {booking.driver.fullName} · {booking.driver.phone}
            </dd>
          </>
        )}
        <dt>Party</dt>
        <dd>
          {booking.passengers} · {booking.luggage}
        </dd>
        <dt>Price</dt>
        <dd>
          {booking.finalTotalJpy !== null
            ? yen(booking.finalTotalJpy)
            : `${booking.quoteRequired ? "from " : ""}${yen(booking.totalJpy)}`}{" "}
          · {booking.paymentLabel}
        </dd>
      </dl>
    </div>
  );
}

interface Props {
  title: string;
  description: string;
}

export default function AvailabilityCalendar({ title, description }: Props) {
  const [week, setWeek] = useState(() => weekStart(todayInTokyo()));
  const [schedule, setSchedule] = useState<AdminBooking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [vehicleFilter, setVehicleFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [showHolds, setShowHolds] = useState(false);
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [bookings, fleet, people] = await Promise.all([getSchedule(week, 7), listVehicles(), listDrivers()]);
      setSchedule(bookings);
      setVehicles(fleet);
      setDrivers(people);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => {
    void load();
  }, [load]);

  // Open on the working day (06:00) instead of midnight.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 6 * HOUR_PX;
  }, []);

  const today = todayInTokyo();
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(week, index));
  const nowPosition = (Date.now() - Date.parse(`${today}T00:00:00+09:00`)) / DAY_MS;

  // Filtering by vehicle or driver only makes sense for confirmed trips, which have both assigned.
  const shown = schedule.filter((booking) => {
    if (booking.status === "confirmed") {
      return (
        (vehicleFilter === "" || booking.vehicle?.id === vehicleFilter) &&
        (driverFilter === "" || booking.driver?.id === driverFilter)
      );
    }
    return showHolds && vehicleFilter === "" && driverFilter === "";
  });
  const confirmedCount = schedule.filter((booking) => booking.status === "confirmed").length;
  const holdCount = schedule.length - confirmedCount;

  const showCard = (booking: AdminBooking, element: HTMLElement) => {
    const box = element.getBoundingClientRect();
    setHovered({ booking, x: box.right + 8, y: box.top });
  };

  return (
    <>
      <PanelHead title={title} description={description} />

      {loadError && (
        <div className={styles.alert} role="alert">
          <span>Couldn&apos;t load the schedule: {loadError}</span>
          <button className={styles.iconBtn} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.calToolbar}>
          <h2>{weekTitle(week)}</h2>
          <div className={styles.filters} style={{ marginBottom: 0 }}>
            <button className={styles.btnSecondary} onClick={() => setWeek(shiftDate(week, -7))} aria-label="Previous week">
              ←
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => setWeek(weekStart(today))}
              disabled={week === weekStart(today)}
            >
              Today
            </button>
            <button className={styles.btnSecondary} onClick={() => setWeek(shiftDate(week, 7))} aria-label="Next week">
              →
            </button>
            <input
              type="date"
              className={styles.dateInput}
              aria-label="Go to the week of"
              value={week}
              onChange={(e) => e.target.value && setWeek(weekStart(e.target.value))}
            />
            <select aria-label="Vehicle" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
              <option value="">All vehicles</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plateNumber} · {vehicle.model}
                </option>
              ))}
            </select>
            <select aria-label="Driver" value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)}>
              <option value="">All drivers</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.fullName}
                </option>
              ))}
            </select>
            <button className={styles.btnSecondary} onClick={() => void load()} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>
        <div className={styles.cardSub}>
          {loading ? "Loading…" : `${confirmedCount} confirmed ${confirmedCount === 1 ? "trip" : "trips"} this week`}, Japan
          time. Hover a block for details.
          <label className={styles.calToggle}>
            <input type="checkbox" checked={showHolds} onChange={(e) => setShowHolds(e.target.checked)} /> Also show new
            requests not confirmed yet ({holdCount})
          </label>
        </div>

        <div className={styles.calScroll} ref={scrollRef} onScroll={() => setHovered(null)}>
          <div className={styles.calGrid}>
            <div className={styles.calCorner} />
            {days.map((date) => {
              const parts = dayParts(date);
              return (
                <div key={date} className={`${styles.calDayHead} ${date === today ? styles.calToday : ""}`}>
                  {parts.weekday} <strong>{parts.day}</strong>
                </div>
              );
            })}

            <div className={styles.calHours} style={{ height: 24 * HOUR_PX }}>
              {HOURS.map((hour) => (
                <span key={hour} style={{ top: hour * HOUR_PX }}>
                  {String(hour).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {days.map((date) => (
              <div
                key={date}
                className={`${styles.calDay} ${date === today ? styles.calDayToday : ""}`}
                style={{ height: 24 * HOUR_PX, backgroundSize: `100% ${HOUR_PX}px` }}
              >
                {date === today && <div className={styles.calNow} style={{ top: `${nowPosition * 100}%` }} aria-hidden="true" />}
                {layOutDay(shown, date).map(({ booking, start, end, column, columns }) => {
                  const startsEarlier = booking.pickupDate !== date;
                  return (
                    <button
                      key={booking.id}
                      type="button"
                      className={`${styles.calBlock} ${booking.status === "confirmed" ? "" : styles.calBlockHold}`}
                      style={{
                        top: `${start * 100}%`,
                        height: `${(end - start) * 100}%`,
                        left: `calc(${(column / columns) * 100}% + 2px)`,
                        width: `calc(${100 / columns}% - 4px)`,
                      }}
                      onMouseEnter={(e) => showCard(booking, e.currentTarget)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={(e) => showCard(booking, e.currentTarget)}
                      onBlur={() => setHovered(null)}
                      aria-label={`${booking.reference}, ${booking.passengerName}, ${tripDateTime(booking.pickupDate, booking.pickupTime)}`}
                    >
                      {/* Side-by-side blocks are too narrow for the full range. */}
                      <b>
                        {startsEarlier ? "…" : booking.pickupTime}
                        {columns === 1 || startsEarlier ? `–${tokyoTime(booking.holdUntil)}` : ""}
                      </b>
                      <span>{booking.vehicle ? booking.vehicle.plateNumber : booking.vehicleClassName}</span>
                      <span>{booking.driver ? booking.driver.fullName : "Not assigned"}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {hovered && <BookingCard hovered={hovered} />}

    </>
  );
}
