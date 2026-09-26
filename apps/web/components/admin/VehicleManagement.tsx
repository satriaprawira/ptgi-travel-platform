"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../AdminDashboard.module.css";
import { FormModal, PanelHead, TableMessage, badgeClass } from "./ui";
import type { BadgeVariant } from "@/lib/adminData";
import {
  createVehicle,
  deleteVehicle,
  listVehicleClasses,
  listVehicles,
  updateVehicle,
  type Vehicle,
  type VehicleClass,
  type VehicleStatus,
} from "@/lib/api/fleet";

const STATUS: Record<VehicleStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: "Available", variant: "success" },
  maintenance: { label: "Maintenance", variant: "accent" },
  retired: { label: "Retired", variant: "muted" },
};

interface FormState {
  model: string;
  plateNumber: string;
  vehicleClassId: string;
  capacityPax: string;
  capacityBags: string;
  status: VehicleStatus;
}

const emptyForm = (classes: VehicleClass[]): FormState => ({
  model: "",
  plateNumber: "",
  vehicleClassId: classes[0]?.id ?? "",
  capacityPax: "",
  capacityBags: "",
  status: "active",
});

const formFrom = (vehicle: Vehicle): FormState => ({
  model: vehicle.model,
  plateNumber: vehicle.plateNumber,
  vehicleClassId: vehicle.vehicleClass.id,
  capacityPax: String(vehicle.capacityPax),
  capacityBags: String(vehicle.capacityBags),
  status: vehicle.status,
});

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

interface Props {
  title: string;
  description: string;
  showToast: (message: string) => void;
}

export default function VehicleManagement({ title, description, showToast }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [classes, setClasses] = useState<VehicleClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // null = modal closed; { editing: null } = adding; { editing: vehicle } = editing that vehicle.
  const [modal, setModal] = useState<{ editing: Vehicle | null } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm([]));
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [vehicleList, classList] = await Promise.all([listVehicles(), listVehicleClasses()]);
      setVehicles(vehicleList);
      setClasses(classList);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openModal = (vehicle: Vehicle | null) => {
    setForm(vehicle ? formFrom(vehicle) : emptyForm(classes));
    setFormError(null);
    setModal({ editing: vehicle });
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!modal) return;
    setSaving(true);
    setFormError(null);
    const input = {
      model: form.model,
      plateNumber: form.plateNumber,
      vehicleClassId: form.vehicleClassId,
      capacityPax: Number(form.capacityPax),
      capacityBags: Number(form.capacityBags),
      status: form.status,
    };
    try {
      if (modal.editing) {
        await updateVehicle(modal.editing.id, input);
        showToast("Vehicle updated");
      } else {
        await createVehicle(input);
        showToast("Vehicle added");
      }
      setModal(null);
      await load();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (vehicle: Vehicle) => {
    const driverNote = vehicle.assignedDriver ? ` ${vehicle.assignedDriver.fullName} will be unassigned.` : "";
    if (!window.confirm(`Delete ${vehicle.model} (${vehicle.plateNumber})?${driverNote} This cannot be undone.`)) {
      return;
    }
    setDeletingId(vehicle.id);
    try {
      await deleteVehicle(vehicle.id);
      showToast("Vehicle deleted");
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
            + Add Vehicle
          </button>
        }
      />

      {loadError && (
        <div className={styles.alert} role="alert">
          <span>Couldn&apos;t load vehicles: {loadError}</span>
          <button className={styles.iconBtn} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Plate</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Driver</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && vehicles.length === 0 ? (
              <TableMessage colSpan={7}>Loading vehicles…</TableMessage>
            ) : vehicles.length === 0 ? (
              <TableMessage colSpan={7}>{loadError ? "—" : "No vehicles yet. Add the first one."}</TableMessage>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.model}</td>
                  <td className={styles.mono}>{vehicle.plateNumber}</td>
                  <td>{vehicle.vehicleClass.name}</td>
                  <td>
                    {vehicle.capacityPax} pax · {vehicle.capacityBags} bags
                  </td>
                  <td>{vehicle.assignedDriver?.fullName ?? "—"}</td>
                  <td>
                    <span className={badgeClass(STATUS[vehicle.status].variant)}>{STATUS[vehicle.status].label}</span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <button className={styles.iconBtn} onClick={() => openModal(vehicle)}>
                        Edit
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={() => void remove(vehicle)}
                        disabled={deletingId === vehicle.id}
                      >
                        {deletingId === vehicle.id ? "Deleting…" : "Delete"}
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
        title={modal?.editing ? "Edit Vehicle" : "Add Vehicle"}
        error={formError}
        saving={saving}
        onClose={() => setModal(null)}
        onSubmit={() => void save()}
      >
        <div className={styles.field}>
          <label htmlFor="vehicle-model">Vehicle name / model</label>
          <input
            id="vehicle-model"
            required
            maxLength={100}
            placeholder="e.g. Toyota Alphard 4.0"
            value={form.model}
            onChange={(e) => set("model", e.target.value)}
          />
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="vehicle-plate">Plate number</label>
            <input
              id="vehicle-plate"
              required
              maxLength={20}
              placeholder="JP-0000"
              value={form.plateNumber}
              onChange={(e) => set("plateNumber", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="vehicle-class">Type</label>
            <select
              id="vehicle-class"
              required
              value={form.vehicleClassId}
              onChange={(e) => set("vehicleClassId", e.target.value)}
            >
              {classes.map((vehicleClass) => (
                <option key={vehicleClass.id} value={vehicleClass.id}>
                  {vehicleClass.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="vehicle-pax">Passengers</label>
            <input
              id="vehicle-pax"
              type="number"
              required
              min={1}
              max={60}
              placeholder="e.g. 4"
              value={form.capacityPax}
              onChange={(e) => set("capacityPax", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="vehicle-bags">Luggage (bags)</label>
            <input
              id="vehicle-bags"
              type="number"
              required
              min={0}
              max={60}
              placeholder="e.g. 4"
              value={form.capacityBags}
              onChange={(e) => set("capacityBags", e.target.value)}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="vehicle-status">Status</label>
          <select
            id="vehicle-status"
            value={form.status}
            onChange={(e) => set("status", e.target.value as VehicleStatus)}
          >
            {(Object.keys(STATUS) as VehicleStatus[]).map((status) => (
              <option key={status} value={status}>
                {STATUS[status].label}
              </option>
            ))}
          </select>
        </div>
      </FormModal>
    </>
  );
}
