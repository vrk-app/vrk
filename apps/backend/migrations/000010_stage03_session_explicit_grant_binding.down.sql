BEGIN;

DROP INDEX IF EXISTS auth_sessions_grant_id_idx;

ALTER TABLE auth_sessions
    DROP COLUMN IF EXISTS grant_id;

COMMIT;
