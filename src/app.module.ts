/**
 * Auth audit (Apr 2024):
 * - Backend previously relied on a SupabaseAuthGuard (legacy file now removed) to validate Supabase-issued JWTs; there
 *   was no first-party auth module and controllers expected `SupabaseUser` data on the request context.
 * - There is no Users entity/model in the local database—profiles are assumed to live in Supabase, so we cannot hash
 *   passwords, rotate tokens, or persist refresh tokens ourselves.
 * - Frontend (see t-maps/lib/supabase & components/Auth.tsx) also relies on Supabase, keeps tokens in AsyncStorage,
 *   and calls Supabase tables like `profiles`, meaning tokens are not stored securely and cannot talk to this Nest API.
 * - Major issues: backend cannot issue/refresh tokens, there is no `/auth` controller, secrets are handled outside our
 *   stack, logout/token invalidation is impossible, and mobile app lacks secure storage or centralized auth state.
 *
 * Implementation plan:
 * 1. Share DTO/user shapes via a new /shared/types workspace folder imported by both apps.
 * 2. Backend: add User + RefreshToken entities & UsersModule; wire up AuthModule (controller/service/strategies/guards)
 *    using bcrypt for password hashing, @nestjs/jwt for access/refresh tokens, and ConfigService-driven secrets.
 *    Expose POST /auth/register, POST /auth/login, GET /auth/me, POST /auth/refresh, POST /auth/logout; ensure DTO
 *    validation, hashed refresh token storage, and replace SupabaseAuthGuard usages with a JwtAuthGuard + decorator.
 * 3. Backend testing: configure Jest + ts-jest, add unit tests for UsersService (create/find/hash), AuthService
 *    (login/register/token issuance/refresh), Jwt strategy/guard behavior, and Supertest e2e covering register/login/me/refresh.
 * 4. Frontend: replace Supabase client with an API layer (`lib/api/client.ts`, `lib/api/auth.ts`) hitting the Nest API,
 *    using Expo SecureStore for tokens, typed responses shared with backend, and a React context (`providers/AuthProvider`)
 *    powering hooks + screens for login/register plus a /me bootstrap/refresh flow.
 * 5. Frontend testing: set up Jest via jest-expo + React Native Testing Library, add tests for the AuthContext/provider,
 *    API module (ensures endpoints/payloads/headers), and login/register screen validation + error paths; propose Detox
 *    strategy via TODO for future coverage.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullMqModule } from './infra/bullmq.module';
import { DbModule } from './infra/db.module';
import { HealthModule } from './modules/health/health.module';
import { StoresModule } from './modules/stores/stores.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { BillingModule } from './modules/billing/billing.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { CustomersModule } from './modules/customers/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    DbModule,
    BullMqModule,
    HealthModule,
    StoresModule,
    FavoritesModule,
    BillingModule,
    WebhooksModule,
    JobsModule,
    ReportsModule,
    ProductsModule,
    UsersModule,
    AuthModule,
    VendorsModule,
    CustomersModule,
  ],
})
export class AppModule {}
