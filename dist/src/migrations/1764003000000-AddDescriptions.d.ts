import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddDescriptions1764003000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
