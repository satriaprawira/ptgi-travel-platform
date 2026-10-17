import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class ScheduleQueryDto {
  /** The first Tokyo calendar day to show. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be a date such as 2026-10-16' })
  date: string;

  /** How many days from `date`: 1 for a day, 7 for a week. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  days?: number;
}
