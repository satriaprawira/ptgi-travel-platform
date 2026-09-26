import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NodeEnv, type EnvironmentVariables } from './config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService) as ConfigService<EnvironmentVariables, true>;

  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors({ origin: config.get('WEB_ORIGIN', { infer: true }) });
  app.enableShutdownHooks(); // close the database pool on SIGTERM (host restarts and deploys)

  // Loopback only in development, so the dev API is never reachable from the network.
  const host = config.get('NODE_ENV', { infer: true }) === NodeEnv.Development ? '127.0.0.1' : '0.0.0.0';
  const port = config.get('PORT', { infer: true });

  await app.listen(port, host);
  Logger.log(`API listening on http://${host}:${port}/v1`, 'Bootstrap');
}

await bootstrap();
