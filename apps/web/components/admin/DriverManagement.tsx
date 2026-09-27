"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../AdminDashboard.module.css";
import { FormModal, PanelHead, TableMessage, badgeClass } from "./ui";
import type { BadgeVariant } from "@/lib/adminData";
import {
  createDriver,
  deleteDriver,
  listDrivers,
  listVehicles,
  updateDriver,
  type Driver,
  type DriverInput,
  type DriverStatus,
  type Vehicle,
} from "@/lib/api/fleet";

// "On Trip" will be derived from trip assignments once trips exist; this is the driver's own availability.
const STATUS: Record<DriverStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: "Available", variant: "success" },
  off_duty: { label: "Off Duty", variant: "muted" },
  inactive: { label: "Inactive", variant: "muted" },
};

interface FormState {
  fullName: string;
  phone: string;
  licenseNumber: string;
  vehicleId: string; // "" = unassigned
  status: DriverStatus;
}

const EMPTY_FORM: FormState = { fullName: "", phone: "", licenseNumber: "", vehicleId: "", status: "active" };

const formFrom = (driver: Driver): FormState => ({
  fullName: driver.fullName,
  phone: driver.phone,
  licenseNumber: driver.licenseNumber ?? "",
  vehicleId: driver.vehicle?.id ?? "",
  status: driver.status,
});

const toInput = (form: FormState): DriverInput => ({
  fullName: form.fullName,
  phone: form.phone,
  licenseNumber: form.licenseNumber.trim() || null,
  vehicleId: form.vehicleId || null,
  status: form.status,
});

const vehicleLabel = (vehicle: { model: string; plateNumber: string }) => `${vehicle.model} · ${vehicle.plateNumber}`;

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

interface Props {
  title: string;
  description: string;
  showToast: (message: string) => void;
}

export default function DriverManagement({ title, description, showToast }: Props) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // null = modal closed; { editing: null } = adding; { editing: driver } = editing that driver.
  const [modal, setModal] = useState<{ editing: Driver | null } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [driverList, vehicleList] = await Promise.all([listDrivers(), listVehicles()]);
      setDrivers(driverList);
      setVehicles(vehicleList);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openModal = (driver: Driver | null) => {
    setForm(driver ? formFrom(driver) : EMPTY_FORM);
    setFormError(null);
    setModal({ editing: driver });
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Free, non-retired vehicles, plus whatever the driver being edited already has.
  const editingId = modal?.editing?.id;
  const vehicleOptions = vehicles.filter((vehicle) =>
    vehicle.assignedDriver
      ? vehicle.assignedDriver.id === editingId
      : vehicle.status !== "retired",
  );

  const save = async () => {
    if (!modal) return;
    setSaving(true);
    setFormError(null);
    const input = toInput(form);
    try {
      if (modal.editing) {
        // Send only what changed, so an untouched field is never re-validated or overwritten.
        const original = toInput(formFrom(modal.editing));
        const changes = Object.fromEntries(
          Object.entries(input).filter(([key, value]) => original[key as keyof DriverInput] !== value),
        ) as Partial<DriverInput>;
        if (Object.keys(changes).length > 0) {
          await updateDriver(modal.editing.id, changes);
          showToast("Driver updated");
        }
      } else {
        await createDriver(input);
        showToast("Driver added");
      }
      setModal(null);
      await load();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (driver: Driver) => {
    if (!window.confirm(`Delete driver ${driver.fullName}? This cannot be undone.`)) return;
    setDeletingId(driver.id);
    try {
      await deleteDriver(driver.id);
      showToast("Driver deleted");
      await load();
    } catch (error) {
      showToast(errorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PanelHead
        title={title}
        description={description}
        action={
          <button className={styles.btnPrimary} onClick={() => openModal(null)} disabled={loading || !!loadError}>
            + Add Driver
          </button>
        }
      />

      {loadError && (
        <div className={styles.alert} role="alert">
          <span>Couldn&apos;t load drivers: {loadError}</span>
          <button className={styles.iconBtn} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Phone</th>
              <th>Assigned vehicle</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && drivers.length === 0 ? (
              <TableMessage colSpan={5}>Loading drivers…</TableMessage>
            ) : drivers.length === 0 ? (
              <TableMessage colSpan={5}>{loadError ? "—" : "No drivers yet. Add the first one."}</TableMessage>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id}>
                  <td>
                    {driver.fullName}
                    {driver.licenseNumber && <span className={styles.cellSub}>License {driver.licenseNumber}</span>}
                  </td>
                  <td className={styles.mono}>{driver.phone}</td>
                  <td>
                    {driver.vehicle ? (
                      <>
                        {driver.vehicle.vehicleClassName} · {driver.vehicle.plateNumber}
                        <span className={styles.cellSub}>{driver.vehicle.model}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={badgeClass(STATUS[driver.status].variant)}>{STATUS[driver.status].label}</span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.iconBtn} onClick={() => openModal(driver)}>
                        Edit
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => void remove(driver)}
                        disabled={deletingId === driver.id}
                      >
                        {deletingId === driver.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        open={modal !== null}
        title={modal?.editing ? "Edit Driver" : "Add Driver"}
        error={formError}
        saving={saving}
        onClose={() => setModal(null)}
        onSubmit={() => void save()}
      >
        <div className={styles.field}>
          <label htmlFor="driver-name">Full name</label>
          <input
            id="driver-name"
            required
            maxLength={100}
            placeholder="e.g. Ryo Yamada"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
          />
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="driver-phone">Phone</label>
            <input
              id="driver-phone"
              type="tel"
              required
              placeholder="+81 90-0000-0000"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="driver-license">License number</label>
            <input
              id="driver-license"
              maxLength={40}
              placeholder="Optional"
              value={form.licenseNumber}
              onChange={(e) => set("licenseNumber", e.target.value)}
            />
          </div>
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="driver-vehicle">Assigned vehicle</label>
            <select id="driver-vehicle" value={form.vehicleId} onChange={(e) => set("vehicleId", e.target.value)}>
              <option value="">Unassigned</option>
              {vehicleOptions.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicleLabel(vehicle)}
                  {vehicle.status === "retired" ? " (retired)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="driver-status">Status</label>
            <select
              id="driver-status"
              value={form.status}
              onChange={(e) => set("status", e.target.value as DriverStatus)}
            >
              {(Object.keys(STATUS) as DriverStatus[]).map((status) => (
                <option key={status} value={status}>
                  {STATUS[status].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormModal>
    </>
  );
}
