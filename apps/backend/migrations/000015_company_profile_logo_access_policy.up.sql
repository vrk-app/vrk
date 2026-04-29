BEGIN;

ALTER TABLE auth_bootstrap_organizations
    ADD COLUMN postal_address TEXT,
    ADD COLUMN ogrn VARCHAR(15),
    ADD COLUMN settlement_account VARCHAR(20),
    ADD COLUMN bank_name VARCHAR(200),
    ADD COLUMN correspondent_account VARCHAR(20),
    ADD COLUMN bik VARCHAR(9),
    ADD COLUMN logo_object_key TEXT,
    ADD COLUMN logo_file_name VARCHAR(255),
    ADD COLUMN logo_content_type VARCHAR(120),
    ADD COLUMN logo_size_bytes BIGINT,
    ADD COLUMN logo_updated_at TIMESTAMPTZ;

UPDATE auth_bootstrap_organizations
SET property_type = CASE property_type
    WHEN 'АО' THEN 'НАО'
    WHEN 'ЗАО' THEN 'НАО'
    WHEN 'ОАО' THEN 'ПАО'
    WHEN 'LLC' THEN 'ООО'
    ELSE property_type
END
WHERE property_type IN ('АО', 'ЗАО', 'ОАО', 'LLC');

ALTER TABLE auth_bootstrap_organizations
    ADD CONSTRAINT auth_bootstrap_organizations_property_type_check
    CHECK (property_type IS NULL OR property_type IN ('ООО', 'ПАО', 'НАО', 'ИП')),
    ADD CONSTRAINT auth_bootstrap_organizations_ogrn_digits_check
    CHECK (ogrn IS NULL OR ogrn ~ '^[0-9]{13}$' OR ogrn ~ '^[0-9]{15}$'),
    ADD CONSTRAINT auth_bootstrap_organizations_settlement_account_digits_check
    CHECK (settlement_account IS NULL OR settlement_account ~ '^[0-9]{20}$'),
    ADD CONSTRAINT auth_bootstrap_organizations_correspondent_account_digits_check
    CHECK (correspondent_account IS NULL OR correspondent_account ~ '^[0-9]{20}$'),
    ADD CONSTRAINT auth_bootstrap_organizations_bik_digits_check
    CHECK (bik IS NULL OR bik ~ '^[0-9]{9}$'),
    ADD CONSTRAINT auth_bootstrap_organizations_logo_size_check
    CHECK (logo_size_bytes IS NULL OR logo_size_bytes >= 0);

ALTER TABLE auth_scoped_grants
    DROP CONSTRAINT IF EXISTS auth_scoped_grants_role_scope_check,
    DROP CONSTRAINT IF EXISTS auth_scoped_grants_role_template_check;

ALTER TABLE auth_scoped_grants
    ADD CONSTRAINT auth_scoped_grants_role_template_check
    CHECK (role_template IN (
        'organization_admin',
        'organization_head',
        'division_admin',
        'division_head',
        'division_operator',
        'unit_admin',
        'unit_head',
        'unit_operator',
        'auditor'
    )),
    ADD CONSTRAINT auth_scoped_grants_role_scope_check
    CHECK (
        role_template = 'auditor'
        OR (role_template IN ('organization_admin', 'organization_head') AND scope_type = 'organization')
        OR (role_template IN ('division_admin', 'division_head', 'division_operator') AND scope_type = 'division')
        OR (role_template IN ('unit_admin', 'unit_head', 'unit_operator') AND scope_type = 'unit')
    );

ALTER TABLE auth_employee_invites
    DROP CONSTRAINT IF EXISTS auth_employee_invites_role_scope_check,
    DROP CONSTRAINT IF EXISTS auth_employee_invites_role_template_check;

ALTER TABLE auth_employee_invites
    ADD CONSTRAINT auth_employee_invites_role_template_check
    CHECK (role_template IN (
        'organization_admin',
        'organization_head',
        'division_admin',
        'division_head',
        'division_operator',
        'unit_admin',
        'unit_head',
        'unit_operator',
        'auditor'
    )),
    ADD CONSTRAINT auth_employee_invites_role_scope_check
    CHECK (
        role_template = 'auditor'
        OR (role_template IN ('organization_admin', 'organization_head') AND scope_type = 'organization')
        OR (role_template IN ('division_admin', 'division_head', 'division_operator') AND scope_type = 'division')
        OR (role_template IN ('unit_admin', 'unit_head', 'unit_operator') AND scope_type = 'unit')
    );

COMMIT;
