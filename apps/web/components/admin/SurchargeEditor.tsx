"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import styles from "../AdminDashboard.module.css";
import { FormModal, PanelHead, badgeClass } from "./ui";
import { windowText, yen } from "@/lib/api/format";
import {
  listSurcharges,
  updateSurcharge,
  type AddOnCost,
  type LeadTimeSurcharge,
  type PaymentFee,
  type SurchargeKind,
  type Surcharges,
  type TimeSurcharge,
  type VehicleSurcharge,
} from "@/lib/api/surcharges";

/** The row being edited, tagged with its list. */
type Editing =
  | { kind: "vehicle-types"; row: VehicleSurcharge }
  | { kind: "pickup-times"; row: TimeSurcharge }
  | { kind: "last-minute"; row: LeadTimeSurcharge }
  | { kind: "add-ons"; row: AddOnCost }
  | { kind: "payment-methods"; row: PaymentFee };

/** All modal inputs as strings (what <input> gives back); only the ones the kind uses are shown. */
interface Fields {
  label: string;
  amount: string;
  inquire: boolean; // vehicle types: "please inquire" instead of an amount
  startsAt: string;
  endsAt: string;
  withinHours: string;
  freeQuantity: string;
  maxQuantity: string;
  isActive: boolean;
}

function fieldsFrom(editing: Editing): Fields {
  const blank: Fields = {
    label: "",
    amount: "",
    inquire: false,
    startsAt: "",
    endsAt: "",
    withinHours: "",
    freeQuantity: "",
    maxQuantity: "",
    isActive: true,
  };
  switch (editing.kind) {
    case "vehicle-types":
      return {
        ...blank,
        amount: editing.row.surchargeJpy === null ? "" : String(editing.row.surchargeJpy),
        inquire: editing.row.surchargeJpy === null,
      };
    case "pickup-times":
      return {
        ...blank,
        label: editing.row.label,
        amount: String(editing.row.amountJpy),
        startsAt: editing.row.startsAt,
        endsAt: editing.row.endsAt,
        isActive: editing.row.isActive,
      };
    case "last-minute":
      return {
        ...blank,
        label: editing.row.label,
        amount: String(editing.row.amountJpy),
        withinHours: String(editing.row.withinHours),
        isActive: editing.row.isActive,
      };
    case "add-ons":
      return {
        ...blank,
        label: editing.row.label,
        amount: String(editing.row.priceJpy),
        freeQuantity: String(editing.row.freeQuantity),
        maxQuantity: String(editing.row.maxQuantity),
        isActive: editing.row.isActive,
      };
    case "payment-methods":
      return { ...blank, amount: String(editing.row.feeJpy) };
  }
}

/** The PATCH body: only fields that changed, converted to the API's types. */
function changes(editing: Editing, before: Fields, after: Fields): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  const changed = (key: keyof Fields) => before[key] !== after[key];
  const num = (value: string) => Number(value);

  switch (editing.kind) {
    case "vehicle-types":
      if (changed("inquire") || changed("amount")) update.surchargeJpy = after.inquire ? null : num(after.amount);
      break;
    case "pickup-times":
      if (changed("label")) update.label = after.label;
      if (changed("startsAt")) update.startsAt = after.startsAt;
      if (changed("endsAt")) update.endsAt = after.endsAt;
      if (changed("amount")) update.amountJpy = num(after.amount);
      if (changed("isActive")) update.isActive = after.isActive;
      break;
    case "last-minute":
      if (changed("label")) update.label = after.label;
      if (changed("withinHours")) update.withinHours = num(after.withinHours);
      if (changed("amount")) update.amountJpy = num(after.amount);
      if (changed("isActive")) update.isActive = after.isActive;
      break;
    case "add-ons":
      if (changed("label")) update.label = after.label;
      if (changed("amount")) update.priceJpy = num(after.amount);
      if (changed("freeQuantity")) update.freeQuantity = num(after.freeQuantity);
      if (changed("maxQuantity")) update.maxQuantity = num(after.maxQuantity);
      if (changed("isActive")) update.isActive = after.isActive;
      break;
    case "payment-methods":
      if (changed("amount")) update.feeJpy = num(after.amount);
      break;
  }
  return update;
}

const titleOf = (editing: Editing) =>
  editing.kind === "payment-methods" && editing.row.description
    ? `${editing.row.label} (${editing.row.description})`
    : editing.row.label;

const ActiveBadge = ({ active }: { active: boolean }) => (
  <span className={badgeClass(active ? "success" : "muted")}>{active ? "On" : "Off"}</span>
);

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

