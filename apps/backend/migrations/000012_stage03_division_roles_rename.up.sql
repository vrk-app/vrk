BEGIN;

ALTER TABLE auth_scoped_grants
    DROP CONSTRAINT IF EXISTS auth_scoped_grants_scope_type_check;

ALTER TABLE auth_employee_invites
    DROP CONSTRAINT IF EXISTS auth_employee_invites_scope_type_check;

UPDATE auth_scoped_grants
SET role_template = CASE role_template
    WHEN 'observer' THEN 'auditor'
    WHEN 'subdivision_manager' THEN 'division_head'
    WHEN 'unit_operator' THEN 'unit_head'
    ELSE role_template
END;

UPDATE auth_employee_invites
SET role_template = CASE role_template
    WHEN 'observer' THEN 'auditor'
    WHEN 'subdivision_manager' THEN 'division_head'
    WHEN 'unit_operator' THEN 'unit_head'
    ELSE role_template
END;

UPDATE auth_scoped_grants
SET scope_type = 'division'
WHERE scope_type = 'subdivision';

UPDATE auth_employee_invites
SET scope_type = 'division'
WHERE scope_type = 'subdivision';

ALTER TABLE auth_scoped_grants
    ADD CONSTRAINT auth_scoped_grants_scope_type_check
    CHECK (scope_type IN ('organization', 'division', 'unit')),
    ADD CONSTRAINT auth_scoped_grants_role_template_check
    CHECK (role_template IN (
        'organization_admin',
        'organization_head',
        'division_head',
        'division_operator',
        'unit_head',
        'unit_operator',
        'auditor'
    )),
    ADD CONSTRAINT auth_scoped_grants_role_scope_check
    CHECK (
        role_template = 'auditor'
        OR (role_template IN ('organization_admin', 'organization_head') AND scope_type = 'organization')
        OR (role_template IN ('division_head', 'division_operator') AND scope_type = 'division')
        OR (role_template IN ('unit_head', 'unit_operator') AND scope_type = 'unit')
    );

ALTER TABLE auth_employee_invites
    ADD CONSTRAINT auth_employee_invites_scope_type_check
    CHECK (scope_type IN ('organization', 'division', 'unit')),
    ADD CONSTRAINT auth_employee_invites_role_template_check
    CHECK (role_template IN (
        'organization_admin',
        'organization_head',
        'division_head',
        'division_operator',
        'unit_head',
        'unit_operator',
        'auditor'
    )),
    ADD CONSTRAINT auth_employee_invites_role_scope_check
    CHECK (
        role_template = 'auditor'
        OR (role_template IN ('organization_admin', 'organization_head') AND scope_type = 'organization')
        OR (role_template IN ('division_head', 'division_operator') AND scope_type = 'division')
        OR (role_template IN ('unit_head', 'unit_operator') AND scope_type = 'unit')
    );

ALTER TABLE auth_subdivisions RENAME TO auth_divisions;
ALTER TABLE auth_divisions RENAME COLUMN subdivision_type TO division_type;
ALTER TABLE auth_units RENAME COLUMN subdivision_id TO division_id;
ALTER TABLE registry_standards RENAME COLUMN subdivision_id TO division_id;
ALTER TABLE agreements RENAME COLUMN subdivision_id TO division_id;

ALTER TABLE auth_units
    RENAME CONSTRAINT auth_units_subdivision_id_fkey TO auth_units_division_id_fkey;

ALTER TABLE registry_standards
    RENAME CONSTRAINT registry_standards_subdivision_id_fkey TO registry_standards_division_id_fkey;

ALTER TABLE agreements
    RENAME CONSTRAINT agreements_subdivision_id_fkey TO agreements_division_id_fkey;

ALTER INDEX IF EXISTS idx_registry_standards_subdivision_id
    RENAME TO idx_registry_standards_division_id;

ALTER TABLE registry_standards
    DROP CONSTRAINT IF EXISTS chk_registry_standards_scope_exclusive,
    ADD CONSTRAINT chk_registry_standards_scope_exclusive
    CHECK (NOT (division_id IS NOT NULL AND unit_id IS NOT NULL));

COMMIT;
