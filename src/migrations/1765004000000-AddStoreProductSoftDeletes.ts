import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreProductSoftDeletes1765004000000 implements MigrationInterface {
  name = 'AddStoreProductSoftDeletes1765004000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."stores" ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "core"."stores" DROP COLUMN "deleted_at"`);
  }
}
