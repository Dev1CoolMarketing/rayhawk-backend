import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStorePhone1766008000000 implements MigrationInterface {
  name = 'AddStorePhone1766008000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."stores" ADD COLUMN IF NOT EXISTS "phone_number" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN IF EXISTS "phone_number"`);
  }
}
