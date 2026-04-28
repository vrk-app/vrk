BEGIN;

CREATE TABLE auth_employee_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES auth_bootstrap_organizations(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(320) NOT NULL,
    role_template VARCHAR(60) NOT NULL,
    scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('organization', 'subdivision', 'unit')),
    scope_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'opened', 'accepted', 'expired', 'revoked')),
    invite_token VARCHAR(120) UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    account_id UUID REFERENCES auth_accounts(id) ON DELETE SET NULL,
    created_by_account_id UUID NOT NULL REFERENCES auth_accounts(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX auth_employee_invites_pending_email_uidx
    ON auth_employee_invites (organization_id, LOWER(email), scope_type, scope_id)
    WHERE status IN ('draft', 'sent', 'opened');

CREATE INDEX auth_employee_invites_org_created_idx
    ON auth_employee_invites (organization_id, created_at DESC);

CREATE INDEX auth_employee_invites_token_idx
    ON auth_employee_invites (invite_token)
    WHERE invite_token IS NOT NULL;

COMMIT;
