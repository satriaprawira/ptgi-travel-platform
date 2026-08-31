import ReservationForm from "@/components/ReservationForm";

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden="true">
             <image href="/logo/goal-intl-logo.png" width="60" height="60"/>
          </svg>
          <div>
            Goal International Co., Ltd
            <span className="sub">Private airport pickups across Japan</span>
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
