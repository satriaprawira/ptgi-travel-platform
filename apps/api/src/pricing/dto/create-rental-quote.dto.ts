import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsUUID, Matches, Max, Min, ValidateNested } from 'class-validator';
import { AddOnSelectionDto } from './create-quote.dto.js';

/** A car rental for an "Others" trip (FT-4): a car category for some hours, priced by staff. */
export class CreateRentalQuoteDto {
  /** The car category (vehicle class) the customer wants. */
  @IsUUID()
  vehicleClassId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  rentalHours: number;

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
