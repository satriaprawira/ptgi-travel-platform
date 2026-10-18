"use client";

import { useState } from "react";
import styles from "./LoginForm.module.css";
import { changePassword, newPasswordProblem, PASSWORD_MIN_LENGTH, type Session } from "@/lib/api/auth";

interface Props {
  session: Session;
  onChanged: (session: Session) => void;
  onSignOut: () => void;
}

/** Shown instead of the admin while the user still has a temporary password (new account or reset). */
export default function ChangePasswordForm({ session, onChanged, onSignOut }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeated, setRepeated] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      setSaving(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.brandPanel}>
        <div className={styles.brand}>Goal International Co., Ltd</div>
        <div>
          <h1>Welcome, {session.fullName}</h1>
          <p>You signed in with a temporary password. Choose your own to continue.</p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.authCard}>
          <h2>Set your password</h2>
          <p className={styles.authSub}>
            At least {PASSWORD_MIN_LENGTH} characters. A short sentence is easy to remember and hard to guess.
          </p>

          <form onSubmit={(event) => void submit(event)}>
            {error && (
              <div className={styles.formError} role="alert">
                {error}
              </div>
            )}
            {/* Lets password managers save the new password under the right account. */}
            <input type="hidden" name="username" autoComplete="username" value={session.email} readOnly />

            <div className={styles.field}>
              <label htmlFor="current-password">Temporary password</label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
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
              <label htmlFor="repeat-password">Repeat new password</label>
              <input
                id="repeat-password"
                type="password"
                autoComplete="new-password"
                required
                value={repeated}
                onChange={(e) => setRepeated(e.target.value)}
              />
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? "Saving…" : "Save and continue"}
            </button>
          </form>

          <p className={styles.helpLine}>
            Not {session.fullName}?{" "}
            <button type="button" className={styles.linkBtn} onClick={onSignOut}>
              Sign out
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
