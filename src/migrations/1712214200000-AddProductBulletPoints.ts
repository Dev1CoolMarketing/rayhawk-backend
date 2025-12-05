import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductBulletPoints1712214200000 implements MigrationInterface {
  name = 'AddProductBulletPoints1712214200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" ADD "bullet_points" text[]`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "bullet_points"`);
  }
}
