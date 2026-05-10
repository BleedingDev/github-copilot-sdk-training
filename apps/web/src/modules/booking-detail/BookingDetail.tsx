import type { BookingDetail } from "./types";

type BookingDetailProps = {
  readonly booking: BookingDetail;
};

export function BookingDetailView({ booking }: BookingDetailProps) {
  return (
    <section>
      <h1>Booking {booking.id}</h1>
      <p>{booking.travelerName}</p>

      <ol>
        {booking.segments.map((segment) => (
          <li key={segment.id}>
            <strong>
              {segment.origin} - {segment.destination}
            </strong>
            <span>Fare family: {segment.fareFamily}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
