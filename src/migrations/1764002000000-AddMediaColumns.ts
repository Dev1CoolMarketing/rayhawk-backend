import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaColumns1764002000000 implements MigrationInterface {
  name = 'AddMediaColumns1764002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "avatar_url" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "avatar_public_id" text`);
    await queryRunner.query(`ALTER TABLE "core"."stores" ADD COLUMN "image_url" text`);
    await queryRunner.query(`ALTER TABLE "core"."stores" ADD COLUMN "image_public_id" text`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN "image_url" text`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN "image_public_id" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "image_public_id"`);
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "image_url"`);
    await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "image_public_id"`);
    await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "image_url"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_public_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
  }
}
