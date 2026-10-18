"use client";

import { useEffect, useState } from "react";
import styles from "../AdminDashboard.module.css";
import { FormModal } from "./ui";
import { changePassword, newPasswordProblem, PASSWORD_MIN_LENGTH, type Session } from "@/lib/api/auth";

interface Props {
  open: boolean;
  email: string;
  onClose: () => void;
  onChanged: (session: Session) => void;
}

/** "Change password" from the header. Other devices are signed out; this one stays signed in. */
export default function ChangePasswordModal({ open, email, onClose, onChanged }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeated, setRepeated] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Start empty every time it opens.
  useEffect(() => {
    if (!open) return;
    setCurrent("");
    setNext("");
    setRepeated("");
    setError(null);
  }, [open]);

  const save = async () => {
    const problem = newPasswordProblem(next, repeated);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onChanged(await changePassword(current, next));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change your password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      open={open}
      title="Change password"
      error={error}
      saving={saving}
      onClose={onClose}
      onSubmit={() => void save()}
    >
      <input type="hidden" name="username" autoComplete="username" value={email} readOnly />
      <div className={styles.field}>
        <label htmlFor="cp-current">Current password</label>
        <input
          id="cp-current"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>
      <div className={styles.grid2}>
        <div className={styles.field}>
          <label htmlFor="cp-new">New password</label>
          <input
            id="cp-new"
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={128}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="cp-repeat">Repeat new password</label>
          <input
            id="cp-repeat"
            type="password"
            autoComplete="new-password"
            required
            value={repeated}
            onChange={(e) => setRepeated(e.target.value)}
          />
        </div>
      </div>
      <p className={styles.fieldHint}>
        At least {PASSWORD_MIN_LENGTH} characters. You stay signed in here; other devices are signed out.
      </p>
    </FormModal>
  );
}
