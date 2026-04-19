BEGIN;

ALTER TABLE registry_equipment
    ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE registry_measuring_instruments
    ADD COLUMN archived_at TIMESTAMPTZ;

ALTER TABLE registry_standards
    ADD COLUMN archived_at TIMESTAMPTZ;

CREATE TABLE registry_metrology_journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES auth_bootstrap_organizations(id) ON DELETE CASCADE,
    subject_type VARCHAR(32) NOT NULL CHECK (subject_type IN ('measuring_instrument', 'standard')),
    subject_id UUID NOT NULL,
    operation_type VARCHAR(32) NOT NULL CHECK (
        operation_type IN ('verification', 'calibration', 'maintenance', 'suspension', 'decommission')
    ),
    operation_date DATE NOT NULL,
    document_number TEXT NOT NULL,
    valid_until DATE,
    executor_organization TEXT NOT NULL,
    attachment_url TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registry_metrology_journal_entries_subject
    ON registry_metrology_journal_entries (subject_type, subject_id, operation_date DESC, created_at DESC);
CREATE INDEX idx_registry_metrology_journal_entries_organization_id
    ON registry_metrology_journal_entries (organization_id);

COMMIT;
