import ReservationForm from "@/components/ReservationForm";

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <circle cx="13" cy="13" r="12" stroke="#14213D" strokeWidth="1.4" />
            <path d="M13 4v18M4 13h18" stroke="#14213D" strokeWidth="1.4" />
            <path
              d="M13 4c3 2.5 4.6 6 4.6 9s-1.6 6.5-4.6 9c-3-2.5-4.6-6-4.6-9S10 6.5 13 4z"
              stroke="#C9462C"
              strokeWidth="1.4"
            />
          </svg>
          <div>
            NRT ⇄ HND Transfers
            <span className="sub">Private airport pickups across Tokyo</span>
          </div>
        </div>
        <a className="help-link" href="#">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 18h.01M8 9a4 4 0 118 0c0 2-2 2.5-3 3.5-.6.6-1 1.2-1 2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Need help? Chat with us
        </a>
      </header>

      <div className="hero">
        <h1>Reserve your airport pickup</h1>
        <p>
          Tell us your flight and where you&apos;re headed. A driver will be waiting at arrivals with your name on a
          sign.
        </p>
      </div>

      <ReservationForm />
    </>
  );
}
