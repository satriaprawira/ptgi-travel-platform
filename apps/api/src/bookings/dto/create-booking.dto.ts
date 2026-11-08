import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  Equals,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { trim, trimToNull } from '../../common/transforms.js';
import { AddOnSelectionDto } from '../../pricing/dto/create-quote.dto.js';

export const DIRECTIONS = ['from_airport', 'to_airport'] as const;
export type TripDirection = (typeof DIRECTIONS)[number];

/** airport: a transfer from or to Haneda / Narita. other: a car rental for any trip (FT-4). */
export const TRIP_TYPES = ['airport', 'other'] as const;
export type TripType = (typeof TRIP_TYPES)[number];

const isAirportTrip = (dto: CreateBookingDto) => dto.tripType !== 'other';
const isOtherTrip = (dto: CreateBookingDto) => dto.tripType === 'other';

/**
 * Everything the reservation form submits: the trip and who is travelling. An airport trip is priced
 * like POST /quotes; an "other" trip (car rental) like POST /quotes/rental.
 */
export class CreateBookingDto {
  /** Defaults to an airport trip. */
  @IsOptional()
  @IsIn(TRIP_TYPES)
  tripType?: TripType;

  // ---- Airport trips only

  @ValidateIf(isAirportTrip)
  @IsUUID()
  airportId?: string;

  /** The customer's side of the trip. The fare is the same in both directions. */
  @ValidateIf(isAirportTrip)
  @IsUUID()
  serviceRegionId?: string;

  @ValidateIf(isAirportTrip)
  @IsUUID()
  vehicleTypeId?: string;

  @ValidateIf(isAirportTrip)
  @IsIn(DIRECTIONS)
  direction?: TripDirection;

  // ---- Other trips (car rental) only

  /** The car category (vehicle class). */
  @ValidateIf(isOtherTrip)
  @IsUUID()
  vehicleClassId?: string;

  @ValidateIf(isOtherTrip)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  dropoffAddress?: string;

  @ValidateIf(isOtherTrip)
  @IsInt()
  @Min(1)
  @Max(12)
  rentalHours?: number;

  // ---- Both

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

  /**
   * Airport trips: the drop-off address (from the airport) or pick-up address (to the airport).
   * Other trips: the pick-up address.
   */
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

  /** Arrival terminal (from the airport) or departure terminal (to the airport), e.g. "Terminal 3". */
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(40)
  terminal?: string | null;

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

  /** Items that aren't standard suitcases (golf bags, surfboards, boxes…), so staff can check the car fits them. */
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(500)
  oversizedLuggage?: string | null;

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

  /** The customer ticked "I agree to the Terms & Conditions". A booking without it is refused. */
  @Equals(true, { message: 'Please agree to the Terms & Conditions' })
  acceptTerms: boolean;

  /** The version of the Terms & Conditions the customer saw, e.g. "2026-11-06". */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'termsVersion must be a date such as 2026-11-06' })
  termsVersion: string;

  /**
   * What to do when no vehicle is free at that time: false (default) refuses the booking so the
   * customer can change it; true saves it on the waiting list, holding nothing.
   */
  @IsOptional()
  @IsBoolean()
  joinWaitlist?: boolean;
}
