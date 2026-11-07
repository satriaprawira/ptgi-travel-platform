import { Injectable } from '@nestjs/common';
import { DatabaseService, type Queryable } from '../database/database.service.js';

export interface BookingSettings {
  /** Added after each booking's 3-hour hold (FT-12). */
  bufferMinutes: number;
  updatedAt: Date;
}

interface SettingsRow {
  buffer_minutes: number;
  updated_at: Date;
}

// booking_settings has exactly one row (id = true), created by the add-booking-buffer migration.
const GET_SETTINGS = `
  SELECT buffer_minutes, updated_at FROM booking_settings WHERE id`;

const UPDATE_SETTINGS = `
  UPDATE booking_settings SET buffer_minutes = $1 WHERE id
  RETURNING buffer_minutes, updated_at`;

const toSettings = (row: SettingsRow): BookingSettings => ({
  bufferMinutes: row.buffer_minutes,
  updatedAt: row.updated_at,
});

@Injectable()
export class SettingsRepository {
  constructor(private readonly db: DatabaseService) {}

  async get(q: Queryable = this.db): Promise<BookingSettings> {
    const { rows } = await q.query<SettingsRow>(GET_SETTINGS);
    return toSettings(rows[0]);
  }

  async update(bufferMinutes: number): Promise<BookingSettings> {
    const { rows } = await this.db.query<SettingsRow>(UPDATE_SETTINGS, [bufferMinutes]);
    return toSettings(rows[0]);
  }
}
