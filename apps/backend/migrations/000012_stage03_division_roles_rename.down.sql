BEGIN;

ALTER TABLE registry_standards
    DROP CONSTRAINT IF EXISTS chk_registry_standards_scope_exclusive,
    ADD CONSTRAINT chk_registry_standards_scope_exclusive
    CHECK (NOT (division_id IS NOT NULL AND unit_id IS NOT NULL));

ALTER INDEX IF EXISTS idx_registry_standards_division_id
    RENAME TO idx_registry_standards_subdivision_id;

ALTER TABLE agreements
    RENAME CONSTRAINT agreements_division_id_fkey TO agreements_subdivision_id_fkey;

ALTER TABLE registry_standards
    RENAME CONSTRAINT registry_standards_division_id_fkey TO registry_standards_subdivision_id_fkey;

ALTER TABLE auth_units
    RENAME CONSTRAINT auth_units_division_id_fkey TO auth_units_subdivision_id_fkey;

ALTER TABLE agreements RENAME COLUMN division_id TO subdivision_id;
ALTER TABLE registry_standards RENAME COLUMN division_id TO subdivision_id;
ALTER TABLE auth_units RENAME COLUMN division_id TO subdivision_id;
ALTER TABLE auth_divisions RENAME COLUMN division_type TO subdivision_type;
ALTER TABLE auth_divisions RENAME TO auth_subdivisions;

ALTER TABLE auth_scoped_grants
    DROP CONSTRAINT IF EXISTS auth_scoped_grants_role_scope_check,
    DROP CONSTRAINT IF EXISTS auth_scoped_grants_role_template_check,
    DROP CONSTRAINT IF EXISTS auth_scoped_grants_scope_type_check;

ALTER TABLE auth_employee_invites
    DROP CONSTRAINT IF EXISTS auth_employee_invites_role_scope_check,
    DROP CONSTRAINT IF EXISTS auth_employee_invites_role_template_check,
    DROP CONSTRAINT IF EXISTS auth_employee_invites_scope_type_check;

UPDATE auth_scoped_grants
SET scope_type = 'subdivision'
WHERE scope_type = 'division';

UPDATE auth_employee_invites
SET scope_type = 'subdivision'
WHERE scope_type = 'division';

UPDATE auth_scoped_grants
SET role_template = CASE role_template
    WHEN 'auditor' THEN 'observer'
    WHEN 'division_head' THEN 'subdivision_manager'
    WHEN 'division_operator' THEN 'subdivision_manager'
    WHEN 'unit_head' THEN 'unit_operator'
    ELSE role_template
END;

UPDATE auth_employee_invites
SET role_template = CASE role_template
    WHEN 'auditor' THEN 'observer'
    WHEN 'division_head' THEN 'subdivision_manager'
    WHEN 'division_operator' THEN 'subdivision_manager'
    WHEN 'unit_head' THEN 'unit_operator'
    ELSE role_template
END;

ALTER TABLE auth_scoped_grants
    ADD CONSTRAINT auth_scoped_grants_scope_type_check
    CHECK (scope_type IN ('organization', 'subdivision', 'unit'));

ALTER TABLE auth_employee_invites
    ADD CONSTRAINT auth_employee_invites_scope_type_check
    CHECK (scope_type IN ('organization', 'subdivision', 'unit'));

ALTER TABLE registry_standards
    DROP CONSTRAINT IF EXISTS chk_registry_standards_scope_exclusive,
    ADD CONSTRAINT chk_registry_standards_scope_exclusive
    CHECK (NOT (subdivision_id IS NOT NULL AND unit_id IS NOT NULL));

COMMIT;
