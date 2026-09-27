import ReservationForm from "@/components/ReservationForm";
import { getReservationOptions, type ReservationOptions } from "@/lib/api/reservation";

// Rendered per request, not at build time: vehicle types, prices and add-ons come from the API and
// staff can change them any time. It also keeps `next build` from depending on the API being up.
export const dynamic = "force-dynamic";

export default async function ReservationFormPage() {
  let options: ReservationOptions | null = null;
  try {
    options = await getReservationOptions();
  } catch (error) {
    console.error("Reservation options unavailable:", error);
  }

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

      {options && options.vehicleTypes.length > 0 ? (
        <ReservationForm options={options} />
      ) : (
        <div className="unavailable card" role="alert">
          <h2>Online booking is temporarily unavailable</h2>
          <p>
            {options
              ? "All our vehicles are currently unavailable for online booking."
              : "We couldn't load today's vehicles and prices."}{" "}
            Please try again later, or chat with us and we&apos;ll book your pickup for you.
          </p>
        </div>
      )}
    </>
  );
}
