CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

SET search_path TO core, public;

CREATE TABLE IF NOT EXISTS core.stores (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_account uuid NOT NULL,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid NOT NULL REFERENCES core.stores(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price_cents integer NOT NULL,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.favorite_stores (
    account_id uuid NOT NULL,
    store_id uuid NOT NULL REFERENCES core.stores(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id, store_id)
);

CREATE TABLE IF NOT EXISTS core.vendors (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL,
    name text NOT NULL,
    stripe_account_id text,
    status text NOT NULL DEFAULT 'inactive',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id uuid NOT NULL REFERENCES core.vendors(id) ON DELETE CASCADE,
    stripe_customer_id text,
    stripe_subscription_id text UNIQUE,
    status text NOT NULL DEFAULT 'inactive',
    current_period_end timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS core.lead_credits (
    account_id uuid PRIMARY KEY,
    credits integer NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON SCHEMA core IS 'Primary tables mirroring Supabase structure.';
