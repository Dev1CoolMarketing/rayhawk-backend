# Billing Plan

<!-- PLAN -->
## Current Understanding
- **Frameworks/structure:** NestJS + TypeORM backend. SQL mirror of Supabase lives in `sql/` alongside TypeORM migrations in `src/migrations`. Core schema `core.*` holds vendor/store/subscription data; auth tables live in `public`.
- **Auth/users:** `users` table (public schema) with roles (`user`, `vendor`, `customer`, etc.), refresh tokens, and optional `core.customer_profiles` (username, birth year). Vendors use `owner_id` (UUID) but no FK; roles resolved via auth service.
- **Tenant model:** `core.vendors` is the merchant/tenant entity; stores/products belong to vendors. Customers are users with `customer_profile`.
- **Existing billing data:** `core.subscriptions` ties to `vendor_id` with `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end`. `lead_credits` tracks prepaid credits by `account_id`. No plan/catalog tables or invoice history.
- **Stripe integration today:** `BillingController` creates Checkout sessions (subscription or one-time) using env `STRIPE_SECRET_KEY`/`APP_URL`. `StripeWebhookController` handles checkout completion & subscription updates, upserting into `core.subscriptions` and crediting `lead_credits`. No RLS on billing tables; no entitlements derived from Stripe state.

## Plan
- **Schema direction:** Introduce dedicated billing tables aligned to Stripe (`billing_plan`, `billing_customer`, `billing_subscription`, optional `billing_invoice`, `billing_webhook_event`) anchored to `core.vendors` as tenant. Keep `core.subscriptions` for backward compat or migrate data into new tables with clearer status enums.
- **Files/modules to adjust:** Add SQL/TypeORM migrations; add billing entities/types; extend billing/webhook services to read/write new tables; add RLS policies matching vendor ownership; light repo methods for plan lookup + subscription sync.
- **Verification commands:** `npm test`, `npm run lint` (if configured), `npm run build`. Record any failures in **Current Errors** and rerun after fixes.

## Current Errors
- None at the moment. Previous Jest failures fixed (jwt strategy expectation updated, UsersService test includes relations, AuthService test now provides Vendor repo + CustomersService mocks).

## Build Status
- `npm run build` (pass)
- `npm test` (pass)

## Current Billing Model
- Tables:
  - `core.subscriptions`: `vendor_id` FK -> `core.vendors`, `stripe_customer_id`, `stripe_subscription_id` (unique), `status` text default `inactive`, `current_period_end`, timestamps. No plan/price linkage or quantity.
  - `core.lead_credits`: `account_id` (UUID PK), `credits` int, `updated_at`.
- Stripe flow today: `BillingController` issues Checkout Sessions (subscription with `priceId`, payment with inline price_data) and tags metadata `{ vendorId, accountId }`. `StripeWebhookController` handles `checkout.session.completed` and subscription lifecycle events; it upserts into `core.subscriptions` and credits `lead_credits` for one-time payments. No invoice mirroring or entitlement logic.
- Auth/tenancy: `core.vendors` tie to `users.owner_id` (no FK). Billing data is per-vendor; customer persona uses `users` + `core.customer_profiles`. RLS only exists for `favorite_stores`, not for billing tables.
- Recommendation: keep Stripe as billing source of truth but create dedicated `billing_*` tables for plan catalog/customer/subscription state keyed to `core.vendors`, rather than overloading `core.subscriptions`. Existing table can be left for backward compatibility/backfill.

## Proposed Schema
- `billing_plan` (schema `billing`): `id` uuid PK, `key` text unique, `name`, `description`, `stripe_price_id` unique, `stripe_product_id`, `interval` (`month`/`year`), `currency` text default `usd`, `unit_amount_cents` int, `is_active` bool default true, **seats_included** (int, default 1), **max_stores** (int, nullable), **seat_unit_cents** (int, nullable) for per-seat pricing metadata, timestamps.
- `billing_customer`: `id` uuid PK, `vendor_id` uuid unique FK -> `core.vendors`, `stripe_customer_id` unique, optional `email`, `billing_name`, `default_payment_method_brand`, `default_payment_method_last4`, timestamps.
- `billing_subscription`: `id` uuid PK, `vendor_id` FK -> `core.vendors`, `billing_customer_id` FK -> `billing_customer`, `plan_id` FK -> `billing_plan`, `stripe_subscription_id` unique, `stripe_price_id`, `status` text with check (`incomplete`, `incomplete_expired`, `trialing`, `active`, `past_due`, `canceled`, `unpaid`, `paused`), `quantity` int default 1, `current_period_start`, `current_period_end`, `cancel_at_period_end` bool default false, `canceled_at`, `trial_end`, timestamps.
- `billing_invoice` (optional mirror): `id` uuid PK, `vendor_id` FK -> `core.vendors`, `billing_subscription_id` nullable FK, `stripe_invoice_id` unique, `stripe_invoice_number`, `hosted_invoice_url`, `pdf_url`, `amount_paid_cents`, `currency`, `status`, `issued_at`, `paid_at`, timestamps.
- `billing_webhook_event` (optional idempotency/debug): `id` uuid PK, `stripe_event_id` unique, `type`, `payload` jsonb, `received_at` timestamptz default now(), `processed_at` timestamptz.
- `billing_subscription_item`: add-on/sub-item mirror keyed to a subscription, with `stripe_price_id`, `quantity`, optional `feature_type` (e.g., `seats`, `stores`), `units_per_quantity`.
- RLS intent (Supabase): enable RLS on `billing_*`; allow select/update for service role, and per-vendor access where `auth.uid() = vendors.owner_id`.

