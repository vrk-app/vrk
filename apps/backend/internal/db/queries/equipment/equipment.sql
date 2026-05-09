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
    s.id,
    s.certificate_number,
    s.last_operation_date,
    s.next_operation_date,
    s.document_provider_organization,
    s.document_url,
    s.metrological_characteristics,
    sd.model
FROM standards s
LEFT JOIN standards_dictionaries sd ON s.standards_dictionary_id = sd.id
WHERE s.equipment_id = $1;

-- name: UpdateEquipment :one
UPDATE equipment SET
    manufacturer_id = $2,
    factory_number = $3,
    inventory_number = $4,
    manufacture_year = $5,
    organization_id = $6,
    status_id = $7,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteEquipment :exec
DELETE FROM equipment WHERE id = $1;

-- name: CountEquipment :one
SELECT COUNT(*) FROM equipment;

-- name: EquipmentExists :one
SELECT EXISTS(SELECT 1 FROM equipment WHERE id = $1);

-- name: EquipmentStatusExists :one
SELECT EXISTS(SELECT 1 FROM equipment_statuses WHERE id = $1);

-- name: CreateMeasuringInstrument :one
INSERT INTO measuring_instruments (
    equipment_id, metrological_operation_type_id, certificate_number,
    last_operation_date, next_operation_date, document_provider_organization,
    document_url
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: GetStandardDictionaryIDByModelAndMID :one
SELECT id FROM standards_dictionaries
WHERE model = $1 AND measuring_instruments_dictionary_id = $2;

-- name: CreateStandard :one
INSERT INTO standards (
    equipment_id, standards_dictionary_id, certificate_number,
    last_operation_date, next_operation_date, document_provider_organization,
    document_url, metrological_characteristics
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
RETURNING *;

-- name: DeleteStandardsByEquipmentID :exec
DELETE FROM standards WHERE equipment_id = $1;

-- name: UpdateStandard :one
UPDATE standards SET
    standards_dictionary_id = COALESCE($2, standards_dictionary_id),
    certificate_number = COALESCE($3, certificate_number),
    last_operation_date = COALESCE($4, last_operation_date),
    next_operation_date = COALESCE($5, next_operation_date),
    document_provider_organization = COALESCE($6, document_provider_organization),
    document_url = COALESCE($7, document_url),
    metrological_characteristics = COALESCE($8, metrological_characteristics),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: StandardExistsForEquipment :one
SELECT EXISTS(SELECT 1 FROM standards WHERE id = $1 AND equipment_id = $2);

-- name: GetMeasuringInstrumentByEquipmentID :one
SELECT 
    id, equipment_id, metrological_operation_type_id, certificate_number,
    last_operation_date, next_operation_date, document_provider_organization, document_url
FROM measuring_instruments
WHERE equipment_id = $1;

-- name: UpdateMeasuringInstrument :one
UPDATE measuring_instruments SET
    metrological_operation_type_id = COALESCE($2, metrological_operation_type_id),
    certificate_number = COALESCE($3, certificate_number),
    last_operation_date = COALESCE($4, last_operation_date),
    next_operation_date = COALESCE($5, next_operation_date),
    document_provider_organization = COALESCE($6, document_provider_organization),
    document_url = COALESCE($7, document_url),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteMeasuringInstrumentByEquipmentID :exec
DELETE FROM measuring_instruments WHERE equipment_id = $1;
