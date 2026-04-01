-- name: CreateStandard :one
INSERT INTO standards (
    model, certificate_number, last_operation_date, next_operation_date, document_url,
    document_provider_organization, metrological_characteristics
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING id, model, certificate_number, last_operation_date, next_operation_date,
    document_provider_organization, document_url, metrological_characteristics;

-- name: GetStandardByID :one
SELECT id, model, certificate_number, last_operation_date, next_operation_date,
    document_provider_organization, document_url, metrological_characteristics
FROM standards
WHERE id = $1;

-- name: ListStandards :many
SELECT id, model, certificate_number, last_operation_date, next_operation_date,
    document_provider_organization, document_url, metrological_characteristics
FROM standards
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateStandard :one
UPDATE standards SET
    model = $2,
    certificate_number = $3,
    last_operation_date = $4,
    next_operation_date = $5,
    document_provider_organization = $6,
    document_url = $7,
    metrological_characteristics = $8,
    updated_at = NOW()
WHERE id = $1
RETURNING id, model, certificate_number, last_operation_date, next_operation_date,
    document_provider_organization, document_url, metrological_characteristics;

-- name: DeleteStandard :exec
DELETE FROM standards WHERE id = $1;

-- name: CountStandards :one
SELECT COUNT(*) FROM standards;

-- name: StandardExists :one
SELECT EXISTS(SELECT 1 FROM standards WHERE id = $1);