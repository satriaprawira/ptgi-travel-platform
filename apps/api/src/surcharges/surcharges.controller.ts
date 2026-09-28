import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard.js';
import {
  UpdateAddOnDto,
  UpdateLeadTimeSurchargeDto,
  UpdatePaymentFeeDto,
  UpdateTimeSurchargeDto,
  UpdateVehicleSurchargeDto,
} from './dto/update-surcharges.dto.js';
import { SurchargesService } from './surcharges.service.js';

/** The "Additional Cost" price sheet: everything added on top of the route fare. */
@UseGuards(AdminAuthGuard)
@Controller('admin/surcharges')
export class SurchargesController {
  constructor(private readonly surcharges: SurchargesService) {}

  @Get()
  list() {
    return this.surcharges.list();
  }

  @Patch('vehicle-types/:id')
  updateVehicle(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleSurchargeDto) {
    return this.surcharges.updateVehicle(id, dto);
  }

  @Patch('pickup-times/:id')
  updateTime(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTimeSurchargeDto) {
    return this.surcharges.updateTime(id, dto);
  }

  @Patch('last-minute/:id')
  updateLeadTime(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadTimeSurchargeDto) {
    return this.surcharges.updateLeadTime(id, dto);
  }

  @Patch('add-ons/:id')
  updateAddOn(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAddOnDto) {
    return this.surcharges.updateAddOn(id, dto);
  }

  @Patch('payment-methods/:id')
  updatePaymentFee(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentFeeDto) {
    return this.surcharges.updatePaymentFee(id, dto);
  }
}
