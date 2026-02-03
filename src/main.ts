import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'body-parser';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { setupSwagger } from './infra/swagger';
async function bootstrap() {
  const app = (await NestFactory.create(AppModule, { rawBody: true })) as NestExpressApplication;
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    app.use((req: Request, res: Response, next: NextFunction) => {
      const forwarded = req.headers['x-forwarded-proto'];
      const proto = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const normalized = typeof proto === 'string' ? proto.split(',')[0].trim() : '';
      if ((normalized && normalized !== 'https') || (!normalized && !req.secure)) {
        return res.status(400).json({ message: 'HTTPS required' });
      }
      return next();
    });
  }

  const corsOrigins =
    configService
      .get<string>('CORS_ORIGINS')
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean) ?? [];
  const fallbackOrigins = [
    configService.get<string>('FRONTEND_APP_URL'),
    configService.get<string>('FRONTEND_VENDOR_APP_URL'),
    'http://localhost:3000',
    // Allow Expo web dev server during development only
    process.env.NODE_ENV !== 'production' ? 'http://localhost:8081' : null,
  ].filter(Boolean) as string[];
  const originList = corsOrigins.length ? corsOrigins : fallbackOrigins;

  app.enableCors({
    origin: originList.length ? originList : false,
    credentials: true,
  });

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
    return json({ limit: '10mb' })(req, res, next);
  });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.startsWith(stripeWebhookPath)) {
      return next();
    }
    return urlencoded({ extended: true, limit: '10mb' })(req, res, next);
  });

  // Friendly handler for oversized payloads
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({
        statusCode: 413,
        message: 'Upload too large. Please limit uploads to 10MB.',
      });
    }
    return next(err);
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
  logger.log(`API running on http://localhost:${port}`);
}

bootstrap();
