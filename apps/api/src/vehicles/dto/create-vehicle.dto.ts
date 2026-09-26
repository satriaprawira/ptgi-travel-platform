import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { trim } from '../../common/transforms.js';

export enum VehicleStatus {
  Active = 'active',
  Maintenance = 'maintenance',
  Retired = 'retired',
}

export const plateNumber = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateVehicleDto {
  @IsUUID()
  vehicleClassId: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @Transform(plateNumber)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  plateNumber: string;

  @IsInt()
  @Min(1)
  @Max(60)
  capacityPax: number;

  @IsInt()
  @Min(0)
  @Max(60)
  capacityBags: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
