-- name: CreateUsageClassification :one
INSERT INTO usage_classifications (classification) VALUES ($1)
RETURNING id, classification;

-- name: GetUsageClassificationByID :one
SELECT id, classification FROM usage_classifications WHERE id = $1;

-- name: ListUsageClassifications :many
SELECT id, classification FROM usage_classifications
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: DeleteUsageClassification :exec
DELETE FROM usage_classifications WHERE id = $1;

-- name: CountUsageClassifications :one
SELECT COUNT(*) FROM usage_classifications;

-- name: UsageClassificationExists :one
SELECT EXISTS(SELECT 1 FROM usage_classifications WHERE id = $1);

-- name: GetUsageClassificationByClassification :one
SELECT id, classification
FROM usage_classifications
WHERE classification = $1;
