BEGIN;

ALTER TABLE auth_divisions
    ADD COLUMN code VARCHAR(60);

ALTER TABLE auth_units
    ADD COLUMN code VARCHAR(60);

COMMIT;
