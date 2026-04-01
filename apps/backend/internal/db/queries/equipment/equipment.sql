-- name: CreateEquipment :one
INSERT INTO equipment (
    factory_number, inventory_number, manufacture_year, registration_year,
    equipment_dictionary_id, organization_id, status_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING id, factory_number, inventory_number, manufacture_year, registration_year,
    equipment_dictionary_id, organization_id, status_id;

-- name: GetEquipmentByID :one
SELECT id, factory_number, inventory_number, manufacture_year, registration_year,
    equipment_dictionary_id, organization_id, status_id
FROM equipment WHERE id = $1;

-- name: ListEquipment :many
SELECT id, factory_number, inventory_number, manufacture_year, registration_year,
    equipment_dictionary_id, organization_id, status_id
FROM equipment
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateEquipment :one
UPDATE equipment SET
    factory_number = $2,
    inventory_number = $3,
    manufacture_year = $4,
    registration_year = $5,
    equipment_dictionary_id = $6,
    organization_id = $7,
    status_id = $8,
    updated_at = NOW()
WHERE id = $1
RETURNING id, factory_number, inventory_number, manufacture_year, registration_year,
    equipment_dictionary_id, organization_id, status_id;

-- name: DeleteEquipment :exec
DELETE FROM equipment WHERE id = $1;

-- name: CountEquipment :one
SELECT COUNT(*) FROM equipment;

-- name: EquipmentExists :one
SELECT EXISTS(SELECT 1 FROM equipment WHERE id = $1);