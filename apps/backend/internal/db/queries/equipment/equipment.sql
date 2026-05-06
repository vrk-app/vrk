-- name: CreateEquipment :one
INSERT INTO equipment (
    manufacturer_id, equipment_dictionary_id, factory_number, inventory_number, 
    manufacture_year, organization_id, status_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING id, manufacturer_id, equipment_dictionary_id, factory_number, inventory_number, 
    manufacture_year, organization_id, status_id, created_at, updated_at;

-- name: GetEquipmentByID :one
SELECT 
    e.id,
    e.manufacturer_id,
    m.name as manufacturer_name,
    uc.classification as usage_classification,
    e.equipment_dictionary_id,
    ed.full_name as equipment_name,
    ed.model,
    ed.measuring_instruments_dictionary_id,
    mid.registry_number,
    mt.metrological_operation_type,
    e.factory_number,
    e.inventory_number,
    e.manufacture_year,
    e.organization_id,
    ou.name as organization_name,
    e.status_id,
    es.status as status_name,
    e.created_at,
    e.updated_at,
    -- Данные средства измерения
    mi.id as measuring_instrument_id,
    mi.certificate_number as mi_certificate_number,
    mi.last_operation_date as mi_last_operation_date,
    mi.next_operation_date as mi_next_operation_date,
    mi.document_provider_organization as mi_document_provider_organization,
    mi.document_url as mi_document_url,
    -- Данные эталона
    s.id as standard_id,
    s.certificate_number as std_certificate_number,
    s.last_operation_date as std_last_operation_date,
    s.next_operation_date as std_next_operation_date,
    s.document_provider_organization as std_document_provider_organization,
    s.document_url as std_document_url,
    s.metrological_characteristics as std_metrological_characteristics
FROM equipment e
LEFT JOIN manufacturers m ON e.manufacturer_id = m.id
LEFT JOIN usage_classifications uc ON m.classification_id = uc.id
LEFT JOIN equipment_dictionaries ed ON e.equipment_dictionary_id = ed.id
LEFT JOIN measuring_instruments_dictionaries mid ON ed.measuring_instruments_dictionary_id = mid.id
LEFT JOIN metrological_types mt ON mid.metrological_operation_type_id = mt.id
LEFT JOIN organization_units ou ON e.organization_id = ou.id
LEFT JOIN equipment_statuses es ON e.status_id = es.id
LEFT JOIN measuring_instruments mi ON e.id = mi.equipment_id
LEFT JOIN standards s ON e.id = s.equipment_id
WHERE e.id = $1;

-- name: ListEquipment :many
SELECT 
    e.id,
    e.manufacturer_id,
    m.name as manufacturer_name,
    uc.classification as usage_classification,
    e.equipment_dictionary_id,
    ed.full_name as equipment_name,
    ed.model,
    ed.measuring_instruments_dictionary_id,
    mid.registry_number,
    mt.metrological_operation_type,
    e.factory_number,
    e.inventory_number,
    e.manufacture_year,
    e.organization_id,
    ou.name as organization_name,
    e.status_id,
    es.status as status_name,
    e.created_at,
    e.updated_at,
    -- Данные средства измерения
    mi.id as measuring_instrument_id,
    mi.certificate_number as mi_certificate_number,
    mi.last_operation_date as mi_last_operation_date,
    mi.next_operation_date as mi_next_operation_date,
    mi.document_provider_organization as mi_document_provider_organization,
    mi.document_url as mi_document_url
FROM equipment e
LEFT JOIN manufacturers m ON e.manufacturer_id = m.id
LEFT JOIN usage_classifications uc ON m.classification_id = uc.id
LEFT JOIN equipment_dictionaries ed ON e.equipment_dictionary_id = ed.id
LEFT JOIN measuring_instruments_dictionaries mid ON ed.measuring_instruments_dictionary_id = mid.id
LEFT JOIN metrological_types mt ON mid.metrological_operation_type_id = mt.id
LEFT JOIN organization_units ou ON e.organization_id = ou.id
LEFT JOIN equipment_statuses es ON e.status_id = es.id
LEFT JOIN measuring_instruments mi ON e.id = mi.equipment_id
ORDER BY e.created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListStandardsByEquipmentID :many
SELECT 
    id,
    certificate_number,
    last_operation_date,
    next_operation_date,
    document_provider_organization,
    document_url,
    metrological_characteristics
FROM standards
WHERE equipment_id = $1;

-- name: UpdateEquipment :one
UPDATE equipment SET
    factory_number = $2,
    inventory_number = $3,
    manufacture_year = $4,
    equipment_dictionary_id = $5,
    organization_id = $6,
    status_id = $7,
    updated_at = NOW()
WHERE id = $1
RETURNING id, factory_number, inventory_number, manufacture_year,
    equipment_dictionary_id, organization_id, status_id;

-- name: DeleteEquipment :exec
DELETE FROM equipment WHERE id = $1;

-- name: CountEquipment :one
SELECT COUNT(*) FROM equipment;

-- name: EquipmentExists :one
SELECT EXISTS(SELECT 1 FROM equipment WHERE id = $1);

-- name: CreateMeasuringInstrument :one
INSERT INTO measuring_instruments (
    equipment_id, metrological_operation_type_id, certificate_number,
    last_operation_date, next_operation_date, document_provider_organization,
    document_url
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;