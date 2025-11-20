import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'body-parser';
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
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}`);
}

bootstrap();
