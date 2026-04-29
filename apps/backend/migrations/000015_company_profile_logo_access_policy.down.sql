BEGIN;

UPDATE auth_scoped_grants
SET role_template = CASE role_template
    WHEN 'division_admin' THEN 'division_head'
    WHEN 'unit_admin' THEN 'unit_head'
    ELSE role_template
END
WHERE role_template IN ('division_admin', 'unit_admin');

UPDATE auth_employee_invites
SET role_template = CASE role_template
    WHEN 'division_admin' THEN 'division_head'
    WHEN 'unit_admin' THEN 'unit_head'
    ELSE role_template
END
WHERE role_template IN ('division_admin', 'unit_admin');

ALTER TABLE auth_scoped_grants
    DROP CONSTRAINT IF EXISTS auth_scoped_grants_role_scope_check,
    DROP CONSTRAINT IF EXISTS auth_scoped_grants_role_template_check;

ALTER TABLE auth_scoped_grants
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
    DROP CONSTRAINT IF EXISTS auth_employee_invites_role_scope_check,
    DROP CONSTRAINT IF EXISTS auth_employee_invites_role_template_check;

ALTER TABLE auth_employee_invites
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

ALTER TABLE auth_bootstrap_organizations
    DROP CONSTRAINT IF EXISTS auth_bootstrap_organizations_logo_size_check,
    DROP CONSTRAINT IF EXISTS auth_bootstrap_organizations_bik_digits_check,
    DROP CONSTRAINT IF EXISTS auth_bootstrap_organizations_correspondent_account_digits_check,
    DROP CONSTRAINT IF EXISTS auth_bootstrap_organizations_settlement_account_digits_check,
    DROP CONSTRAINT IF EXISTS auth_bootstrap_organizations_ogrn_digits_check,
    DROP CONSTRAINT IF EXISTS auth_bootstrap_organizations_property_type_check;

UPDATE auth_bootstrap_organizations
SET property_type = 'АО'
WHERE property_type = 'НАО';

ALTER TABLE auth_bootstrap_organizations
    DROP COLUMN logo_updated_at,
    DROP COLUMN logo_size_bytes,
    DROP COLUMN logo_content_type,
    DROP COLUMN logo_file_name,
    DROP COLUMN logo_object_key,
    DROP COLUMN bik,
    DROP COLUMN correspondent_account,
    DROP COLUMN bank_name,
    DROP COLUMN settlement_account,
    DROP COLUMN ogrn,
    DROP COLUMN postal_address;

COMMIT;
