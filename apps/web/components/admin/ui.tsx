"use client";

import type { FormEvent, ReactNode } from "react";
import styles from "../AdminDashboard.module.css";
import type { BadgeVariant } from "@/lib/adminData";

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
