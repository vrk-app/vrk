BEGIN;

ALTER TABLE auth_bootstrap_organizations
    ADD COLUMN leader_full_name VARCHAR(160),
    ADD COLUMN leader_position VARCHAR(160),
    ADD COLUMN contract_phone VARCHAR(80),
    ADD COLUMN contract_email VARCHAR(320),
    ADD COLUMN acting_basis TEXT;

ALTER TABLE auth_subdivisions
    ADD COLUMN leader_position VARCHAR(160),
    ADD COLUMN contract_phone VARCHAR(80),
    ADD COLUMN contract_email VARCHAR(320),
    ADD COLUMN acting_basis TEXT,
    ADD COLUMN comment TEXT;

ALTER TABLE auth_units
    ADD COLUMN region VARCHAR(120),
    ADD COLUMN leader_position VARCHAR(160),
    ADD COLUMN contract_phone VARCHAR(80),
    ADD COLUMN contract_email VARCHAR(320),
    ADD COLUMN acting_basis TEXT,
    ADD COLUMN comment TEXT;

COMMIT;
