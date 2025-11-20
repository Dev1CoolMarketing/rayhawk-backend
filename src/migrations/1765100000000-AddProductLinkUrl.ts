import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductLinkUrl1765100000000 implements MigrationInterface {
  name = 'AddProductLinkUrl1765100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" ADD COLUMN "link_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "core"."products" DROP COLUMN "link_url"`);
  }
}
