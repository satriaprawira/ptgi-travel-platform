import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { trim } from '../../common/transforms.js';

// Every column below is NOT NULL unless noted: a field may be omitted, never null.
const present = (_: object, value: unknown) => value !== undefined;
const MAX_YEN = 1_000_000;
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Vehicle type surcharge. `null` = "please inquire" (staff quote it). The key is required. */
export class UpdateVehicleSurchargeDto {
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  @Max(MAX_YEN)
  surchargeJpy: number | null;
}

export class UpdateTimeSurchargeDto {
  @ValidateIf(present)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label?: string;

  /** Tokyo local time, 24-hour. The window is [startsAt, endsAt) and may wrap midnight. */
  @ValidateIf(present)
  @Matches(HH_MM, { message: 'startsAt must be a 24-hour time such as 22:00' })
  startsAt?: string;

  @ValidateIf(present)
  @Matches(HH_MM, { message: 'endsAt must be a 24-hour time such as 06:00' })
  endsAt?: string;

  @ValidateIf(present)
  @IsInt()
  @Min(0)
  @Max(MAX_YEN)
  amountJpy?: number;

  @ValidateIf(present)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLeadTimeSurchargeDto {
  @ValidateIf(present)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label?: string;

  @ValidateIf(present)
  @IsInt()
  @Min(1)
  @Max(720)
  withinHours?: number;

  @ValidateIf(present)
  @IsInt()
  @Min(0)
  @Max(MAX_YEN)
  amountJpy?: number;

  @ValidateIf(present)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAddOnDto {
  @ValidateIf(present)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label?: string;

  @ValidateIf(present)
  @IsInt()
  @Min(0)
  @Max(MAX_YEN)
  priceJpy?: number;

  @ValidateIf(present)
  @IsInt()
  @Min(0)
  @Max(10)
  freeQuantity?: number;

  @ValidateIf(present)
  @IsInt()
  @Min(1)
  @Max(10)
  maxQuantity?: number;

  @ValidateIf(present)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePaymentFeeDto {
  @IsInt()
  @Min(0)
  @Max(MAX_YEN)
  feeJpy: number;
}
