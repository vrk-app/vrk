BEGIN;

ALTER TABLE auth_sessions
    ADD COLUMN grant_id UUID REFERENCES auth_scoped_grants(id) ON DELETE CASCADE;

WITH single_grant_memberships AS (
    SELECT membership_id
    FROM auth_scoped_grants
    GROUP BY membership_id
    HAVING COUNT(*) = 1
)
UPDATE auth_sessions s
SET grant_id = g.id
FROM single_grant_memberships
JOIN auth_scoped_grants g ON g.membership_id = single_grant_memberships.membership_id
WHERE s.membership_id = single_grant_memberships.membership_id;

DELETE FROM auth_sessions
WHERE grant_id IS NULL;

ALTER TABLE auth_sessions
    ALTER COLUMN grant_id SET NOT NULL;

CREATE INDEX auth_sessions_grant_id_idx ON auth_sessions (grant_id);

COMMIT;
