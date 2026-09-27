import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, IsUUID, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { trim } from '../../common/transforms.js';
import { plateNumber, VehicleStatus } from './create-vehicle.dto.js';

// Every column is NOT NULL, so a field may be omitted but never null: ValidateIf skips only
// `undefined`, unlike IsOptional, which would also let `null` through to the database.
const present = (_: object, value: unknown) => value !== undefined;

export class UpdateVehicleDto {
  @ValidateIf(present)
  @IsUUID()
  vehicleClassId?: string;

  @ValidateIf(present)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model?: string;

  @ValidateIf(present)
  @Transform(plateNumber)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  plateNumber?: string;

  @ValidateIf(present)
  @IsInt()
  @Min(1)
  @Max(60)
  capacityPax?: number;

  @ValidateIf(present)
  @IsInt()
  @Min(0)
  @Max(60)
  capacityBags?: number;

  @ValidateIf(present)
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
