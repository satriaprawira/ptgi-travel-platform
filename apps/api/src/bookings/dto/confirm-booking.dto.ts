import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { trim, trimToNull } from '../../common/transforms.js';

/** A partner (outsourced) car doing the trip instead of a fleet car (FT-11). */
export class PartnerVehicleDto {
  /** e.g. "Toyota Alphard · Tokyo Limo Co." */
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  vehicle: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  driverName: string;

  @IsOptional()
  @Transform(trimToNull)
  @Matches(/^\+?[0-9][0-9 ()-]{5,24}$/, { message: 'partner.driverPhone must be a phone number such as +81 90-1234-5678' })
  driverPhone?: string | null;
}

/** Either a fleet vehicle and driver, or a partner car. */
export class ConfirmBookingDto {
  /** The vehicle that will do this trip: Available, of the booked type, and free at that time. */
  @ValidateIf((dto: ConfirmBookingDto) => dto.partner === undefined)
  @IsUUID()
  vehicleId?: string;

  /** The driver for this trip: active and free at that time. */
  @ValidateIf((dto: ConfirmBookingDto) => dto.partner === undefined)
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PartnerVehicleDto)
  partner?: PartnerVehicleDto;

  /** The price staff quoted. Required when the booking is "quote required", not accepted otherwise. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  finalTotalJpy?: number;
}
