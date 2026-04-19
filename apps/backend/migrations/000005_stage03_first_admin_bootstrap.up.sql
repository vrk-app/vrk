BEGIN;

CREATE TABLE auth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX auth_accounts_email_lower_uidx ON auth_accounts (LOWER(email));

CREATE TABLE auth_bootstrap_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_title VARCHAR(30) NOT NULL CHECK (role_title IN ('customer', 'contractor')),
    shell_name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100),
    property_type VARCHAR(30),
    inn VARCHAR(12),
    kpp VARCHAR(9),
    legal_address TEXT,
    contact_email VARCHAR(320),
    contact_phone VARCHAR(32),
    launch_state VARCHAR(20) NOT NULL DEFAULT 'shell' CHECK (launch_state IN ('shell', 'active')),
    first_admin_account_id UUID,
    launched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auth_bootstrap_organizations
    ADD CONSTRAINT fk_auth_bootstrap_organizations_first_admin_account
    FOREIGN KEY (first_admin_account_id)
    REFERENCES auth_accounts(id)
    ON DELETE SET NULL;

CREATE TABLE auth_first_admin_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES auth_bootstrap_organizations(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NOT NULL,
    invite_token VARCHAR(120) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    opened_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    account_id UUID REFERENCES auth_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX auth_first_admin_invites_pending_email_uidx
    ON auth_first_admin_invites (organization_id, LOWER(email))
    WHERE status IN ('sent', 'opened');

CREATE TABLE auth_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES auth_bootstrap_organizations(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
    membership_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, account_id)
);

CREATE TABLE auth_scoped_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES auth_memberships(id) ON DELETE CASCADE,
    role_template VARCHAR(60) NOT NULL,
    scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('organization', 'subdivision', 'unit')),
    scope_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (membership_id, role_template, scope_type, scope_id)
);

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES auth_memberships(id) ON DELETE CASCADE,
    session_token VARCHAR(120) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth_subdivisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES auth_bootstrap_organizations(id) ON DELETE CASCADE,
    subdivision_type VARCHAR(60) NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(60),
    region VARCHAR(120),
    address TEXT,
    manager_name VARCHAR(160),
    contacts TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES auth_bootstrap_organizations(id) ON DELETE CASCADE,
    subdivision_id UUID REFERENCES auth_subdivisions(id) ON DELETE SET NULL,
    unit_type VARCHAR(60) NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(60),
    address TEXT,
    manager_name VARCHAR(160),
    contacts TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
