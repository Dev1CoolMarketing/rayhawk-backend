import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnalyticsEvents1766003000000 implements MigrationInterface {
  name = 'AddAnalyticsEvents1766003000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "analytics"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "analytics"."analytics_events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "store_id" uuid NOT NULL,
        "vendor_id" uuid NOT NULL,
        "product_id" uuid,
        "type" text NOT NULL,
        "referrer" text,
        "user_agent" text,
        "session_id" text,
        "ip_hash" text,
        "metadata" jsonb,
        "occurred_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_events_store_id"
      ON "analytics"."analytics_events" ("store_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_events_vendor_id"
      ON "analytics"."analytics_events" ("vendor_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_events_product_id"
      ON "analytics"."analytics_events" ("product_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_events_type"
      ON "analytics"."analytics_events" ("type")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_events_occurred_at"
      ON "analytics"."analytics_events" ("occurred_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "analytics"."analytics_events"`);
  }
}
