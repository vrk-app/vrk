-- name: CreateBootstrapOrganizationShell :one
INSERT INTO auth_bootstrap_organizations (
    role_title,
    shell_name
) VALUES (
    $1,
    $2
)
RETURNING *;

-- name: CreateFirstAdminInvite :one
INSERT INTO auth_first_admin_invites (
    organization_id,
    full_name,
    email,
    invite_token,
    expires_at
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;

-- name: GetFirstAdminInviteByToken :one
SELECT
    i.id,
    i.organization_id,
    i.full_name,
    i.email,
    i.invite_token,
    i.status,
    i.expires_at,
    i.opened_at,
    i.accepted_at,
    i.account_id,
    i.created_at,
    o.role_title AS organization_role_title,
    o.shell_name AS organization_shell_name,
    o.launch_state AS organization_launch_state
FROM auth_first_admin_invites i
JOIN auth_bootstrap_organizations o ON o.id = i.organization_id
WHERE i.invite_token = $1;

-- name: UpdateFirstAdminInviteOpened :one
UPDATE auth_first_admin_invites
SET
    status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END,
    opened_at = COALESCE(opened_at, NOW())
WHERE id = $1
RETURNING *;

-- name: MarkFirstAdminInviteExpired :one
UPDATE auth_first_admin_invites
SET status = 'expired'
WHERE id = $1
RETURNING *;

-- name: CreateAuthAccount :one
INSERT INTO auth_accounts (
    full_name,
    email,
    password_hash
) VALUES (
    $1,
    $2,
    $3
)
RETURNING *;

-- name: GetAuthAccountByEmail :one
SELECT *
FROM auth_accounts
WHERE LOWER(email) = LOWER($1)
LIMIT 1;

-- name: GetAuthAccountByID :one
SELECT *
FROM auth_accounts
WHERE id = $1;

-- name: ListAccountAccessPathsByAccountID :many
SELECT
    m.id AS membership_id,
    m.organization_id,
    m.membership_status,
    o.role_title AS organization_role_title,
    o.shell_name AS organization_shell_name,
    o.short_name AS organization_short_name,
    o.property_type AS organization_property_type,
    o.inn AS organization_inn,
    o.kpp AS organization_kpp,
    o.legal_address AS organization_legal_address,
    o.contact_email AS organization_contact_email,
    o.contact_phone AS organization_contact_phone,
    o.launch_state AS organization_launch_state,
    o.launched_at AS organization_launched_at,
    g.id AS grant_id,
    g.role_template AS grant_role_template,
    g.scope_type AS grant_scope_type,
    g.scope_id AS grant_scope_id
FROM auth_memberships m
JOIN auth_bootstrap_organizations o ON o.id = m.organization_id
JOIN auth_scoped_grants g ON g.membership_id = m.id
WHERE m.account_id = $1
  AND m.membership_status = 'active'
ORDER BY m.created_at ASC, g.created_at ASC;

-- name: UpdateBootstrapOrganizationFirstAdmin :exec
UPDATE auth_bootstrap_organizations
SET
    first_admin_account_id = $2,
    updated_at = NOW()
WHERE id = $1;

-- name: CreateAuthMembership :one
INSERT INTO auth_memberships (
    organization_id,
    account_id
) VALUES (
    $1,
    $2
)
RETURNING *;

-- name: CreateAuthScopedGrant :one
INSERT INTO auth_scoped_grants (
    membership_id,
    role_template,
    scope_type,
    scope_id
) VALUES (
    $1,
    $2,
    $3,
    $4
)
RETURNING *;

-- name: MarkFirstAdminInviteAccepted :one
UPDATE auth_first_admin_invites
SET
    status = 'accepted',
    accepted_at = NOW(),
    account_id = $2
WHERE id = $1
RETURNING *;

-- name: CreateAuthSession :one
INSERT INTO auth_sessions (
    account_id,
    membership_id,
    grant_id,
    session_token,
    expires_at
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;

-- name: GetCurrentSession :one
SELECT
    s.id,
    s.account_id,
    s.membership_id,
    s.session_token,
    s.expires_at,
    s.created_at,
    s.last_seen_at,
    a.full_name AS account_full_name,
    a.email AS account_email,
    m.organization_id,
    m.membership_status,
    o.role_title AS organization_role_title,
    o.shell_name AS organization_shell_name,
    o.short_name AS organization_short_name,
    o.property_type AS organization_property_type,
    o.inn AS organization_inn,
    o.kpp AS organization_kpp,
    o.legal_address AS organization_legal_address,
    o.contact_email AS organization_contact_email,
    o.contact_phone AS organization_contact_phone,
    o.launch_state AS organization_launch_state,
    o.launched_at AS organization_launched_at,
    g.id AS grant_id,
    g.role_template AS grant_role_template,
    g.scope_type AS grant_scope_type,
    g.scope_id AS grant_scope_id
FROM auth_sessions s
JOIN auth_accounts a ON a.id = s.account_id
JOIN auth_memberships m ON m.id = s.membership_id
JOIN auth_bootstrap_organizations o ON o.id = m.organization_id
JOIN auth_scoped_grants g ON g.id = s.grant_id AND g.membership_id = s.membership_id
WHERE s.session_token = $1
  AND m.membership_status = 'active'
LIMIT 1;

-- name: TouchAuthSession :exec
UPDATE auth_sessions
SET last_seen_at = NOW()
WHERE id = $1;

-- name: DeleteAuthSessionByToken :exec
DELETE FROM auth_sessions
WHERE session_token = $1;

-- name: UpdateBootstrapOrganizationCore :one
UPDATE auth_bootstrap_organizations
SET
    shell_name = $2,
    short_name = $3,
    property_type = $4,
    inn = $5,
    kpp = $6,
    legal_address = $7,
    contact_email = $8,
    contact_phone = $9,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: MarkBootstrapOrganizationLaunched :one
UPDATE auth_bootstrap_organizations
SET
    launch_state = 'active',
    launched_at = COALESCE(launched_at, NOW()),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: CreateAuthSubdivision :one
INSERT INTO auth_subdivisions (
    organization_id,
    subdivision_type,
    name,
    code,
    region,
    address,
    manager_name,
    contacts
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8
)
RETURNING *;

-- name: CreateAuthUnit :one
INSERT INTO auth_units (
    organization_id,
    subdivision_id,
    unit_type,
    name,
    code,
    address,
    manager_name,
    contacts
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8
)
RETURNING *;

-- name: ListAuthSubdivisionsByOrganization :many
SELECT *
FROM auth_subdivisions
WHERE organization_id = $1
ORDER BY created_at ASC;

-- name: ListAuthUnitsByOrganization :many
SELECT *
FROM auth_units
WHERE organization_id = $1
ORDER BY created_at ASC;
