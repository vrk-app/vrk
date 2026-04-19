BEGIN;

DROP INDEX IF EXISTS agreements_status_dates_idx;
DROP INDEX IF EXISTS agreements_contractor_org_created_idx;
DROP INDEX IF EXISTS agreements_customer_org_created_idx;
DROP INDEX IF EXISTS agreements_customer_contract_number_uidx;

ALTER TABLE agreements
    DROP COLUMN IF EXISTS location_scope_label,
    DROP COLUMN IF EXISTS unit_id,
    DROP COLUMN IF EXISTS subdivision_id,
    DROP COLUMN IF EXISTS region,
    DROP COLUMN IF EXISTS equipment_type,
    DROP COLUMN IF EXISTS work_type,
    DROP COLUMN IF EXISTS contract_status,
    DROP COLUMN IF EXISTS contract_number,
    DROP COLUMN IF EXISTS contractor_organization_id,
    DROP COLUMN IF EXISTS customer_organization_id;

ALTER TABLE agreements
    ALTER COLUMN source SET NOT NULL,
    ALTER COLUMN factory_id SET NOT NULL,
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN number SET NOT NULL,
    ALTER COLUMN subject_of_agreement SET NOT NULL,
    ALTER COLUMN schedule_id SET NOT NULL;

COMMIT;
