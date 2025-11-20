import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNames1764001000000 implements MigrationInterface {
  name = 'AddUserNames1764001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "first_name" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "last_name" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "first_name"`);
  }
}
