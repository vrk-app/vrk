BEGIN;

ALTER TABLE auth_divisions
    DROP COLUMN code;

ALTER TABLE auth_units
    DROP COLUMN code;

COMMIT;
