import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductReviews1769000000001 implements MigrationInterface {
  name = 'AddProductReviews1769000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core.reviews
      ADD COLUMN IF NOT EXISTS product_id uuid NULL REFERENCES core.products(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS core.idx_reviews_store_user`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_store_user
      ON core.reviews(store_id, user_id)
      WHERE deleted_at IS NULL AND product_id IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_product_user
      ON core.reviews(product_id, user_id)
      WHERE deleted_at IS NULL AND product_id IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON core.reviews(product_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS core.idx_reviews_product_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS core.idx_reviews_product_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS core.idx_reviews_store_user`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_store_user
      ON core.reviews(store_id, user_id)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`ALTER TABLE core.reviews DROP COLUMN IF EXISTS product_id`);
  }
}
