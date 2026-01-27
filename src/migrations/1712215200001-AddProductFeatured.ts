import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductFeatured1712215200001 implements MigrationInterface {
  name = 'AddProductFeatured1712215200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" ADD "featured" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "featured"`);
  }
}
