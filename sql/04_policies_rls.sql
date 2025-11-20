ALTER TABLE core.favorite_stores ENABLE ROW LEVEL SECURITY;

-- Supabase production policies (auth.uid() is provided by the platform)
CREATE POLICY favorite_stores_select ON core.favorite_stores
    FOR SELECT
    USING (account_id = auth.uid());

CREATE POLICY favorite_stores_insert ON core.favorite_stores
    FOR INSERT
    WITH CHECK (account_id = auth.uid());

CREATE POLICY favorite_stores_delete ON core.favorite_stores
    FOR DELETE
    USING (account_id = auth.uid());
