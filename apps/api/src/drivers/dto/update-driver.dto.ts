import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, ValidateIf } from 'class-validator';
import { trim, trimToNull } from '../../common/transforms.js';
import { DriverStatus, PHONE_PATTERN } from './create-driver.dto.js';

// NOT NULL columns may be omitted but not set to null (ValidateIf skips only `undefined`).
// licenseNumber and vehicleId are nullable: null clears them, omitting leaves them alone.
const present = (_: object, value: unknown) => value !== undefined;

export class UpdateDriverDto {
  @ValidateIf(present)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName?: string;

  @ValidateIf(present)
  @Transform(trim)
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'phone must be a phone number such as +81 90-1234-5678' })
  phone?: string;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(40)
  licenseNumber?: string | null;

  @IsOptional()
  @IsUUID()
  vehicleId?: string | null;

  @ValidateIf(present)
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
