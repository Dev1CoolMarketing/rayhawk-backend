import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategories1767009000000 implements MigrationInterface {
  name = 'AddProductCategories1767009000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.product_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key text UNIQUE NOT NULL,
        label text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.product_category_links (
        product_id uuid NOT NULL REFERENCES core.products(id) ON DELETE CASCADE,
        category_id uuid NOT NULL REFERENCES core.product_categories(id) ON DELETE CASCADE,
        PRIMARY KEY (product_id, category_id)
      )
    `);

    await queryRunner.query(`
      INSERT INTO core.product_categories (key, label)
      VALUES
        ('injections', 'Injections'),
        ('transdermal', 'Transdermal'),
        ('oral-buccal', 'Oral / Buccal'),
        ('nasal', 'Nasal'),
        ('pellets', 'Pellets'),
        ('creams', 'Creams')
      ON CONFLICT (key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core.product_category_links`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.product_categories`);
  }
}
