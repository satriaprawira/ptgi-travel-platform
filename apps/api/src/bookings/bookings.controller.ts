import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard.js';
import { BookingsService } from './bookings.service.js';
import { ConfirmBookingDto } from './dto/confirm-booking.dto.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { ScheduleQueryDto } from './dto/schedule-query.dto.js';

/** Public: the reservation form's "Confirm reservation". */
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }
}

/** Staff: the Bookings Queue. */
@UseGuards(AdminAuthGuard)
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list() {
    return this.bookings.list();
  }

  // Declared before ':id' so "schedule" and "waitlist" aren't read as booking ids.
  @Get('schedule')
  schedule(@Query() query: ScheduleQueryDto) {
    return this.bookings.schedule(query.date, query.days);
  }

  @Get('waitlist')
  waitlist() {
    return this.bookings.waitlist();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.get(id);
  }

  @Get(':id/assignment-options')
  assignmentOptions(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.assignmentOptions(id);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ConfirmBookingDto) {
    return this.bookings.confirm(id, dto);
  }

  @Post(':id/promote')
  @HttpCode(HttpStatus.OK)
  promote(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.promote(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.cancel(id);
  }
}
