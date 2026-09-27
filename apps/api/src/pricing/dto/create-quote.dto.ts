import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsUUID, Matches, Max, Min, ValidateNested } from 'class-validator';

export class AddOnSelectionDto {
  @IsUUID()
  addOnId: string;

  @IsInt()
  @Min(0)
  @Max(10)
  quantity: number;
}

export class CreateQuoteDto {
  @IsUUID()
  airportId: string;

  /** The customer's side of the trip. The fare is the same in both directions. */
  @IsUUID()
  serviceRegionId: string;

  @IsUUID()
  vehicleTypeId: string;

  @IsUUID()
  paymentMethodId: string;

  /** Tokyo local date of the pickup. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'pickupDate must be a date such as 2026-10-01' })
  pickupDate: string;

  /** Tokyo local time of the pickup, 24-hour. */
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'pickupTime must be a 24-hour time such as 14:30' })
  pickupTime: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AddOnSelectionDto)
  addOns?: AddOnSelectionDto[];
}
