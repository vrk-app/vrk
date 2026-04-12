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
SELECT 
    e.id,
    e.factory_number,
    e.inventory_number,
    e.manufacture_year,
    e.registration_year,
    e.equipment_dictionary_id,
    ed.full_name as equipment_name,
    ed.model,
    ed.manufacturer,
    uc.classification as usage_classification,
    e.organization_id,
    ou.name as organization_name,
    e.status_id,
    es.status as status_name
FROM equipment e
LEFT JOIN equipment_dictionaries ed ON e.equipment_dictionary_id = ed.id
LEFT JOIN usage_classifications uc ON ed.classification_id = uc.id
LEFT JOIN organization_units ou ON e.organization_id = ou.id
LEFT JOIN equipment_status es ON e.status_id = es.id
WHERE e.id = $1;

-- name: ListEquipment :many
SELECT 
    e.id,
    e.factory_number,
    e.inventory_number,
    e.manufacture_year,
    e.registration_year,
    e.equipment_dictionary_id,
    ed.full_name as equipment_name,
    ed.model,
    ed.manufacturer,
    uc.classification as usage_classification,
    e.organization_id,
    ou.name as organization_name,
    e.status_id,
    es.status as status_name
FROM equipment e
LEFT JOIN equipment_dictionaries ed ON e.equipment_dictionary_id = ed.id
LEFT JOIN usage_classifications uc ON ed.classification_id = uc.id
LEFT JOIN organization_units ou ON e.organization_id = ou.id
LEFT JOIN equipment_status es ON e.status_id = es.id
ORDER BY e.created_at DESC
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