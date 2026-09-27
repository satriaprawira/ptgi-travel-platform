import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { trim, trimToNull } from '../../common/transforms.js';

export enum DriverStatus {
  Active = 'active',
  OffDuty = 'off_duty',
  Inactive = 'inactive',
}

// Digits with the usual separators, optional leading +: "+81 90-1234-5678", "090 1234 5678".
export const PHONE_PATTERN = /^\+?[0-9][0-9 ()-]{5,24}$/;

export class CreateDriverDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @Transform(trim)
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'phone must be a phone number such as +81 90-1234-5678' })
  phone: string;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(40)
  licenseNumber?: string | null;

  /** The vehicle this driver usually drives; null or omitted for none. */
  @IsOptional()
  @IsUUID()
  vehicleId?: string | null;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
