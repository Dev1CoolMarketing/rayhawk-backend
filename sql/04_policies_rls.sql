ALTER TABLE core.favorite_stores ENABLE ROW LEVEL SECURITY;

-- Supabase production policies (auth.uid() is provided by the platform)
CREATE POLICY favorite_stores_select ON core.favorite_stores
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY favorite_stores_insert ON core.favorite_stores
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY favorite_stores_delete ON core.favorite_stores
    FOR DELETE
    USING (user_id = auth.uid());

ALTER TABLE core.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_profiles_select ON core.customer_profiles
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY customer_profiles_insert ON core.customer_profiles
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY customer_profiles_update ON core.customer_profiles
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY customer_profiles_delete ON core.customer_profiles
    FOR DELETE
    USING (user_id = auth.uid());

ALTER TABLE core.hormone_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY hormone_logs_select ON core.hormone_logs
    FOR SELECT
    USING (customer_profile_id = auth.uid());

CREATE POLICY hormone_logs_insert ON core.hormone_logs
    FOR INSERT
    WITH CHECK (customer_profile_id = auth.uid());

CREATE POLICY hormone_logs_update ON core.hormone_logs
    FOR UPDATE
    USING (customer_profile_id = auth.uid())
    WITH CHECK (customer_profile_id = auth.uid());

CREATE POLICY hormone_logs_delete ON core.hormone_logs
    FOR DELETE
    USING (customer_profile_id = auth.uid());

ALTER TABLE core.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON core.notifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY notifications_insert ON core.notifications
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_update ON core.notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_select ON public.users
    FOR SELECT
    USING (email = (auth.jwt() ->> 'email'));
