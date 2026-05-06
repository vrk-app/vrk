-- name: CreateMetrologicalType :one
INSERT INTO metrological_types (metrological_operation_type) VALUES ($1)
RETURNING id, metrological_operation_type;

-- name: GetMetrologicalTypeByID :one
SELECT id, metrological_operation_type FROM metrological_types WHERE id = $1;

-- name: GetMetrologicalTypeByOperationType :one
SELECT id, metrological_operation_type FROM metrological_types WHERE metrological_operation_type = $1;

-- name: ListMetrologicalTypes :many
SELECT id, metrological_operation_type FROM metrological_types
LIMIT $1 OFFSET $2;

-- name: DeleteMetrologicalType :exec
DELETE FROM metrological_types WHERE id = $1;

-- name: CountMetrologicalTypes :one
SELECT COUNT(*) FROM metrological_types;

-- name: MetrologicalTypeExists :one
SELECT EXISTS(SELECT 1 FROM metrological_types WHERE id = $1);
