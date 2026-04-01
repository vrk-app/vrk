-- name: CreateOrganization :one
INSERT INTO organization_units (
    id, property_type_id, name, short_name, inn, kpp, address,
    parent_id, role_id, director_id, power_of_attorney_number,
    poa_issue_date, poa_expiration_date, logo
) VALUES (
    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
)
RETURNING id, property_type_id, name, short_name, inn, kpp, address,
    parent_id, role_id, director_id, power_of_attorney_number,
    poa_issue_date, poa_expiration_date, logo, created_at, updated_at;

-- name: ListOrganizations :many
SELECT id, property_type_id, name, short_name, inn, kpp, address,
    parent_id, role_id, director_id, power_of_attorney_number,
    poa_issue_date, poa_expiration_date, logo, created_at, updated_at
FROM organization_units
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountOrganizations :one
SELECT COUNT(*) FROM organization_units;

-- name: GetOrganizationByID :one
SELECT id, property_type_id, name, short_name, inn, kpp, address,
    parent_id, role_id, director_id, power_of_attorney_number,
    poa_issue_date, poa_expiration_date, logo, created_at, updated_at 
FROM organization_units
WHERE id = $1;

-- name: UpdateOrganization :one
UPDATE organization_units SET
    property_type_id = $2,
    role_id = $3,
    name = $4,
    short_name = $5,
    inn = $6,
    kpp = $7,
    address = $8,
    parent_id = $9,
    director_id = $10,
    power_of_attorney_number = $11,
    poa_issue_date = $12,
    poa_expiration_date = $13,
    logo = $14,
    updated_at = NOW()
WHERE id = $1
RETURNING id, property_type_id, name, short_name, inn, kpp, address,
    parent_id, role_id, director_id, power_of_attorney_number,
    poa_issue_date, poa_expiration_date, logo, created_at, updated_at;

-- name: DeleteOrganization :exec
DELETE FROM organization_units WHERE id = $1;

-- name: OrganizationExists :one
SELECT EXISTS(SELECT 1 FROM organization_units WHERE id = $1);
