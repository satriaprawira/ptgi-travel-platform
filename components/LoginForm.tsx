"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LoginForm.module.css";

export default function LoginForm() {
  const [isSignup, setIsSignup] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    showToast(isSignup ? "Account created – mockup only" : "Logged in – mockup only");
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.brandPanel}>
        <div className={styles.brand}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden="true">
             <image href="/logo/goal-intl-logo.png" width="60" height="60"/>
          </svg>
          Goal International Co., Ltd
        </div>

        <div>
          <h1>Sign in to manage your pickup</h1>
          <p>
            Access your reservations, track your driver, and book your next airport transfer
            across Tokyo.
          </p>

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
          <h2>{isSignup ? "Create your account" : "Welcome back"}</h2>
          <p className={styles.authSub}>
            {isSignup
              ? "Sign up to start booking your airport pickups"
              : "Log in to continue to your account"}
          </p>

          <button
            type="button"
            className={styles.googleBtn}
            onClick={() => showToast("Google sign-in – mockup only")}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.581C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </button>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <div className={styles.field}>
                <label htmlFor="fullName">Full name</label>
                <input type="text" id="fullName" placeholder="Your full name" />
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="you@example.com" required />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="••••••••" required />
            </div>

            {isSignup && (
              <div className={styles.field}>
                <label htmlFor="confirmPassword">Confirm password</label>
                <input type="password" id="confirmPassword" placeholder="••••••••" />
              </div>
            )}

            {!isSignup && (
              <div className={styles.rowBetween}>
                <label className={styles.remember}>
                  <input type="checkbox" /> Remember me
                </label>
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    showToast("Password reset – mockup only");
                  }}
                >
                  Forgot password?
                </a>
              </div>
            )}

            <button type="submit" className={styles.btnPrimary}>
              {isSignup ? "Create account" : "Log in"}
            </button>

            {isSignup && (
              <p className={styles.terms}>
                By creating an account, you agree to our <a href="#">Terms</a> and{" "}
                <a href="#">Privacy Policy</a>.
              </p>
            )}
          </form>

          <p className={styles.switchLine}>
            {isSignup ? (
              <>
                Already have an account?{" "}
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setIsSignup(false);
                  }}
                >
                  Log in
                </a>
              </>
            ) : (
              <>
                Not a member?{" "}
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setIsSignup(true);
                  }}
                >
                  Sign Up
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.show : ""}`}>{toast}</div>
    </div>
  );
}
