-- name: CreateEmployeeInviteDraft :one
INSERT INTO auth_employee_invites (
    organization_id,
    full_name,
    email,
    role_template,
    scope_type,
    scope_id,
    expires_at,
    created_by_account_id
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

-- name: GetEmployeeInviteByID :one
SELECT *
FROM auth_employee_invites
WHERE id = $1;

-- name: ListEmployeeInvitesByOrganization :many
SELECT *
FROM auth_employee_invites
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: ListEmployeeAccessRows :many
SELECT
    g.id AS access_id,
    m.id AS membership_id,
    a.id AS account_id,
    a.full_name,
    a.email,
    g.role_template,
    g.scope_type,
    g.scope_id,
    m.membership_status
FROM auth_scoped_grants g
JOIN auth_memberships m ON m.id = g.membership_id
JOIN auth_accounts a ON a.id = m.account_id
WHERE m.organization_id = sqlc.arg(organization_id)
  AND m.membership_status = 'active'
  AND a.status = 'active'
  AND (
      sqlc.arg(view_scope_type)::text = 'organization'
      OR (
          sqlc.arg(view_scope_type)::text = 'division'
          AND (
              (g.scope_type = 'division' AND g.scope_id = sqlc.arg(view_scope_id))
              OR (
                  g.scope_type = 'unit'
                  AND EXISTS (
                      SELECT 1
                      FROM auth_units u
                      WHERE u.id = g.scope_id
                        AND u.organization_id = m.organization_id
                        AND u.division_id = sqlc.arg(view_scope_id)
                        AND u.status = 'active'
                  )
              )
          )
      )
      OR (
          sqlc.arg(view_scope_type)::text = 'unit'
          AND g.scope_type = 'unit'
          AND g.scope_id = sqlc.arg(view_scope_id)
      )
  )
ORDER BY a.full_name ASC, a.email ASC, g.created_at ASC;

-- name: GetEmployeeAccessByID :one
SELECT
    g.id AS access_id,
    m.id AS membership_id,
    a.id AS account_id,
    a.full_name,
    a.email,
    g.role_template,
    g.scope_type,
    g.scope_id,
    m.membership_status
FROM auth_scoped_grants g
JOIN auth_memberships m ON m.id = g.membership_id
JOIN auth_accounts a ON a.id = m.account_id
WHERE g.id = sqlc.arg(access_id)
  AND m.organization_id = sqlc.arg(organization_id)
  AND m.membership_status = 'active'
  AND a.status = 'active';

-- name: UpdateEmployeeAccess :one
UPDATE auth_scoped_grants g
SET
    role_template = sqlc.arg(role_template),
    scope_type = sqlc.arg(scope_type),
    scope_id = sqlc.arg(scope_id)
FROM auth_memberships m
JOIN auth_accounts a ON a.id = m.account_id
WHERE g.id = sqlc.arg(access_id)
  AND g.membership_id = m.id
  AND m.organization_id = sqlc.arg(organization_id)
  AND m.membership_status = 'active'
  AND a.status = 'active'
RETURNING
    g.id AS access_id,
    m.id AS membership_id,
    a.id AS account_id,
    a.full_name,
    a.email,
    g.role_template,
    g.scope_type,
    g.scope_id,
    m.membership_status;

-- name: DeactivateEmployeeAccess :one
WITH target AS (
    SELECT
        g.id AS access_id,
        m.id AS membership_id,
        a.id AS account_id,
        a.full_name,
        a.email,
        g.role_template,
        g.scope_type,
        g.scope_id
    FROM auth_scoped_grants g
    JOIN auth_memberships m ON m.id = g.membership_id
    JOIN auth_accounts a ON a.id = m.account_id
    WHERE g.id = sqlc.arg(access_id)
      AND m.organization_id = sqlc.arg(organization_id)
      AND m.membership_status = 'active'
      AND a.status = 'active'
),
archived AS (
    UPDATE auth_memberships m
    SET membership_status = 'archived'
    FROM target
    WHERE m.id = target.membership_id
    RETURNING m.id
),
deleted_sessions AS (
    DELETE FROM auth_sessions s
    USING archived
    WHERE s.membership_id = archived.id
    RETURNING s.id
)
SELECT
    target.access_id,
    target.membership_id,
    target.account_id,
    target.full_name,
    target.email,
    target.role_template,
    target.scope_type,
    target.scope_id,
    'archived'::text AS membership_status
FROM target;

-- name: GetEmployeeInviteByToken :one
SELECT
    i.id,
    i.organization_id,
    i.full_name,
    i.email,
    i.role_template,
    i.scope_type,
    i.scope_id,
    i.status,
    i.invite_token,
    i.expires_at,
    i.sent_at,
    i.opened_at,
    i.accepted_at,
    i.revoked_at,
    i.account_id,
    i.created_by_account_id,
    i.created_at,
    i.updated_at,
    o.shell_name AS organization_shell_name,
    o.role_title AS organization_role_title,
    o.launch_state AS organization_launch_state
FROM auth_employee_invites i
JOIN auth_bootstrap_organizations o ON o.id = i.organization_id
WHERE i.invite_token = $1;

-- name: SendEmployeeInvite :one
UPDATE auth_employee_invites
SET
    status = 'sent',
    invite_token = $2,
    sent_at = COALESCE(sent_at, NOW()),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: MarkEmployeeInviteOpened :one
UPDATE auth_employee_invites
SET
    status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END,
    opened_at = COALESCE(opened_at, NOW()),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: MarkEmployeeInviteAccepted :one
UPDATE auth_employee_invites
SET
    status = 'accepted',
    accepted_at = NOW(),
    account_id = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: MarkEmployeeInviteExpired :one
UPDATE auth_employee_invites
SET
    status = 'expired',
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: RevokeEmployeeInvite :one
UPDATE auth_employee_invites
SET
    status = 'revoked',
    revoked_at = COALESCE(revoked_at, NOW()),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateAuthAccountPassword :one
UPDATE auth_accounts
SET
    full_name = $2,
    password_hash = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpsertAuthMembership :one
INSERT INTO auth_memberships (
    organization_id,
    account_id,
    membership_status
) VALUES (
    $1,
    $2,
    'active'
)
ON CONFLICT (organization_id, account_id) DO UPDATE
SET membership_status = 'active'
RETURNING *;

-- name: UpsertAuthScopedGrant :one
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
ON CONFLICT (membership_id, role_template, scope_type, scope_id) DO UPDATE
SET role_template = EXCLUDED.role_template
RETURNING *;
