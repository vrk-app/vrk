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
-- name: ListOrganizations :many
SELECT 
    o.id, 
    o.property_type_id,                    -- ← добавить
    pt.property_type as property_type_name,
    o.name, 
    o.short_name, 
    o.inn, 
    o.kpp, 
    o.address,
    o.parent_id, 
    o.role_id, 
    r.title as role_title,
    o.director_id,
    CONCAT(u.name, ' ', u.surname) as director_name,
    o.power_of_attorney_number,
    o.poa_issue_date, 
    o.poa_expiration_date, 
    o.logo
FROM organization_units o
LEFT JOIN property_types pt ON o.property_type_id = pt.id
LEFT JOIN organization_roles r ON o.role_id = r.id
LEFT JOIN users u ON o.director_id = u.id
ORDER BY o.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountOrganizations :one
SELECT COUNT(*) FROM organization_units;

-- name: GetOrganizationByID :one
SELECT 
    o.id, 
    o.property_type_id,                    -- ← добавить
    pt.property_type as property_type_name,
    o.name, 
    o.short_name, 
    o.inn, 
    o.kpp, 
    o.address,
    o.parent_id, 
    o.role_id, 
    r.title as role_title,
    o.director_id,
    CONCAT(u.name, ' ', u.surname) as director_name,
    o.power_of_attorney_number,
    o.poa_issue_date, 
    o.poa_expiration_date, 
    o.logo
FROM organization_units o
LEFT JOIN property_types pt ON o.property_type_id = pt.id
LEFT JOIN organization_roles r ON o.role_id = r.id
LEFT JOIN users u ON o.director_id = u.id
WHERE o.id = $1;

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
