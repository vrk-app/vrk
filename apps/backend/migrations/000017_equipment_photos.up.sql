BEGIN;

CREATE TABLE registry_equipment_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES auth_bootstrap_organizations(id) ON DELETE CASCADE,
    subject_type VARCHAR(32) NOT NULL CHECK (subject_type IN ('technical_equipment', 'diagnostic_equipment')),
    subject_id UUID NOT NULL,
    object_key TEXT NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(64) NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registry_equipment_photos_subject
    ON registry_equipment_photos (organization_id, subject_type, subject_id, sort_order, created_at);

CREATE INDEX idx_registry_equipment_photos_object_key
    ON registry_equipment_photos (object_key);

COMMIT;
