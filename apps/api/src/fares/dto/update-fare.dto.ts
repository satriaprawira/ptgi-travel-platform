import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Matches, Max, Min, ValidateIf } from 'class-validator';

const present = (_: object, value: unknown) => value !== undefined;
const upperTrim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

/**
 * Partial update of one route fare. `priceJpy: null` switches the route to "quote on request";
 * a number makes it a fixed price (and clears `minPriceJpy` unless that is sent too, which is refused).
 */
export class UpdateFareDto {
  @ValidateIf(present)
  @Transform(upperTrim)
  @Matches(/^[A-Z]$/, { message: 'zone must be a single letter A–Z' })
  zone?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  priceJpy?: number | null;

  /** "From ¥N" hint while the route is quote on request. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  minPriceJpy?: number | null;

  @ValidateIf(present)
  @IsBoolean()
  isActive?: boolean;
}
