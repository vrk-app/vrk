-- name: CreateAgreement :one
INSERT INTO agreements (
    source, factory_id, organization_id, number, start_date, end_date,
    subject_of_agreement, schedule_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
RETURNING id, source, factory_id, organization_id, number, start_date, end_date,
          subject_of_agreement, schedule_id;

-- name: GetAgreementByID :one
SELECT id, source, factory_id, organization_id, number, start_date, end_date,
       subject_of_agreement, schedule_id
FROM agreements WHERE id = $1;

-- name: ListAgreements :many
SELECT id, source, factory_id, organization_id, number, start_date, end_date,
       subject_of_agreement, schedule_id
FROM agreements
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: UpdateAgreement :one
UPDATE agreements SET
    source = COALESCE($2, source),
    factory_id = COALESCE($3, factory_id),
    organization_id = COALESCE($4, organization_id),
    number = COALESCE($5, number),
    start_date = COALESCE($6, start_date),
    end_date = COALESCE($7, end_date),
    subject_of_agreement = COALESCE($8, subject_of_agreement),
    schedule_id = COALESCE($9, schedule_id),
    updated_at = NOW()
WHERE id = $1
RETURNING id, source, factory_id, organization_id, number, start_date, end_date,
          subject_of_agreement, schedule_id;

-- name: DeleteAgreement :exec
DELETE FROM agreements WHERE id = $1;

-- name: CountAgreements :one
SELECT COUNT(*) FROM agreements;

-- name: AgreementExists :one
SELECT EXISTS(SELECT 1 FROM agreements WHERE id = $1);