CREATE SCHEMA IF NOT EXISTS billing;

SET search_path TO billing, core, public;

CREATE TABLE IF NOT EXISTS billing_plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    key text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    stripe_price_id text NOT NULL UNIQUE,
    stripe_product_id text,
    interval text NOT NULL CHECK (interval IN ('month', 'year')),
    currency text NOT NULL DEFAULT 'usd',
    unit_amount_cents integer NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    seats_included integer NOT NULL DEFAULT 1,
    max_stores integer,
    seat_unit_cents integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_customers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id uuid NOT NULL UNIQUE REFERENCES core.vendors(id) ON DELETE CASCADE,
    stripe_customer_id text NOT NULL UNIQUE,
    email text,
    billing_name text,
    default_payment_method_brand text,
    default_payment_method_last4 text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id uuid NOT NULL REFERENCES core.vendors(id) ON DELETE CASCADE,
    billing_customer_id uuid REFERENCES billing_customers(id) ON DELETE SET NULL,
    plan_id uuid REFERENCES billing_plans(id) ON DELETE SET NULL,
    stripe_subscription_id text NOT NULL UNIQUE,
    stripe_price_id text NOT NULL,
    status text NOT NULL DEFAULT 'incomplete' CHECK (
      status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')
    ),
    quantity integer NOT NULL DEFAULT 1,
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    canceled_at timestamptz,
    trial_end timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id uuid NOT NULL REFERENCES core.vendors(id) ON DELETE CASCADE,
    billing_subscription_id uuid REFERENCES billing_subscriptions(id) ON DELETE SET NULL,
    stripe_invoice_id text NOT NULL UNIQUE,
    stripe_invoice_number text,
    hosted_invoice_url text,
    pdf_url text,
    amount_paid_cents integer,
    currency text NOT NULL DEFAULT 'usd',
    status text,
    issued_at timestamptz,
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id text NOT NULL UNIQUE,
    type text NOT NULL,
    payload jsonb NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz
);

CREATE TABLE IF NOT EXISTS billing_subscription_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_subscription_id uuid NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
    vendor_id uuid NOT NULL REFERENCES core.vendors(id) ON DELETE CASCADE,
    stripe_price_id text NOT NULL,
    stripe_product_id text,
    quantity integer NOT NULL DEFAULT 0,
    feature_type text,
    units_per_quantity integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_customers_vendor_id ON billing_customers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_vendor_id ON billing_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_plan_id ON billing_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_billing_customer_id ON billing_subscriptions(billing_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_vendor_id ON billing_invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription_id ON billing_invoices(billing_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_type ON billing_webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_billing_subscription_items_subscription_id ON billing_subscription_items(billing_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscription_items_price_id ON billing_subscription_items(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscription_items_vendor_id ON billing_subscription_items(vendor_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_subscription_items_subscription_price ON billing_subscription_items(billing_subscription_id, stripe_price_id);

ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscription_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_customers_owner_policy ON billing_customers
  FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM core.vendors v
      WHERE v.id = billing_customers.vendor_id AND v.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM core.vendors v
      WHERE v.id = billing_customers.vendor_id AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY billing_subscriptions_owner_policy ON billing_subscriptions
  FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM core.vendors v
      WHERE v.id = billing_subscriptions.vendor_id AND v.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM core.vendors v
      WHERE v.id = billing_subscriptions.vendor_id AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY billing_invoices_owner_policy ON billing_invoices
  FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM core.vendors v
      WHERE v.id = billing_invoices.vendor_id AND v.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM core.vendors v
      WHERE v.id = billing_invoices.vendor_id AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY billing_subscription_items_owner_policy ON billing_subscription_items
  FOR ALL
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM core.vendors v
      WHERE v.id = billing_subscription_items.vendor_id AND v.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM core.vendors v
      WHERE v.id = billing_subscription_items.vendor_id AND v.owner_id = auth.uid()
    )
  );
