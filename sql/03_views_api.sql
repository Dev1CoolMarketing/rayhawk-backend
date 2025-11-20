SET search_path TO api, public;

-- NOTE: On hosted Supabase, auth.uid() resolves to the requesting user's id.
-- In local development, the NestJS API queries favorites directly, so this
-- view is provided for parity but not queried by PostgREST.
CREATE OR REPLACE VIEW api.my_favorite_stores AS
SELECT s.*
FROM core.stores s
JOIN core.favorite_stores f ON f.store_id = s.id
WHERE f.account_id = auth.uid();
