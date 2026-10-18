"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./LoginForm.module.css";
import { login } from "@/lib/api/auth";

/** Where to go after signing in: ?next=/admin, only ever a path on this site. */
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

/** Staff sign-in. Accounts are created by an admin in User Management; customers don't sign in. */
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("expired") === "1") {
      setError("Your session has ended. Please sign in again.");
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // With a temporary password, the admin asks for a new one before showing anything else.
      await login(email, password);
      router.replace(nextPath());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.brandPanel}>
        <div className={styles.brand}>Goal International Co., Ltd</div>

        <div>
          <h1>Staff sign-in</h1>
          <p>Bookings, fleet, drivers and pricing for our Tokyo airport transfers, in one place.</p>

          <div className={styles.miniTicket}>
            <div className={styles.mtBrand}>NRT–HND · E-Ticket</div>
            <div className={styles.mtRoute}>
              <span>Narita</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 12h16M14 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Shibuya</span>
            </div>
            <div className={styles.mtPerf} />
            <div className={styles.mtBarcode} />
          </div>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.authCard}>
          <h2>Welcome back</h2>
          <p className={styles.authSub}>Sign in with the account an admin created for you.</p>

          <form onSubmit={(event) => void handleSubmit(event)}>
            {error && (
              <div className={styles.formError} role="alert">
                {error}
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className={styles.helpLine}>Forgot your password? Ask an admin to reset it.</p>
        </div>
      </div>
    </div>
  );
}
