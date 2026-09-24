import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { describeError } from '../database/describe-error.js';
import { DatabaseService } from '../database/database.service.js';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly db: DatabaseService) {}

  @Get()
  async check() {
    try {
      await this.db.query('SELECT 1');
      return { status: 'ok', database: 'up' };
    } catch (error) {
      this.logger.error(`Database check failed: ${describeError(error)}`);
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
  }
}
