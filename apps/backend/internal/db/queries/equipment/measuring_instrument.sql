-- name: CreateMeasuringInstrument :one
INSERT INTO measuring_instruments (
    registry_number, metrological_operation_type_id, certificate_number,
    last_operation_date, next_operation_date, document_provider_organization,
    document_url, standard_id, organization_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
)
RETURNING id, registry_number, metrological_operation_type_id, certificate_number,
    last_operation_date, next_operation_date, document_provider_organization,
    document_url, standard_id, organization_id;

-- name: GetMeasuringInstrumentByID :one
SELECT id, registry_number, metrological_operation_type_id, certificate_number,
    last_operation_date, next_operation_date, document_provider_organization,
    document_url, standard_id, organization_id
FROM measuring_instruments WHERE id = $1;

-- name: ListMeasuringInstruments :many
SELECT id, registry_number, metrological_operation_type_id, certificate_number,
    last_operation_date, next_operation_date, document_provider_organization,
    document_url, standard_id, organization_id
FROM measuring_instruments
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateMeasuringInstrument :one
UPDATE measuring_instruments SET
    registry_number = $2,
    metrological_operation_type_id = $3,
    certificate_number = $4,
    last_operation_date = $5,
    next_operation_date = $6,
    document_provider_organization = $7,
    document_url = $8,
    standard_id = $9,
    organization_id = $10,
    updated_at = NOW()
WHERE id = $1
RETURNING id, registry_number, metrological_operation_type_id, certificate_number,
    last_operation_date, next_operation_date, document_provider_organization,
    document_url, standard_id, organization_id;

-- name: DeleteMeasuringInstrument :exec
DELETE FROM measuring_instruments WHERE id = $1;

-- name: CountMeasuringInstruments :one
SELECT COUNT(*) FROM measuring_instruments;

-- name: MeasuringInstrumentExists :one
SELECT EXISTS(SELECT 1 FROM measuring_instruments WHERE id = $1);