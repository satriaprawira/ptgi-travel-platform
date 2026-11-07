import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { SettingsService } from './settings.service.js';

/** Booking rules staff can change: for now the buffer between bookings. Everyone reads, admins change. */
@UseGuards(AdminAuthGuard)
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Roles('admin')
  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