## Implemented Changes
- Added `billing` schema migration (`src/migrations/1766005000000-AddBillingTables.ts`) plus SQL mirror (`sql/06_billing_tables.sql`) creating `billing_plans`, `billing_customers`, `billing_subscriptions`, `billing_invoices`, `billing_webhook_events` with indexes and RLS scoped to vendor ownership or `service_role`.
- Added plan limit columns via migration (`src/migrations/1766006000000-AddBillingPlanLimits.ts`) and SQL mirror update: `seats_included`, `max_stores`, `seat_unit_cents` on `billing_plans` to model tier limits and per-seat pricing.
- Added subscription items for add-ons via migration (`src/migrations/1766007000000-AddBillingSubscriptionItems.ts`) and SQL mirror: `billing_subscription_items` with RLS; used to track per-price quantities (e.g., additional seats/stores) by `feature_type`.
- New billing entities and `BillingService` (plan lookups, billing_customer upsert, subscription sync, invoice/webhook logging); exported via `BillingModule` and used by Stripe webhook.
- `BillingService.getVendorEntitlements` returns `{ planKey, status, currentPeriodEnd, isActive, seatsAllowed, storesAllowed, seatsAddOns, storesAddOns }`, treating inactive/expired subscriptions as zero entitlement and incorporating add-on items by `feature_type`.
- Stripe webhook now records events idempotently, persists subscription state to new billing tables (legacy `core.subscriptions` still updated), and stores invoice metadata. Checkout requires `vendorId` for subscription mode to keep tenant links intact; subscription quantity is mirrored to support seat-based pricing.
- Store enforcement: `StoresService` checks entitlements before creating stores (blocks when inactive or over limit) and trims results above the allowed count when listing owned stores; limits can be expanded via add-on items (`feature_type = 'stores'`).

## ERD Snapshot (core billing + tenancy)
- `core.users` (public) —1:1→ `core.customer_profiles`
- `core.vendors` —1:M→ `core.stores`, `core.subscriptions` (legacy)
- `billing.billing_plans` —1:M→ `billing.billing_subscriptions`
- `billing.billing_customers` —1:M→ `billing.billing_subscriptions`
- `billing.billing_subscriptions` —1:M→ `billing.billing_invoices`
- `billing.billing_subscriptions` —1:M→ `billing.billing_subscription_items`
- `billing.billing_webhook_events` (idempotency log)
Tenancy: all `billing_*` rows reference `core.vendors.id`; RLS permits vendor owner (auth.uid()) or service_role.

## Migration Assumptions
- `core.vendors.id` is UUID; Stripe payloads include a price id on subscriptions. `auth.uid()` and `request.jwt.claims.role` are available (Supabase) so RLS can match vendor owner or service role.
- Vendor id must be supplied in Checkout metadata (enforced on subscription checkout) to attach billing rows to the correct tenant.

## Final Status
- Commands: `npm test` (pass), `npm run build` (pass).
- Key changes: billing schema/entities/service + migration; webhook now logs events, syncs subscriptions to `billing_*` and captures invoices; subscription checkout requires `vendorId` to enforce tenancy; SQL mirror added under `sql/`.
- Schema shape: `billing_plans`, `billing_customers`, `billing_subscriptions`, `billing_invoices`, `billing_webhook_events` (RLS on vendor ownership/service role); legacy `core.subscriptions` still maintained for compatibility.
- Next steps: (1) seed `billing_plans` with Stripe price/product ids; (2) wire actual Stripe customer creation + attach to Checkout sessions; (3) expand webhook handling for payment method updates/trials and reconcile to entitlements; (4) expose billing status/read APIs per vendor using new tables; (5) run migrations against Supabase/Postgres and confirm RLS behavior with service role keys.
