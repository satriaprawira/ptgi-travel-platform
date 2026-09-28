import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard.js';
import { UpdateFareDto } from './dto/update-fare.dto.js';
import { FaresService } from './fares.service.js';

/** Route pricing (base fare per airport + area). Edit and hide only: routes are never deleted (D3). */
@UseGuards(AdminAuthGuard)
@Controller('admin/fares')
export class FaresController {
  constructor(private readonly fares: FaresService) {}

  @Get()
  list() {
    return this.fares.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.fares.get(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFareDto) {
    return this.fares.update(id, dto);
  }
}
