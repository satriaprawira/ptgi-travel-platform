import { IsInt, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  /** Minutes added after each booking's 3-hour hold before the car can take another booking. */
  @IsInt()
  @Min(0)
  @Max(180)
  bufferMinutes: number;
}