interface Props {
  title: string;
  description: string;
  showToast: (message: string) => void;
}

export default function SurchargeEditor({ title, description, showToast }: Props) {
  const [data, setData] = useState<Surcharges | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Editing | null>(null);
  const [fields, setFields] = useState<Fields | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setData(await listSurcharges());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (next: Editing) => {
    setEditing(next);
    setFields(fieldsFrom(next));
    setFormError(null);
  };
  const closeEdit = () => {
    setEditing(null);
    setFields(null);
  };
  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setFields((prev) => (prev ? { ...prev, [key]: value } : prev));

  const save = async () => {
    if (!editing || !fields) return;
    const update = changes(editing, fieldsFrom(editing), fields);
    if (Object.keys(update).length === 0) {
      closeEdit();
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      setData(await updateSurcharge(editing.kind, editing.row.id, update));
      showToast(`${titleOf(editing)} updated`);
      closeEdit();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (kind: SurchargeKind, row: { id: string; label: string; isActive: boolean }) => {
    try {
      setData(await updateSurcharge(kind, row.id, { isActive: !row.isActive }));
      showToast(`${row.label} turned ${row.isActive ? "off" : "on"}`);
    } catch (error) {
      showToast(errorMessage(error));
    }
  };

  const editButton = (next: Editing) => (
    <button className={styles.iconBtn} onClick={() => openEdit(next)}>
      Edit
    </button>
  );
  const toggleButton = (kind: SurchargeKind, row: { id: string; label: string; isActive: boolean }) => (
    <button className={styles.iconBtn} onClick={() => void toggle(kind, row)}>
      {row.isActive ? "Turn off" : "Turn on"}
    </button>
  );

  return (
    <>
      <PanelHead title={title} description={description} />

      {loadError && (
        <div className={styles.alert} role="alert">
          <span>Couldn&apos;t load surcharges: {loadError}</span>
          <button className={styles.iconBtn} onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}
      {loading && !data && <p className={styles.offeredNote}>Loading surcharges…</p>}

      {data && (
        <>
          <Section title="Vehicle" sub="Added to the route fare for the car type the customer picks.">
            <Table head={["Car type", "Surcharge", ""]}>
              {data.vehicleTypes.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td className={styles.mono}>
                    {row.surchargeJpy === null ? "Please inquire" : row.surchargeJpy === 0 ? "—" : `+${yen(row.surchargeJpy)}`}
                  </td>
                  <td>
                    <div className={styles.rowActions}>{editButton({ kind: "vehicle-types", row })}</div>
                  </td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Pickup time" sub="By scheduled pickup time, Japan time. Windows can't overlap.">
            <Table head={["Surcharge", "Window", "Amount", "Status", ""]}>
              {data.timeSurcharges.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td className={styles.mono}>{row.windowText}</td>
                  <td className={styles.mono}>+{yen(row.amountJpy)}</td>
                  <td>
                    <ActiveBadge active={row.isActive} />
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {editButton({ kind: "pickup-times", row })}
                      {toggleButton("pickup-times", row)}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Last-minute booking" sub="When the booking is made shortly before the pickup.">
            <Table head={["Surcharge", "Applies when booked", "Amount", "Status", ""]}>
              {data.leadTimeSurcharges.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>less than {row.withinHours} hours before pickup</td>
                  <td className={styles.mono}>+{yen(row.amountJpy)}</td>
                  <td>
                    <ActiveBadge active={row.isActive} />
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {editButton({ kind: "last-minute", row })}
                      {toggleButton("last-minute", row)}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Extras" sub="Optional services customers select in the booking form. Off = not offered.">
            <Table head={["Extra", "Price", "Included free", "Max per booking", "Status", ""]}>
              {data.addOns.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td className={styles.mono}>+{yen(row.priceJpy)} each</td>
                  <td>{row.freeQuantity === 0 ? "—" : row.freeQuantity}</td>
                  <td>{row.maxQuantity}</td>
                  <td>
                    <ActiveBadge active={row.isActive} />
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      {editButton({ kind: "add-ons", row })}
                      {toggleButton("add-ons", row)}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </Section>

          <Section title="Payment" sub="Fee for the payment method the customer picks.">
            <Table head={["Payment method", "Fee", ""]}>
              {data.paymentMethods.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.label}
                    {row.description && <span className={styles.cellSub}>{row.description}</span>}
                  </td>
                  <td className={styles.mono}>{row.feeJpy === 0 ? "—" : `+${yen(row.feeJpy)}`}</td>
                  <td>
                    <div className={styles.rowActions}>{editButton({ kind: "payment-methods", row })}</div>
                  </td>
                </tr>
              ))}
            </Table>
          </Section>
        </>
      )}

      <FormModal
        open={editing !== null}
        title={editing ? titleOf(editing) : "Edit surcharge"}
        error={formError}
        saving={saving}
        onClose={closeEdit}
        onSubmit={() => void save()}
      >
        {editing && fields && <ModalFields kind={editing.kind} fields={fields} set={set} />}
      </FormModal>
    </>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className={styles.card}>
      <h2>{title}</h2>
      <div className={styles.cardSub}>{sub}</div>
      {children}
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {head.map((label, index) => (
              <th key={index}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface ModalFieldsProps {
  kind: SurchargeKind;
  fields: Fields;
  set: <K extends keyof Fields>(key: K, value: Fields[K]) => void;
}

function ModalFields({ kind, fields, set }: ModalFieldsProps) {
  const yenInput = (id: string, label: string, required = true) => (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        required={required}
        min={0}
        max={1000000}
        step={1}
        value={fields.amount}
        onChange={(e) => set("amount", e.target.value)}
      />
    </div>
  );
  const labelInput = (
    <div className={styles.field}>
      <label htmlFor="sc-label">Name shown to customers</label>
      <input
        id="sc-label"
        required
        maxLength={80}
        value={fields.label}
        onChange={(e) => set("label", e.target.value)}
      />
    </div>
  );
  const activeSelect = (
    <div className={styles.field}>
      <label htmlFor="sc-active">Status</label>
      <select
        id="sc-active"
        value={fields.isActive ? "on" : "off"}
        onChange={(e) => set("isActive", e.target.value === "on")}
      >
        <option value="on">On</option>
        <option value="off">Off</option>
      </select>
    </div>
  );

  switch (kind) {
    case "vehicle-types":
      return (
        <>
          <div className={styles.field}>
            <label htmlFor="sc-mode">Pricing</label>
            <select
              id="sc-mode"
              value={fields.inquire ? "inquire" : "fixed"}
              onChange={(e) => set("inquire", e.target.value === "inquire")}
            >
              <option value="fixed">Fixed surcharge</option>
              <option value="inquire">Please inquire (staff quote it)</option>
            </select>
          </div>
          {!fields.inquire && yenInput("sc-amount", "Surcharge (¥, 0 for none)")}
        </>
      );
    case "pickup-times":
      return (
        <>
          {labelInput}
          <p className={styles.fieldHint}>
            Customers see: &ldquo;{fields.label || "…"}
            {fields.startsAt && fields.endsAt && fields.startsAt !== fields.endsAt
              ? ` (${windowText(fields.startsAt, fields.endsAt)})`
              : ""}
            &rdquo;. The times are added automatically.
          </p>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="sc-start">From (Japan time)</label>
              <input
                id="sc-start"
                type="time"
                required
                value={fields.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="sc-end">Until (not included)</label>
              <input
                id="sc-end"
                type="time"
                required
                value={fields.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
              />
            </div>
          </div>
          <div className={styles.grid2}>
            {yenInput("sc-amount", "Amount (¥)")}
            {activeSelect}
          </div>
        </>
      );
    case "last-minute":
      return (
        <>
          {labelInput}
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="sc-hours">Booked less than … hours before pickup</label>
              <input
                id="sc-hours"
                type="number"
                required
                min={1}
                max={720}
                step={1}
                value={fields.withinHours}
                onChange={(e) => set("withinHours", e.target.value)}
              />
            </div>
            {yenInput("sc-amount", "Amount (¥)")}
          </div>
          {activeSelect}
        </>
      );
    case "add-ons":
      return (
        <>
          {labelInput}
          <div className={styles.grid2}>
            {yenInput("sc-amount", "Price each (¥)")}
            {activeSelect}
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="sc-free">Included free</label>
              <input
                id="sc-free"
                type="number"
                required
                min={0}
                max={10}
                step={1}
                value={fields.freeQuantity}
                onChange={(e) => set("freeQuantity", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="sc-max">Max per booking</label>
              <input
                id="sc-max"
                type="number"
                required
                min={1}
                max={10}
                step={1}
                value={fields.maxQuantity}
                onChange={(e) => set("maxQuantity", e.target.value)}
              />
            </div>
          </div>
        </>
      );
    case "payment-methods":
      return yenInput("sc-amount", "Fee (¥, 0 for none)");
  }
}
