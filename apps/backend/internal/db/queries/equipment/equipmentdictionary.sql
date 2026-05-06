-- name: CreateEquipmentDictionary :one
INSERT INTO equipment_dictionaries (
    full_name, model, measuring_instruments_dictionary_id
) VALUES (
    $1, $2, $3
)
RETURNING id, full_name, model, measuring_instruments_dictionary_id;

-- name: GetEquipmentDictionaryByID :one
SELECT 
    ed.id,
    ed.full_name,
    ed.model,
    ed.measuring_instruments_dictionary_id,
    mid.registry_number,
    mid.metrological_operation_type_id,
    mt.metrological_operation_type
FROM equipment_dictionaries ed
LEFT JOIN measuring_instruments_dictionaries mid ON ed.measuring_instruments_dictionary_id = mid.id
LEFT JOIN metrological_types mt ON mid.metrological_operation_type_id = mt.id
WHERE ed.id = $1;

-- name: ListEquipmentDictionaries :many
SELECT 
    ed.id,
    ed.full_name,
    ed.model,
    ed.measuring_instruments_dictionary_id,
    mid.registry_number,
    mid.metrological_operation_type_id,
    mt.metrological_operation_type
FROM equipment_dictionaries ed
LEFT JOIN measuring_instruments_dictionaries mid ON ed.measuring_instruments_dictionary_id = mid.id
LEFT JOIN metrological_types mt ON mid.metrological_operation_type_id = mt.id
ORDER BY ed.created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateEquipmentDictionary :one
UPDATE equipment_dictionaries SET
    full_name = COALESCE($2, full_name),
    model = COALESCE($3, model),
    measuring_instruments_dictionary_id = COALESCE($4, measuring_instruments_dictionary_id),
    updated_at = NOW()
WHERE id = $1
RETURNING id, full_name, model, measuring_instruments_dictionary_id;

-- name: DeleteEquipmentDictionary :exec
DELETE FROM equipment_dictionaries WHERE id = $1;

-- name: CountEquipmentDictionaries :one
SELECT COUNT(*) FROM equipment_dictionaries;

-- name: EquipmentDictionaryExists :one
SELECT EXISTS(SELECT 1 FROM equipment_dictionaries WHERE id = $1);

-- =====================================================
-- Операции с measuring_instruments_dictionaries
-- =====================================================
-- name: CreateMeasuringInstrumentsDictionary :one
INSERT INTO measuring_instruments_dictionaries (
    registry_number, metrological_operation_type_id
) VALUES (
    $1, $2
)
RETURNING id, registry_number, metrological_operation_type_id;

-- name: GetMeasuringInstrumentsDictionaryByID :one
SELECT id, registry_number, metrological_operation_type_id
FROM measuring_instruments_dictionaries
WHERE id = $1;

-- name: UpdateMeasuringInstrumentsDictionary :one
UPDATE measuring_instruments_dictionaries SET
    registry_number = COALESCE($2, registry_number),
    metrological_operation_type_id = COALESCE($3, metrological_operation_type_id),
    updated_at = NOW()
WHERE id = $1
RETURNING id, registry_number, metrological_operation_type_id;

-- name: DeleteMeasuringInstrumentsDictionary :exec
DELETE FROM measuring_instruments_dictionaries WHERE id = $1;

-- name: ExistsMIDByRegistryNumber :one
SELECT EXISTS(SELECT 1 FROM measuring_instruments_dictionaries WHERE registry_number = $1);

-- =====================================================
-- Операции с standards_dictionaries
-- =====================================================
-- name: CreateStandardsDictionary :one
INSERT INTO standards_dictionaries (
    measuring_instruments_dictionary_id, model
) VALUES (
    $1, $2
)
RETURNING id, measuring_instruments_dictionary_id, model;

-- name: ListStandardsDictionariesByMID :many
SELECT id, measuring_instruments_dictionary_id, model
FROM standards_dictionaries
WHERE measuring_instruments_dictionary_id = $1;

-- name: DeleteStandardsDictionary :exec
DELETE FROM standards_dictionaries WHERE id = $1;

-- name: DeleteStandardsDictionariesByMID :exec
DELETE FROM standards_dictionaries WHERE measuring_instruments_dictionary_id = $1;

