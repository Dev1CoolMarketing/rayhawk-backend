import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewCriteria1769600000000 implements MigrationInterface {
  name = 'AddReviewCriteria1769600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core.reviews
      ADD COLUMN IF NOT EXISTS criteria_ratings jsonb NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core.reviews
      DROP COLUMN IF EXISTS criteria_ratings
    `);
  }
}
