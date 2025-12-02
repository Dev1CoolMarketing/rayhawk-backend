import { ConfigService } from '@nestjs/config';

export function resolveStripeSecrets(config: ConfigService) {
  const env = (config.get<string>('NODE_ENV') ?? 'development').toLowerCase();
  const isProd = env === 'production';

  const secret =
    config.get<string>('STRIPE_SECRET_KEY') ??
    (isProd ? config.get<string>('STRIPE_SECRET_KEY_LIVE') : config.get<string>('STRIPE_SECRET_KEY_TEST'));

  const webhookSecret =
    config.get<string>('STRIPE_WEBHOOK_SECRET') ??
    (isProd ? config.get<string>('STRIPE_WEBHOOK_SECRET_LIVE') : config.get<string>('STRIPE_WEBHOOK_SECRET_TEST'));

  return { secret, webhookSecret };
}

export function resolveSeatPriceId(config: ConfigService) {
  const env = (config.get<string>('NODE_ENV') ?? 'development').toLowerCase();
  const isProd = env === 'production';
  return (
    config.get<string>('STRIPE_SEAT_PRICE_ID') ??
    (isProd ? config.get<string>('STRIPE_SEAT_PRICE_ID_LIVE') : config.get<string>('STRIPE_SEAT_PRICE_ID_TEST'))
  );
}

export function resolveStorePriceId(config: ConfigService) {
  const env = (config.get<string>('NODE_ENV') ?? 'development').toLowerCase();
  const isProd = env === 'production';
  return (
    config.get<string>('STRIPE_STORE_PRICE_ID') ??
    (isProd ? config.get<string>('STRIPE_STORE_PRICE_ID_LIVE') : config.get<string>('STRIPE_STORE_PRICE_ID_TEST'))
  );
}
