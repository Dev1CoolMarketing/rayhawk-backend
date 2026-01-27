import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'body-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { setupSwagger } from './infra/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  app.enableCors();
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    const started = Date.now();
    const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
    const authScheme = authHeader.split(' ')[0] ?? '';
    const hasBearer = authScheme.toLowerCase() === 'bearer';
    const token = hasBearer ? authHeader.slice(authScheme.length + 1).trim() : '';
    const tokenLength = token.length;
    const shouldLogToken = req.originalUrl.includes('/customers/me/profile') || req.originalUrl.includes('/auth/me');
    const tokenPreview = shouldLogToken && tokenLength ? `${token.slice(0, 8)}...${token.slice(-4)}` : '';
    res.on('finish', () => {
      const duration = Date.now() - started;
      // eslint-disable-next-line no-console
      console.log(
        `[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms) auth=${
          hasBearer ? 'bearer' : authHeader ? 'other' : 'none'
        } tokenLen=${tokenLength}${tokenPreview ? ` token=${tokenPreview}` : ''}`,
      );
    });
    next();
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

  // Ensure raw body is preserved for Stripe webhooks while still parsing JSON elsewhere.
  app.use(
    '/v1/webhooks/stripe',
    json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
      limit: '1mb',
      type: '*/*',
    }),
  );

  setupSwagger(app);

  const port = configService.get<number>('APP_PORT') ?? 8080;
  const supabaseUrl = configService.get<string>('SUPABASE_URL')?.trim() || 'unset';
  const supabaseJwksUrl = configService.get<string>('SUPABASE_JWKS_URL')?.trim() || 'unset';

  await app.listen(port);
  logger.log(`API running on http://localhost:${port} TEST IS TWO`);
    logger.log(`[Auth] SUPABASE_URL=${supabaseUrl} TEST`);
  logger.log(`[Auth] SUPABASE_JWKS_URL=${supabaseJwksUrl} TEST`);
}

bootstrap();
