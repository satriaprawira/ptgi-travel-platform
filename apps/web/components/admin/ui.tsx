"use client";

import type { FormEvent, ReactNode } from "react";
import styles from "../AdminDashboard.module.css";
import type { BadgeVariant } from "@/lib/adminData";
import { tripDateTime } from "@/lib/api/format";
import type { AssignedTrip } from "@/lib/api/fleet";

export function badgeClass(variant: BadgeVariant) {
  const variantClass = {
    indigo: styles.badgeIndigo,
    accent: styles.badgeAccent,
    success: styles.badgeSuccess,
    muted: styles.badgeMuted,
  }[variant];
  return `${styles.badge} ${variantClass}`;
}

export function PanelHead({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className={styles.panelHead}>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

/** A full-width table row for loading / empty states. */
export function TableMessage({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className={styles.tableMessage}>
        {children}
      </td>
    </tr>
  );
}

interface FormModalProps {
  open: boolean;
  title: string;
  error: string | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}

export function FormModal({ open, title, error, saving, onClose, onSubmit, children }: FormModalProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className={`${styles.modalOverlay} ${open ? styles.modalOverlayShow : ""}`}>
      <form className={styles.modal} onSubmit={submit}>
        <div className={styles.modalHead}>
          <h3>{title}</h3>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        {error && (
          <div className={styles.formError} role="alert">
            {error}
          </div>
        )}
        <div>{children}</div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

interface TripStatusProps {
  /** The vehicle's or driver's own status (Available, Maintenance, Off Duty, …). */
  own: { label: string; variant: BadgeVariant };
  /** Shown instead of `own` while a confirmed booking is in progress: "In Use" / "On Trip". */
  busyLabel: string;
  currentTrip: AssignedTrip | null;
  nextTrip: AssignedTrip | null;
}

/** Status cell for the fleet tables: own status, overridden by the trip in progress, plus the next trip. */
export function TripStatus({ own, busyLabel, currentTrip, nextTrip }: TripStatusProps) {
  return (
    <>
      <span className={badgeClass(currentTrip ? "accent" : own.variant)}>{currentTrip ? busyLabel : own.label}</span>
      {currentTrip && (
        <span className={styles.cellSub}>
          {currentTrip.reference} · until {currentTrip.untilTime}
        </span>
      )}
      {nextTrip && (
        <span className={styles.cellSub}>
          Next: {tripDateTime(nextTrip.pickupDate, nextTrip.pickupTime)} · {nextTrip.reference}
        </span>
      )}
    </>
  );
}
