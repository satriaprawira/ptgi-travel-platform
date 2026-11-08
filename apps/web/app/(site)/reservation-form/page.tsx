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
