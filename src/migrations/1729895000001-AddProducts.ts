import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProducts1729895000001 implements MigrationInterface {
  name = 'AddProducts1729895000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.products (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id uuid NOT NULL REFERENCES core.stores(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        price_cents integer NOT NULL,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core.products`);
  }
}
