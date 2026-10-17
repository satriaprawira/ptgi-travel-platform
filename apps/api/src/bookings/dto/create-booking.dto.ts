import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { trim, trimToNull } from '../../common/transforms.js';
import { CreateQuoteDto } from '../../pricing/dto/create-quote.dto.js';

export const DIRECTIONS = ['from_airport', 'to_airport'] as const;
export type TripDirection = (typeof DIRECTIONS)[number];

/** Everything the reservation form submits: the priced trip (CreateQuoteDto) plus who is travelling. */
export class CreateBookingDto extends CreateQuoteDto {
  @IsIn(DIRECTIONS)
  direction: TripDirection;

  /** Drop-off address (from the airport) or pick-up address (to the airport). */
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address: string;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(20)
  flightCode?: string | null;

  @IsIn(['Mr.', 'Mrs.', 'Ms.'])
  salutation: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  passengerName: string;

  /** The person booking, when it isn't the passenger. */
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(100)
  bookerName?: string | null;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  countryOrigin: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  passengers: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  luggage: string;

  @IsBoolean()
  ageAdults: boolean;

  @IsBoolean()
  ageInfants: boolean;

  @IsBoolean()
  ageChildren: boolean;

  @Transform(trim)
  @IsEmail()
  @MaxLength(200)
  email: string;

  @Matches(/^\+\d{1,4}$/, { message: 'phoneCountryCode must be a country code such as +81' })
  phoneCountryCode: string;

  @Transform(trim)
  @Matches(/^[0-9][0-9 -]{4,19}$/, { message: 'phone must be a phone number (digits, spaces or dashes)' })
  phone: string;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(40)
  timesUsed?: string | null;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(1000)
  additionalRequests?: string | null;

  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(1000)
  petInfo?: string | null;

  /**
   * What to do when no vehicle is free at that time: false (default) refuses the booking so the
   * customer can change it; true saves it on the waiting list, holding nothing.
   */
  @IsOptional()
  @IsBoolean()
  joinWaitlist?: boolean;
}
