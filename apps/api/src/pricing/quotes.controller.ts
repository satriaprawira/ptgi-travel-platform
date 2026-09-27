import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto.js';
import { PricingService } from './pricing.service.js';

/** Public: the reservation form asks for a live price while the customer fills it in. */
@Controller('quotes')
export class QuotesController {
  constructor(private readonly pricing: PricingService) {}

  // 200, not 201: a quote is calculated, nothing is stored.
  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Body() dto: CreateQuoteDto) {
    return this.pricing.quote(dto);
  }
}
