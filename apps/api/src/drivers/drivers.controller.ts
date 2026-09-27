import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard.js';
import { DriversService } from './drivers.service.js';
import { CreateDriverDto } from './dto/create-driver.dto.js';
import { UpdateDriverDto } from './dto/update-driver.dto.js';

@UseGuards(AdminAuthGuard)
@Controller('admin/drivers')
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get()
  list() {
    return this.drivers.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.drivers.get(id);
  }

  @Post()
  create(@Body() dto: CreateDriverDto) {
    return this.drivers.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDriverDto) {
    return this.drivers.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.drivers.delete(id);
  }
}
