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
    o.postal_address AS organization_postal_address,
    o.ogrn AS organization_ogrn,
    o.settlement_account AS organization_settlement_account,
    o.bank_name AS organization_bank_name,
    o.correspondent_account AS organization_correspondent_account,
    o.bik AS organization_bik,
    o.logo_object_key AS organization_logo_object_key,
    o.logo_file_name AS organization_logo_file_name,
    o.logo_content_type AS organization_logo_content_type,
    o.logo_size_bytes AS organization_logo_size_bytes,
    o.logo_updated_at AS organization_logo_updated_at,
    o.contact_email AS organization_contact_email,
    o.contact_phone AS organization_contact_phone,
    o.leader_full_name AS organization_leader_full_name,
    o.leader_position AS organization_leader_position,
    o.contract_phone AS organization_contract_phone,
    o.contract_email AS organization_contract_email,
    o.acting_basis AS organization_acting_basis,
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
    o.postal_address AS organization_postal_address,
    o.ogrn AS organization_ogrn,
    o.settlement_account AS organization_settlement_account,
    o.bank_name AS organization_bank_name,
    o.correspondent_account AS organization_correspondent_account,
    o.bik AS organization_bik,
    o.logo_object_key AS organization_logo_object_key,
    o.logo_file_name AS organization_logo_file_name,
    o.logo_content_type AS organization_logo_content_type,
    o.logo_size_bytes AS organization_logo_size_bytes,
    o.logo_updated_at AS organization_logo_updated_at,
    o.contact_email AS organization_contact_email,
    o.contact_phone AS organization_contact_phone,
    o.leader_full_name AS organization_leader_full_name,
    o.leader_position AS organization_leader_position,
    o.contract_phone AS organization_contract_phone,
    o.contract_email AS organization_contract_email,
    o.acting_basis AS organization_acting_basis,
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
    leader_full_name = $10,
    leader_position = $11,
    contract_phone = $12,
    contract_email = $13,
    acting_basis = $14,
    postal_address = $15,
    ogrn = $16,
    settlement_account = $17,
    bank_name = $18,
    correspondent_account = $19,
    bik = $20,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateBootstrapOrganizationLogo :one
UPDATE auth_bootstrap_organizations
SET
    logo_object_key = $2,
    logo_file_name = $3,
    logo_content_type = $4,
    logo_size_bytes = $5,
    logo_updated_at = NOW(),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ClearBootstrapOrganizationLogo :one
UPDATE auth_bootstrap_organizations
SET
    logo_object_key = NULL,
    logo_file_name = NULL,
    logo_content_type = NULL,
    logo_size_bytes = NULL,
    logo_updated_at = NULL,
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

-- name: CreateAuthDivision :one
INSERT INTO auth_divisions (
    organization_id,
    division_type,
    name,
    region,
    address,
    manager_name,
    contacts,
    leader_position,
    contract_phone,
    contract_email,
    acting_basis,
    comment
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12
)
RETURNING *;

-- name: CreateAuthUnit :one
INSERT INTO auth_units (
    organization_id,
    division_id,
    unit_type,
    name,
    region,
    address,
    manager_name,
    contacts,
    leader_position,
    contract_phone,
    contract_email,
    acting_basis,
    comment
) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12,
    $13
)
RETURNING *;

-- name: ListAuthDivisionsByOrganization :many
SELECT
    id,
    organization_id,
    division_type,
    name,
    region,
    address,
    manager_name,
    contacts,
    status,
    created_at,
    updated_at,
    leader_position,
    contract_phone,
    contract_email,
    acting_basis,
    comment
FROM auth_divisions
WHERE organization_id = $1
  AND status = 'active'
ORDER BY created_at ASC;

-- name: ListAuthUnitsByOrganization :many
SELECT
    id,
    organization_id,
    division_id,
    unit_type,
    name,
    address,
    manager_name,
    contacts,
    status,
    created_at,
    updated_at,
    region,
    leader_position,
    contract_phone,
    contract_email,
    acting_basis,
    comment
FROM auth_units
WHERE organization_id = $1
  AND status = 'active'
ORDER BY created_at ASC;

-- name: UpdateAuthDivision :one
UPDATE auth_divisions
SET
    division_type = $3,
    name = $4,
    region = $5,
    address = $6,
    manager_name = $7,
    contacts = $8,
    leader_position = $9,
    contract_phone = $10,
    contract_email = $11,
    acting_basis = $12,
    comment = $13,
    updated_at = NOW()
WHERE id = $1
  AND organization_id = $2
  AND status = 'active'
RETURNING *;

