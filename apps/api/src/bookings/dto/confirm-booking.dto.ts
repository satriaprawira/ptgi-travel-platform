import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ConfirmBookingDto {
  /** The vehicle that will do this trip: Available, of the booked type, and free at that time. */
  @IsUUID()
  vehicleId: string;

  /** The driver for this trip: active and free at that time. */
  @IsUUID()
  driverId: string;

  /** The price staff quoted. Required when the booking is "quote required", not accepted otherwise. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  finalTotalJpy?: number;
}
