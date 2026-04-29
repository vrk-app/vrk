BEGIN;

ALTER TABLE auth_units
    DROP COLUMN IF EXISTS comment,
    DROP COLUMN IF EXISTS acting_basis,
    DROP COLUMN IF EXISTS contract_email,
    DROP COLUMN IF EXISTS contract_phone,
    DROP COLUMN IF EXISTS leader_position,
    DROP COLUMN IF EXISTS region;

ALTER TABLE auth_subdivisions
    DROP COLUMN IF EXISTS comment,
    DROP COLUMN IF EXISTS acting_basis,
    DROP COLUMN IF EXISTS contract_email,
    DROP COLUMN IF EXISTS contract_phone,
    DROP COLUMN IF EXISTS leader_position;

ALTER TABLE auth_bootstrap_organizations
    DROP COLUMN IF EXISTS acting_basis,
    DROP COLUMN IF EXISTS contract_email,
    DROP COLUMN IF EXISTS contract_phone,
    DROP COLUMN IF EXISTS leader_position,
    DROP COLUMN IF EXISTS leader_full_name;

COMMIT;
