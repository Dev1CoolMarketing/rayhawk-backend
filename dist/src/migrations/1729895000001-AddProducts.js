"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddProducts1729895000001 = void 0;
class AddProducts1729895000001 {
    constructor() {
        this.name = 'AddProducts1729895000001';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.products (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        store_id uuid NOT NULL REFERENCES core.stores(id) ON DELETE CASCADE,
        name text NOT NULL,
        description text,
        price_cents integer NOT NULL,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS core.products`);
    }
}
exports.AddProducts1729895000001 = AddProducts1729895000001;
//# sourceMappingURL=1729895000001-AddProducts.js.map