-- name: CreateAgreement :one
WITH inserted AS (
    INSERT INTO agreements (
        customer_organization_id,
        contractor_organization_id,
        contract_number,
        contract_status,
        start_date,
        end_date,
        work_type,
        equipment_type,
        region,
        division_id,
        unit_id,
        location_scope_label,
        source,
        subject_of_agreement
    ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14
    )
    RETURNING *
)
SELECT
    a.id,
    a.customer_organization_id,
    customer.shell_name AS customer_organization_name,
    a.contractor_organization_id,
    contractor.shell_name AS contractor_organization_name,
    a.contract_number,
    a.contract_status,
    a.start_date,
    a.end_date,
    a.work_type,
    a.equipment_type,
    a.region,
    a.division_id,
    division.name AS division_name,
    a.unit_id,
    unit.name AS unit_name,
    a.location_scope_label,
    a.source,
    a.subject_of_agreement,
    a.created_at,
    a.updated_at
FROM inserted a
JOIN auth_bootstrap_organizations customer ON customer.id = a.customer_organization_id
JOIN auth_bootstrap_organizations contractor ON contractor.id = a.contractor_organization_id
LEFT JOIN auth_divisions division ON division.id = a.division_id
LEFT JOIN auth_units unit ON unit.id = a.unit_id;

-- name: GetAgreementByID :one
SELECT
    a.id,
    a.customer_organization_id,
    customer.shell_name AS customer_organization_name,
    a.contractor_organization_id,
    contractor.shell_name AS contractor_organization_name,
    a.contract_number,
    a.contract_status,
    a.start_date,
    a.end_date,
    a.work_type,
    a.equipment_type,
    a.region,
    a.division_id,
    division.name AS division_name,
    a.unit_id,
    unit.name AS unit_name,
    a.location_scope_label,
    a.source,
    a.subject_of_agreement,
    a.created_at,
    a.updated_at
FROM agreements a
JOIN auth_bootstrap_organizations customer ON customer.id = a.customer_organization_id
JOIN auth_bootstrap_organizations contractor ON contractor.id = a.contractor_organization_id
LEFT JOIN auth_divisions division ON division.id = a.division_id
LEFT JOIN auth_units unit ON unit.id = a.unit_id
WHERE a.id = $1
  AND a.customer_organization_id IS NOT NULL;

-- name: ListAgreementsByCustomerOrganization :many
SELECT
    a.id,
    a.customer_organization_id,
    customer.shell_name AS customer_organization_name,
    a.contractor_organization_id,
    contractor.shell_name AS contractor_organization_name,
    a.contract_number,
    a.contract_status,
    a.start_date,
    a.end_date,
    a.work_type,
    a.equipment_type,
    a.region,
    a.division_id,
    division.name AS division_name,
    a.unit_id,
    unit.name AS unit_name,
    a.location_scope_label,
    a.source,
    a.subject_of_agreement,
    a.created_at,
    a.updated_at
FROM agreements a
JOIN auth_bootstrap_organizations customer ON customer.id = a.customer_organization_id
JOIN auth_bootstrap_organizations contractor ON contractor.id = a.contractor_organization_id
LEFT JOIN auth_divisions division ON division.id = a.division_id
LEFT JOIN auth_units unit ON unit.id = a.unit_id
WHERE a.customer_organization_id = $1
ORDER BY a.created_at DESC;

-- name: ListAgreementsByContractorOrganization :many
SELECT
    a.id,
    a.customer_organization_id,
    customer.shell_name AS customer_organization_name,
    a.contractor_organization_id,
    contractor.shell_name AS contractor_organization_name,
    a.contract_number,
    a.contract_status,
    a.start_date,
    a.end_date,
    a.work_type,
    a.equipment_type,
    a.region,
    a.division_id,
    division.name AS division_name,
    a.unit_id,
    unit.name AS unit_name,
    a.location_scope_label,
    a.source,
    a.subject_of_agreement,
    a.created_at,
    a.updated_at
FROM agreements a
JOIN auth_bootstrap_organizations customer ON customer.id = a.customer_organization_id
JOIN auth_bootstrap_organizations contractor ON contractor.id = a.contractor_organization_id
LEFT JOIN auth_divisions division ON division.id = a.division_id
LEFT JOIN auth_units unit ON unit.id = a.unit_id
WHERE a.contractor_organization_id = $1
ORDER BY a.created_at DESC;

-- name: UpdateAgreement :one
UPDATE agreements
SET
    contractor_organization_id = COALESCE($2, contractor_organization_id),
    contract_number = COALESCE($3, contract_number),
    contract_status = COALESCE($4, contract_status),
    start_date = COALESCE($5, start_date),
    end_date = COALESCE($6, end_date),
    work_type = COALESCE($7, work_type),
    equipment_type = COALESCE($8, equipment_type),
    region = COALESCE($9, region),
    division_id = $10,
    unit_id = $11,
    location_scope_label = $12,
    source = $13,
    subject_of_agreement = $14,
    updated_at = NOW()
WHERE id = $1
  AND updated_at = $15
RETURNING
    id,
    customer_organization_id,
    contractor_organization_id,
    contract_number,
    contract_status,
    start_date,
    end_date,
    work_type,
    equipment_type,
    region,
    division_id,
    unit_id,
    location_scope_label,
    source,
    subject_of_agreement,
    created_at,
    updated_at;

-- name: DeleteAgreement :exec
DELETE FROM agreements
WHERE id = $1;

-- name: AgreementExists :one
SELECT EXISTS(
    SELECT 1
    FROM agreements
    WHERE id = $1
      AND customer_organization_id IS NOT NULL
);

-- name: ListActiveContractorOrganizations :many
SELECT
    id,
    shell_name,
    short_name,
    launch_state
FROM auth_bootstrap_organizations
WHERE role_title = 'contractor'
  AND launch_state = 'active'
ORDER BY shell_name ASC;

-- name: GetActiveContractorOrganizationByID :one
SELECT
    id,
    shell_name,
    short_name,
    launch_state
FROM auth_bootstrap_organizations
WHERE id = $1
  AND role_title = 'contractor'
  AND launch_state = 'active'
LIMIT 1;
