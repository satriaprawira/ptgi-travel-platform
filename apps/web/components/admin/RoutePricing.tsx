"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../AdminDashboard.module.css";
import { FormModal, PanelHead, TableMessage, badgeClass } from "./ui";
import { yen } from "@/lib/api/format";
import { listFares, updateFare, type AdminFare, type FareUpdate } from "@/lib/api/fares";

type PriceMode = "fixed" | "quote";

interface FormState {
  zone: string;
  mode: PriceMode;
  priceJpy: string;
  minPriceJpy: string;
  isActive: boolean;
}

const formFrom = (fare: AdminFare): FormState => ({
  zone: fare.zone,
  mode: fare.priceJpy === null ? "quote" : "fixed",
  priceJpy: fare.priceJpy === null ? "" : String(fare.priceJpy),
  minPriceJpy: fare.minPriceJpy === null ? "" : String(fare.minPriceJpy),
  isActive: fare.isActive,
});

function priceText(fare: AdminFare): string {
  if (fare.priceJpy !== null) return yen(fare.priceJpy);
  return fare.minPriceJpy !== null ? `Quote · from ${yen(fare.minPriceJpy)}` : "Quote on request";
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

interface Props {
  title: string;
  description: string;
  showToast: (message: string) => void;
}

export default function RoutePricing({ title, description, showToast }: Props) {
  const [fares, setFares] = useState<AdminFare[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [airportId, setAirportId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [editing, setEditing] = useState<AdminFare | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await listFares();
      setFares(list);
      setAirportId((current) => current ?? list[0]?.airport.id ?? null);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Airports in the order the API returns them (by sort order).
  const airports = fares
    .map((fare) => fare.airport)
    .filter((airport, index, all) => all.findIndex((a) => a.id === airport.id) === index);
  const query = search.trim().toLowerCase();
  const visible = fares.filter(
    (fare) =>
      fare.airport.id === airportId &&
      (query === "" || fare.region.name.toLowerCase().includes(query) || fare.zone.toLowerCase() === query),
  );

  const openEdit = (fare: AdminFare) => {
    setEditing(fare);
    setForm(formFrom(fare));
    setFormError(null);
  };
  const closeEdit = () => {
    setEditing(null);
    setForm(null);
  };
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    if (!editing || !form) return;
    const original = formFrom(editing);
    const update: FareUpdate = {};
    if (form.zone !== original.zone) update.zone = form.zone;
    if (form.isActive !== original.isActive) update.isActive = form.isActive;
    if (form.mode === "fixed") {
      if (original.mode !== "fixed" || form.priceJpy !== original.priceJpy) update.priceJpy = Number(form.priceJpy);
    } else {
      const minPrice = form.minPriceJpy.trim() === "" ? null : Number(form.minPriceJpy);
      if (original.mode !== "quote") update.priceJpy = null;
      if (original.mode !== "quote" || form.minPriceJpy !== original.minPriceJpy) update.minPriceJpy = minPrice;
    }
    if (Object.keys(update).length === 0) {
      closeEdit();
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      // Fixed → quote sends priceJpy: null plus the "from" hint together; quote → fixed sends only the
      // price and the API clears the hint. Either way it's one UPDATE, checked as a whole.
      await updateFare(editing.id, update);
      showToast(`${editing.airport.code} ⇄ ${editing.region.name} updated`);
      closeEdit();
      await load();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (fare: AdminFare) => {
    try {
      await updateFare(fare.id, { isActive: !fare.isActive });
      showToast(`${fare.airport.code} ⇄ ${fare.region.name} ${fare.isActive ? "hidden from" : "shown in"} the booking form`);
      await load();
    } catch (error) {
      showToast(errorMessage(error));
    }
  };

  return (
    <>
      <PanelHead title={title} description={description} />

      {loadError && (
        <div className={styles.alert} role="alert">
          <span>Couldn&apos;t load route prices: {loadError}</span>
          <button className={styles.iconBtn} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.filters}>
        {airports.map((airport) => (
          <button
            key={airport.id}
            className={airport.id === airportId ? styles.btnPrimary : styles.btnSecondary}
            onClick={() => setAirportId(airport.id)}
          >
            {airport.name}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search area or zone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search area or zone"
        />
      </div>

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Zone</th>
              <th>Area</th>
              <th>Base fare (Standard car)</th>
              <th>Booking form</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && fares.length === 0 ? (
              <TableMessage colSpan={5}>Loading route prices…</TableMessage>
            ) : visible.length === 0 ? (
              <TableMessage colSpan={5}>{loadError ? "—" : "No routes match."}</TableMessage>
            ) : (
              visible.map((fare) => (
                <tr key={fare.id}>
                  <td className={styles.mono}>{fare.zone}</td>
                  <td>
                    {fare.region.name}
                    <span className={styles.cellSub}>{fare.region.inside23Wards ? "Tokyo 23 wards" : "Outside 23 wards"}</span>
                  </td>
                  <td className={styles.mono}>{priceText(fare)}</td>
                  <td>
                    <span className={badgeClass(fare.isActive ? "success" : "muted")}>
                      {fare.isActive ? "Shown" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.iconBtn} onClick={() => openEdit(fare)}>
                        Edit
                      </button>
                      <button className={styles.iconBtn} onClick={() => void toggleActive(fare)}>
                        {fare.isActive ? "Hide" : "Show"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && !loadError && (
        <p className={styles.offeredNote}>
          <strong>One price per route, both directions.</strong>
          <span>
            The fare applies from the airport to the area and back. Vehicle and time surcharges are added on top.
            A hidden route disappears from the booking form&apos;s area list for that airport.
          </span>
        </p>
      )}

      <FormModal
        open={editing !== null}
        title={editing ? `${editing.airport.name} ⇄ ${editing.region.name}` : "Edit route"}
        error={formError}
        saving={saving}
        onClose={closeEdit}
        onSubmit={() => void save()}
      >
        {form && (
          <>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label htmlFor="fare-zone">Zone</label>
                <input
                  id="fare-zone"
                  required
                  maxLength={1}
                  pattern="[A-Za-z]"
                  title="A single letter"
                  value={form.zone}
                  onChange={(e) => set("zone", e.target.value.toUpperCase())}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="fare-mode">Pricing</label>
                <select id="fare-mode" value={form.mode} onChange={(e) => set("mode", e.target.value as PriceMode)}>
                  <option value="fixed">Fixed price</option>
                  <option value="quote">Quote on request</option>
                </select>
              </div>
            </div>
            {form.mode === "fixed" ? (
              <div className={styles.field}>
                <label htmlFor="fare-price">Base fare (¥, Standard car)</label>
                <input
                  id="fare-price"
                  type="number"
                  required
                  min={1}
                  max={1000000}
                  step={1}
                  placeholder="e.g. 11000"
                  value={form.priceJpy}
                  onChange={(e) => set("priceJpy", e.target.value)}
                />
              </div>
            ) : (
              <div className={styles.field}>
                <label htmlFor="fare-min">&quot;From&quot; price shown to customers (¥, optional)</label>
                <input
                  id="fare-min"
                  type="number"
                  min={1}
                  max={1000000}
                  step={1}
                  placeholder="e.g. 13000"
                  value={form.minPriceJpy}
                  onChange={(e) => set("minPriceJpy", e.target.value)}
                />
              </div>
            )}
            <div className={styles.field}>
              <label htmlFor="fare-active">Booking form</label>
              <select
                id="fare-active"
                value={form.isActive ? "shown" : "hidden"}
                onChange={(e) => set("isActive", e.target.value === "shown")}
              >
                <option value="shown">Shown</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </>
        )}
      </FormModal>
    </>
  );
}
