-- name: CreateManufacturer :one
INSERT INTO manufacturers (
    name, classification_id
) VALUES (
    $1, $2
)
RETURNING id, name, classification_id;

-- name: GetManufacturerByID :one
SELECT id, name, classification_id
FROM manufacturers
WHERE id = $1;

-- name: GetManufacturerByName :one
SELECT id, name, classification_id
FROM manufacturers
WHERE name = $1;

-- name: ListManufacturers :many
SELECT id, name, classification_id
FROM manufacturers
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateManufacturer :one
UPDATE manufacturers SET
    name = $2,
    classification_id = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING id, name, classification_id;

-- name: DeleteManufacturer :exec
DELETE FROM manufacturers WHERE id = $1;

-- name: CountManufacturers :one
SELECT COUNT(*) FROM manufacturers;

-- name: ManufacturerExists :one
SELECT EXISTS(SELECT 1 FROM manufacturers WHERE id = $1);