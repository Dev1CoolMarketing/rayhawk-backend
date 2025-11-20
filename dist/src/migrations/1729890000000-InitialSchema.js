"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialSchema1729890000000 = void 0;
class InitialSchema1729890000000 {
    constructor() {
        this.name = 'InitialSchema1729890000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS core`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS api`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_cron`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS http`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.stores (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_account uuid NOT NULL,
        name text NOT NULL,
        slug text UNIQUE NOT NULL,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.favorite_stores (
        account_id uuid NOT NULL,
        store_id uuid NOT NULL REFERENCES core.stores(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (account_id, store_id)
      )
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.vendors (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id uuid NOT NULL,
        name text NOT NULL,
        stripe_account_id text,
        status text NOT NULL DEFAULT 'inactive',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.subscriptions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        vendor_id uuid NOT NULL REFERENCES core.vendors(id) ON DELETE CASCADE,
        stripe_customer_id text,
        stripe_subscription_id text UNIQUE,
        status text NOT NULL DEFAULT 'inactive',
        current_period_end timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.lead_credits (
        account_id uuid PRIMARY KEY,
        credits integer NOT NULL DEFAULT 0,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE OR REPLACE VIEW api.my_favorite_stores AS
      SELECT s.*
      FROM core.stores s
      JOIN core.favorite_stores f ON f.store_id = s.id
      WHERE f.account_id = auth.uid()
    `);
        await queryRunner.query(`ALTER TABLE core.favorite_stores ENABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`
      CREATE POLICY favorite_stores_select ON core.favorite_stores
          FOR SELECT
          USING (account_id = auth.uid())
    `);
        await queryRunner.query(`
      CREATE POLICY favorite_stores_insert ON core.favorite_stores
          FOR INSERT
          WITH CHECK (account_id = auth.uid())
    `);
        await queryRunner.query(`
      CREATE POLICY favorite_stores_delete ON core.favorite_stores
          FOR DELETE
          USING (account_id = auth.uid())
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP POLICY IF EXISTS favorite_stores_delete ON core.favorite_stores`);
        await queryRunner.query(`DROP POLICY IF EXISTS favorite_stores_insert ON core.favorite_stores`);
        await queryRunner.query(`DROP POLICY IF EXISTS favorite_stores_select ON core.favorite_stores`);
        await queryRunner.query(`ALTER TABLE IF EXISTS core.favorite_stores DISABLE ROW LEVEL SECURITY`);
        await queryRunner.query(`DROP VIEW IF EXISTS api.my_favorite_stores`);
        await queryRunner.query(`DROP TABLE IF EXISTS core.lead_credits`);
        await queryRunner.query(`DROP TABLE IF EXISTS core.subscriptions`);
        await queryRunner.query(`DROP TABLE IF EXISTS core.vendors`);
        await queryRunner.query(`DROP TABLE IF EXISTS core.favorite_stores`);
        await queryRunner.query(`DROP TABLE IF EXISTS core.stores`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS api CASCADE`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS core CASCADE`);
    }
}
exports.InitialSchema1729890000000 = InitialSchema1729890000000;
//# sourceMappingURL=1729890000000-InitialSchema.js.map