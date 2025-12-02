import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviews1766009000000 implements MigrationInterface {
  name = 'AddReviews1766009000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.review_tags (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key text UNIQUE NOT NULL,
        label text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.reviews (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id uuid NOT NULL REFERENCES core.stores(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment text,
        status text NOT NULL DEFAULT 'published',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_store_user ON core.reviews(store_id, user_id) WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON core.reviews(store_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_status ON core.reviews(status)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.review_tag_links (
        review_id uuid NOT NULL REFERENCES core.reviews(id) ON DELETE CASCADE,
        tag_id uuid NOT NULL REFERENCES core.review_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (review_id, tag_id)
      )
    `);

    await queryRunner.query(`
      INSERT INTO core.review_tags (key, label)
      VALUES ('friendly', 'Friendly'), ('quick', 'Quick'), ('efficient', 'Efficient')
      ON CONFLICT (key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core.review_tag_links`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.reviews`);
    await queryRunner.query(`DROP TABLE IF EXISTS core.review_tags`);
  }
}
