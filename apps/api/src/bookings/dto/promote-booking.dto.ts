import { IsBoolean, IsOptional } from 'class-validator';

export class PromoteBookingDto {
  /**
   * Move it to bookings even though no fleet car of its type is free (FT-11). It then holds no fleet
   * car; staff confirm it with a partner car, or a fleet car if one frees up.
   */
  @IsOptional()
  @IsBoolean()
  overbook?: boolean;
}
