import { Injectable } from '@nestjs/common';
import type { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { SettingsRepository, type BookingSettings } from './settings.repository.js';

@Injectable()
export class SettingsService {
  constructor(private readonly settings: SettingsRepository) {}

  get(): Promise<BookingSettings> {
    return this.settings.get();
  }

  /** Applies to bookings made (or moved to bookings) from now on; existing holds keep their buffer. */
  update(dto: UpdateSettingsDto): Promise<BookingSettings> {
    return this.settings.update(dto.bufferMinutes);
  }
}
