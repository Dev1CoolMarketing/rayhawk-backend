import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnalyticsEvents1767008000000 implements MigrationInterface {
  name = 'AddAnalyticsEvents1767008000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS analytics`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS analytics.analytics_events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id uuid NOT NULL REFERENCES core.stores(id) ON DELETE CASCADE,
        vendor_id uuid NOT NULL REFERENCES core.vendors(id) ON DELETE CASCADE,
        product_id uuid REFERENCES core.products(id) ON DELETE CASCADE,
        type text NOT NULL CHECK (type IN ('page_view', 'click_through', 'product_view')),
        referrer text,
        user_agent text,
        session_id text,
        ip_hash text,
        metadata jsonb,
        occurred_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_analytics_events_store_date ON analytics.analytics_events(store_id, occurred_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_analytics_events_vendor_date ON analytics.analytics_events(vendor_id, occurred_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_analytics_events_type_date ON analytics.analytics_events(type, occurred_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS analytics.idx_analytics_events_type_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS analytics.idx_analytics_events_vendor_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS analytics.idx_analytics_events_store_date`);
    await queryRunner.query(`DROP TABLE IF EXISTS analytics.analytics_events`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS analytics`);
  }
}
