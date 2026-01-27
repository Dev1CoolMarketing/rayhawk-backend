import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionCollectionMethod1768001000000 implements MigrationInterface {
  name = 'AddSubscriptionCollectionMethod1768001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing"."billing_subscriptions" ADD "collection_method" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing"."billing_subscriptions" DROP COLUMN "collection_method"`,
    );
  }
}
