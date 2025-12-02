import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'body-parser';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { setupSwagger } from './infra/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  app.enableCors();

  const stripeWebhookPath = '/v1/webhooks/stripe';
  // Stripe needs raw body for signature verification; register before other parsers.
  app.use(
    stripeWebhookPath,
    json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
      limit: '1mb',
      type: '*/*',
    }),
  );
  // For non-Stripe routes, keep normal parsers.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.startsWith(stripeWebhookPath)) {
      return next();
    }
    return json()(req, res, next);
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.startsWith(stripeWebhookPath)) {
      return next();
    }
    return urlencoded({ extended: true })(req, res, next);
  });

  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  setupSwagger(app);
  const port = configService.get<number>('APP_PORT') ?? 8080;
  await app.listen(port);
  logger.log('WOW IN HERE  ')

  logger.log(`API running on http://localhost:${port}`);
}

bootstrap();
