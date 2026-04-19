BEGIN;

ALTER TABLE agreements
    ALTER COLUMN source DROP NOT NULL,
    ALTER COLUMN factory_id DROP NOT NULL,
    ALTER COLUMN organization_id DROP NOT NULL,
    ALTER COLUMN number DROP NOT NULL,
    ALTER COLUMN subject_of_agreement DROP NOT NULL,
    ALTER COLUMN schedule_id DROP NOT NULL;

ALTER TABLE agreements
    ADD COLUMN customer_organization_id UUID REFERENCES auth_bootstrap_organizations(id) ON DELETE RESTRICT,
    ADD COLUMN contractor_organization_id UUID REFERENCES auth_bootstrap_organizations(id) ON DELETE RESTRICT,
    ADD COLUMN contract_number VARCHAR(120),
    ADD COLUMN contract_status VARCHAR(20) DEFAULT 'inactive' CHECK (contract_status IN ('inactive', 'active', 'expired')),
    ADD COLUMN work_type VARCHAR(60),
    ADD COLUMN equipment_type VARCHAR(120),
    ADD COLUMN region VARCHAR(120),
    ADD COLUMN subdivision_id UUID REFERENCES auth_subdivisions(id) ON DELETE SET NULL,
    ADD COLUMN unit_id UUID REFERENCES auth_units(id) ON DELETE SET NULL,
    ADD COLUMN location_scope_label VARCHAR(200);

CREATE INDEX agreements_customer_org_created_idx
    ON agreements (customer_organization_id, created_at DESC)
    WHERE customer_organization_id IS NOT NULL;

CREATE INDEX agreements_contractor_org_created_idx
    ON agreements (contractor_organization_id, created_at DESC)
    WHERE contractor_organization_id IS NOT NULL;

CREATE INDEX agreements_status_dates_idx
    ON agreements (contract_status, start_date, end_date)
    WHERE customer_organization_id IS NOT NULL;

CREATE UNIQUE INDEX agreements_customer_contract_number_uidx
    ON agreements (customer_organization_id, contract_number)
    WHERE customer_organization_id IS NOT NULL
      AND contract_number IS NOT NULL;

COMMIT;
