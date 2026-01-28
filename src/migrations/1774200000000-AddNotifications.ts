import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotifications1774200000000 implements MigrationInterface {
  name = 'AddNotifications1774200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "core"`);
    await queryRunner.query(`
      CREATE TABLE "core"."notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" text NOT NULL DEFAULT 'system',
        "title" text NOT NULL,
        "body" text NOT NULL,
        "metadata" jsonb,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_user_id" ON "core"."notifications" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_created_at" ON "core"."notifications" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_read_at" ON "core"."notifications" ("read_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notifications_read_at"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_user_id"`);
    await queryRunner.query(`DROP TABLE "core"."notifications"`);
  }
}
