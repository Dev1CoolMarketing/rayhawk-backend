import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingSubscriptionItems1766007000000 implements MigrationInterface {
  name = 'AddBillingSubscriptionItems1766007000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS billing.billing_subscription_items (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        billing_subscription_id uuid NOT NULL REFERENCES billing.billing_subscriptions(id) ON DELETE CASCADE,
        vendor_id uuid NOT NULL REFERENCES core.vendors(id) ON DELETE CASCADE,
        stripe_price_id text NOT NULL,
        stripe_product_id text,
        quantity integer NOT NULL DEFAULT 0,
        feature_type text,
        units_per_quantity integer NOT NULL DEFAULT 1,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_billing_subscription_items_subscription_id ON billing.billing_subscription_items(billing_subscription_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_billing_subscription_items_price_id ON billing.billing_subscription_items(stripe_price_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_billing_subscription_items_vendor_id ON billing.billing_subscription_items(vendor_id)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_subscription_items_subscription_price ON billing.billing_subscription_items(billing_subscription_id, stripe_price_id)`,
    );

    await queryRunner.query(`ALTER TABLE billing.billing_subscription_items ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`
      CREATE POLICY billing_subscription_items_owner_policy ON billing.billing_subscription_items
        FOR ALL
        USING (
          (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
          OR EXISTS (
            SELECT 1 FROM core.vendors v
            WHERE v.id = billing.billing_subscription_items.vendor_id
              AND v.owner_id = auth.uid()
          )
        )
        WITH CHECK (
          (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
          OR EXISTS (
            SELECT 1 FROM core.vendors v
            WHERE v.id = billing.billing_subscription_items.vendor_id
              AND v.owner_id = auth.uid()
          )
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP POLICY IF EXISTS billing_subscription_items_owner_policy ON billing.billing_subscription_items`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS billing.idx_billing_subscription_items_subscription_price`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS billing.idx_billing_subscription_items_vendor_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS billing.idx_billing_subscription_items_price_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS billing.idx_billing_subscription_items_subscription_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS billing.billing_subscription_items`);
  }
}
