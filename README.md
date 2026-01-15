# Rayhawk Backend

NestJS REST API with Supabase-compatible JWT support, Postgres schemas that mirror Supabase conventions, Redis-powered BullMQ workers, optional Stripe billing, and lightweight cron hooks.

## Requirements
- Node.js 20+
- Docker + Docker Compose
- Supabase project for issuing JWTs (hosted auth)

## Quick Start
1. `cp .env.example .env` and fill `SUPABASE_JWKS_URL`, Stripe secrets (optional), and `INTERNAL_JOBS_TOKEN` used by pg_cron.
2. `docker compose up -d` to start Postgres (with `pg_cron`, `http`, `uuid-ossp`) and Redis. SQL files in `sql/` run automatically on first boot.
3. `npm install` followed by `npm run dev` for hot reload, or `npm run build && npm start` to run the compiled app.
4. Open Swagger UI at [http://localhost:8080/v1/docs](http://localhost:8080/v1/docs) and authorize with a Supabase JWT.
5. (Optional) Re-run SQL files manually: `psql $DATABASE_URL -f sql/01_schemas.sql` ... `sql/04_policies_rls.sql` to keep schemas synchronized.
6. (Optional) Enable the pg_cron schedule by executing `sql/05_pgcron_schedule.sql` once the API is reachable and replace the `x-internal-token` header with your `INTERNAL_JOBS_TOKEN`.

## Architecture Notes
- **Auth**: `ApiAuthGuard` accepts either local JWTs or Supabase-issued JWTs (via JWKS). Supabase subjects are linked to local profiles by email on first sign-in and stored as `auth_provider/auth_subject` on `users`. Use the `@User()` decorator inside controllers.
- **Database**: TypeORM models target local Postgres schemas `core` and `api`, matching Supabase naming. Run the SQL files to create tables, views, RLS policies, and sample pg_cron schedule.
- **Queues**: BullMQ (Redis) exposes `EMAIL` and `REPORTS` queues. The reports queue wires a scheduler + worker stub and powers the `/v1/cron/enqueue-daily` endpoint (guarded by `x-internal-token`).
- **Billing & Webhooks**: Stripe checkout is optional—if secrets are empty the endpoint returns a placeholder URL. Webhooks expect the raw request body; configure `STRIPE_WEBHOOK_SECRET` to enable signature validation.
- **Docs**: Swagger (+ bearer auth) lives at `/v1/docs`. Global prefix `/v1`, global validation pipe (whitelist/transform), logging interceptor, and HTTP exception filter are enabled in `main.ts`.

## Supabase Auth Bridge
- Configure `SUPABASE_URL` + `SUPABASE_JWKS_URL` (optional: `SUPABASE_JWT_ISSUER`, `SUPABASE_JWT_AUDIENCE`).
- Supabase JWTs are accepted by the API; on first request the backend links by email or creates a local profile.
- For role-sensitive endpoints, you can send `x-auth-role: customer|vendor|admin|user` to select an allowed role.

## Docker Services
- **postgres**: Based on `supabase/postgres` to include `pg_cron` and `http` extensions. Mounts `./sql` to bootstrap schemas.
- **redis**: Vanilla Redis 7 for BullMQ.
- **api**: Multi-stage Node 20 Alpine build using the provided Dockerfile. Exposes port `8080` and reads environment variables from `.env`.

## Running Cron from Postgres
`sql/05_pgcron_schedule.sql` shows how to register `http_post` with pg_cron targeting `http://api:8080/v1/cron/enqueue-daily`. Update the header token before uncommenting the statement. This allows pg_cron to call back into the API using the internal Docker network name `api`.

## Production Notes
- Migrate the `sql/` definitions into your managed Supabase Postgres instance and keep RLS enabled there.
- Configure Supabase Settings → API → Exposed Schemas to include `core` and `api` so PostgREST can access the tables/views if needed.
- Keep JWT verification pointed at your hosted Supabase JWKS; no local auth service is required.
