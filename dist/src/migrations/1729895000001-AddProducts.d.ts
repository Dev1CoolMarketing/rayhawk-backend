import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddProducts1729895000001 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
