import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingTables1766005000000 implements MigrationInterface {
  name = 'AddBillingTables1766005000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS billing`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS billing.billing_plans (
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
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS billing.billing_customers (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_id uuid NOT NULL UNIQUE REFERENCES core.vendors(id) ON DELETE CASCADE,
        stripe_customer_id text NOT NULL UNIQUE,
        email text,
        billing_name text,
        default_payment_method_brand text,
        default_payment_method_last4 text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS billing.billing_subscriptions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_id uuid NOT NULL REFERENCES core.vendors(id) ON DELETE CASCADE,
        billing_customer_id uuid REFERENCES billing.billing_customers(id) ON DELETE SET NULL,
        plan_id uuid REFERENCES billing.billing_plans(id) ON DELETE SET NULL,
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
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS billing.billing_invoices (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_id uuid NOT NULL REFERENCES core.vendors(id) ON DELETE CASCADE,
        billing_subscription_id uuid REFERENCES billing.billing_subscriptions(id) ON DELETE SET NULL,
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
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS billing.billing_webhook_events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        stripe_event_id text NOT NULL UNIQUE,
        type text NOT NULL,
        payload jsonb NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now(),
        processed_at timestamptz
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_billing_customers_vendor_id ON billing.billing_customers(vendor_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_vendor_id ON billing.billing_subscriptions(vendor_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_plan_id ON billing.billing_subscriptions(plan_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_billing_customer_id ON billing.billing_subscriptions(billing_customer_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_billing_invoices_vendor_id ON billing.billing_invoices(vendor_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription_id ON billing.billing_invoices(billing_subscription_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_type ON billing.billing_webhook_events(type)`,
    );

    await queryRunner.query(`ALTER TABLE billing.billing_customers ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE billing.billing_subscriptions ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE billing.billing_invoices ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`
      CREATE POLICY billing_customers_owner_policy ON billing.billing_customers
        FOR ALL
        USING (
          (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
          OR EXISTS (
            SELECT 1 FROM core.vendors v
            WHERE v.id = billing.billing_customers.vendor_id
              AND v.owner_id = auth.uid()
          )
        )
        WITH CHECK (
          (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
          OR EXISTS (
            SELECT 1 FROM core.vendors v
            WHERE v.id = billing.billing_customers.vendor_id
              AND v.owner_id = auth.uid()
          )
        )
    `);

    await queryRunner.query(`
      CREATE POLICY billing_subscriptions_owner_policy ON billing.billing_subscriptions
        FOR ALL
        USING (
          (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
          OR EXISTS (
            SELECT 1 FROM core.vendors v
            WHERE v.id = billing.billing_subscriptions.vendor_id
              AND v.owner_id = auth.uid()
          )
        )
        WITH CHECK (
          (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
          OR EXISTS (
            SELECT 1 FROM core.vendors v
            WHERE v.id = billing.billing_subscriptions.vendor_id
              AND v.owner_id = auth.uid()
          )
        )
    `);

    await queryRunner.query(`
      CREATE POLICY billing_invoices_owner_policy ON billing.billing_invoices
        FOR ALL
        USING (
          (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
          OR EXISTS (
            SELECT 1 FROM core.vendors v
            WHERE v.id = billing.billing_invoices.vendor_id
              AND v.owner_id = auth.uid()
          )
        )
        WITH CHECK (
          (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
          OR EXISTS (
            SELECT 1 FROM core.vendors v
            WHERE v.id = billing.billing_invoices.vendor_id
              AND v.owner_id = auth.uid()
          )
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS billing_invoices_owner_policy ON billing.billing_invoices`);
    await queryRunner.query(`DROP POLICY IF EXISTS billing_subscriptions_owner_policy ON billing.billing_subscriptions`);
    await queryRunner.query(`DROP POLICY IF EXISTS billing_customers_owner_policy ON billing.billing_customers`);

    await queryRunner.query(`DROP SCHEMA IF EXISTS billing CASCADE`);
  }
}
