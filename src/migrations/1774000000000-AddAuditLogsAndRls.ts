import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogsAndRls1774000000000 implements MigrationInterface {
  name = 'AddAuditLogsAndRls1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core.audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_user_id uuid NOT NULL,
        action text NOT NULL,
        resource_type text NOT NULL,
        resource_id uuid,
        metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_actor" ON core.audit_logs(actor_user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_action" ON core.audit_logs(action)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_resource_type" ON core.audit_logs(resource_type)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_resource_id" ON core.audit_logs(resource_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_created_at" ON core.audit_logs(created_at)`);

    await queryRunner.query(`ALTER TABLE core.hormone_logs ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE core.customer_profiles ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE public.users ENABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`DROP POLICY IF EXISTS hormone_logs_select ON core.hormone_logs`);
    await queryRunner.query(`DROP POLICY IF EXISTS hormone_logs_insert ON core.hormone_logs`);
    await queryRunner.query(`DROP POLICY IF EXISTS hormone_logs_update ON core.hormone_logs`);
    await queryRunner.query(`DROP POLICY IF EXISTS hormone_logs_delete ON core.hormone_logs`);

    await queryRunner.query(`
      CREATE POLICY hormone_logs_select ON core.hormone_logs
        FOR SELECT
        USING (customer_profile_id = auth.uid())
    `);
    await queryRunner.query(`
      CREATE POLICY hormone_logs_insert ON core.hormone_logs
        FOR INSERT
        WITH CHECK (customer_profile_id = auth.uid())
    `);
    await queryRunner.query(`
      CREATE POLICY hormone_logs_update ON core.hormone_logs
        FOR UPDATE
        USING (customer_profile_id = auth.uid())
        WITH CHECK (customer_profile_id = auth.uid())
    `);
    await queryRunner.query(`
      CREATE POLICY hormone_logs_delete ON core.hormone_logs
        FOR DELETE
        USING (customer_profile_id = auth.uid())
    `);

    await queryRunner.query(`DROP POLICY IF EXISTS customer_profiles_select ON core.customer_profiles`);
    await queryRunner.query(`DROP POLICY IF EXISTS customer_profiles_insert ON core.customer_profiles`);
    await queryRunner.query(`DROP POLICY IF EXISTS customer_profiles_update ON core.customer_profiles`);
    await queryRunner.query(`DROP POLICY IF EXISTS customer_profiles_delete ON core.customer_profiles`);

    await queryRunner.query(`
      CREATE POLICY customer_profiles_select ON core.customer_profiles
        FOR SELECT
        USING (user_id = auth.uid())
    `);
    await queryRunner.query(`
      CREATE POLICY customer_profiles_insert ON core.customer_profiles
        FOR INSERT
        WITH CHECK (user_id = auth.uid())
    `);
    await queryRunner.query(`
      CREATE POLICY customer_profiles_update ON core.customer_profiles
        FOR UPDATE
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
    `);
    await queryRunner.query(`
      CREATE POLICY customer_profiles_delete ON core.customer_profiles
        FOR DELETE
        USING (user_id = auth.uid())
    `);

    await queryRunner.query(`DROP POLICY IF EXISTS users_self_select ON public.users`);
    await queryRunner.query(`
      CREATE POLICY users_self_select ON public.users
        FOR SELECT
        USING (email = (auth.jwt() ->> 'email'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP POLICY IF EXISTS users_self_select ON public.users`);
    await queryRunner.query(`ALTER TABLE public.users DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`DROP POLICY IF EXISTS customer_profiles_delete ON core.customer_profiles`);
    await queryRunner.query(`DROP POLICY IF EXISTS customer_profiles_update ON core.customer_profiles`);
    await queryRunner.query(`DROP POLICY IF EXISTS customer_profiles_insert ON core.customer_profiles`);
    await queryRunner.query(`DROP POLICY IF EXISTS customer_profiles_select ON core.customer_profiles`);
    await queryRunner.query(`ALTER TABLE core.customer_profiles DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`DROP POLICY IF EXISTS hormone_logs_delete ON core.hormone_logs`);
    await queryRunner.query(`DROP POLICY IF EXISTS hormone_logs_update ON core.hormone_logs`);
    await queryRunner.query(`DROP POLICY IF EXISTS hormone_logs_insert ON core.hormone_logs`);
    await queryRunner.query(`DROP POLICY IF EXISTS hormone_logs_select ON core.hormone_logs`);
    await queryRunner.query(`ALTER TABLE core.hormone_logs DISABLE ROW LEVEL SECURITY`);

    await queryRunner.query(`DROP TABLE IF EXISTS core.audit_logs`);
  }
}
