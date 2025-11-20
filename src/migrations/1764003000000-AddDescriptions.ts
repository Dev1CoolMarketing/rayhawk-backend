import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptions1764003000000 implements MigrationInterface {
  name = 'AddDescriptions1764003000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."vendors" ADD COLUMN "description" text`);
    await queryRunner.query(`ALTER TABLE "core"."stores" ADD COLUMN "description" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "core"."vendors" DROP COLUMN "description"`);
  }
}
