import { IsIn, IsInt, IsOptional, IsUUID, Matches, Max, Min } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The new pickup time to check (FT-10): GET /admin/bookings/:id/reschedule-preview?pickupDate=&pickupTime= */
export class ReschedulePreviewQueryDto {
  @Matches(DATE, { message: 'pickupDate must be a date such as 2026-10-01' })
  pickupDate: string;

  @Matches(TIME, { message: 'pickupTime must be a 24-hour time such as 14:30' })
  pickupTime: string;
}

/** Moves a new or confirmed booking to another time (FT-10). */
export class RescheduleBookingDto extends ReschedulePreviewQueryDto {
  /** Confirmed fleet trips only: the vehicle and driver at the new time. Omitted = keep the current ones. */
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;

  /** Keep the booking's current price, or take the price recalculated for the new time. */
  @IsIn(['keep', 'new'])
  priceChoice: 'keep' | 'new';

  /** Confirmed quote-required bookings only: a new quoted price. Omitted = keep the current one. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  finalTotalJpy?: number;
}
