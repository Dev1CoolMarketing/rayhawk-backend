import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthProviderToUsers1765000000000 implements MigrationInterface {
  name = 'AddAuthProviderToUsers1765000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "auth_provider" text NOT NULL DEFAULT 'local'`);
    await queryRunner.query(`ALTER TABLE "users" ADD "auth_subject" text`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_auth_provider_subject" ON "users" ("auth_provider", "auth_subject")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_users_auth_provider_subject"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "auth_subject"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "auth_provider"`);
  }
}