-- name: UpdateAuthUnit :one
UPDATE auth_units
SET
    division_id = $3,
    unit_type = $4,
    name = $5,
    region = $6,
    address = $7,
    manager_name = $8,
    contacts = $9,
    leader_position = $10,
    contract_phone = $11,
    contract_email = $12,
    acting_basis = $13,
    comment = $14,
    updated_at = NOW()
WHERE id = $1
  AND organization_id = $2
  AND status = 'active'
RETURNING *;

-- name: GetAuthDivisionByID :one
SELECT
    id,
    organization_id,
    division_type,
    name,
    region,
    address,
    manager_name,
    contacts,
    status,
    created_at,
    updated_at,
    leader_position,
    contract_phone,
    contract_email,
    acting_basis,
    comment
FROM auth_divisions
WHERE id = $1;

-- name: GetAuthUnitByID :one
SELECT
    id,
    organization_id,
    division_id,
    unit_type,
    name,
    address,
    manager_name,
    contacts,
    status,
    created_at,
    updated_at,
    region,
    leader_position,
    contract_phone,
    contract_email,
    acting_basis,
    comment
FROM auth_units
WHERE id = $1;

-- name: CountAuthDivisionArchiveBlockers :one
SELECT
    (
        SELECT COUNT(*)
        FROM auth_units u
        WHERE u.organization_id = sqlc.arg(organization_id)
          AND u.division_id = sqlc.arg(scope_id)
          AND u.status = 'active'
    )
    + (
        SELECT COUNT(*)
        FROM auth_scoped_grants g
        JOIN auth_memberships m ON m.id = g.membership_id
        WHERE m.organization_id = sqlc.arg(organization_id)
          AND m.membership_status = 'active'
          AND g.scope_type = 'division'
          AND g.scope_id = sqlc.arg(scope_id)
    )
    + (
        SELECT COUNT(*)
        FROM auth_employee_invites i
        WHERE i.organization_id = sqlc.arg(organization_id)
          AND i.scope_type = 'division'
          AND i.scope_id = sqlc.arg(scope_id)
          AND i.status IN ('draft', 'sent', 'opened')
    )
    + (
        SELECT COUNT(*)
        FROM registry_standards s
        WHERE s.organization_id = sqlc.arg(organization_id)
          AND s.division_id = sqlc.arg(scope_id)
          AND s.archived_at IS NULL
    )
    + (
        SELECT COUNT(*)
        FROM agreements a
        WHERE a.customer_organization_id = sqlc.arg(organization_id)
          AND a.division_id = sqlc.arg(scope_id)
    ) AS blockers;

-- name: CountAuthUnitArchiveBlockers :one
SELECT
    (
        SELECT COUNT(*)
        FROM auth_scoped_grants g
        JOIN auth_memberships m ON m.id = g.membership_id
        WHERE m.organization_id = sqlc.arg(organization_id)
          AND m.membership_status = 'active'
          AND g.scope_type = 'unit'
          AND g.scope_id = sqlc.arg(scope_id)
    )
    + (
        SELECT COUNT(*)
        FROM auth_employee_invites i
        WHERE i.organization_id = sqlc.arg(organization_id)
          AND i.scope_type = 'unit'
          AND i.scope_id = sqlc.arg(scope_id)
          AND i.status IN ('draft', 'sent', 'opened')
    )
    + (
        SELECT COUNT(*)
        FROM registry_equipment e
        WHERE e.organization_id = sqlc.arg(organization_id)
          AND e.unit_id = sqlc.arg(scope_id)
          AND e.archived_at IS NULL
    )
    + (
        SELECT COUNT(*)
        FROM registry_measuring_instruments mi
        WHERE mi.organization_id = sqlc.arg(organization_id)
          AND mi.unit_id = sqlc.arg(scope_id)
          AND mi.archived_at IS NULL
    )
    + (
        SELECT COUNT(*)
        FROM registry_standards s
        WHERE s.organization_id = sqlc.arg(organization_id)
          AND s.unit_id = sqlc.arg(scope_id)
          AND s.archived_at IS NULL
    )
    + (
        SELECT COUNT(*)
        FROM agreements a
        WHERE a.customer_organization_id = sqlc.arg(organization_id)
          AND a.unit_id = sqlc.arg(scope_id)
    ) AS blockers;

-- name: ArchiveAuthDivision :one
UPDATE auth_divisions
SET
    status = 'archived',
    updated_at = NOW()
WHERE id = $1
  AND organization_id = $2
  AND status = 'active'
RETURNING *;

-- name: ArchiveAuthUnit :one
UPDATE auth_units
SET
    status = 'archived',
    updated_at = NOW()
WHERE id = $1
  AND organization_id = $2
  AND status = 'active'
RETURNING *;
