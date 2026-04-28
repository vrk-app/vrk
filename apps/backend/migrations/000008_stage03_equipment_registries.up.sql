BEGIN;

CREATE TABLE registry_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES auth_bootstrap_organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES auth_units(id) ON DELETE RESTRICT,
    manufacturer TEXT NOT NULL,
    classification TEXT NOT NULL,
    model TEXT NOT NULL,
    full_name TEXT NOT NULL,
    factory_number TEXT NOT NULL,
    inventory_number TEXT,
    manufacture_year INTEGER NOT NULL CHECK (manufacture_year BETWEEN 1900 AND 2100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'retired')),
    comment TEXT,
    document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registry_equipment_organization_id ON registry_equipment (organization_id);
CREATE INDEX idx_registry_equipment_unit_id ON registry_equipment (unit_id);

CREATE TABLE registry_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES auth_bootstrap_organizations(id) ON DELETE CASCADE,
    subdivision_id UUID REFERENCES auth_subdivisions(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES auth_units(id) ON DELETE SET NULL,
    owner_label TEXT,
    standard_type TEXT NOT NULL,
    model TEXT NOT NULL,
    identifier TEXT NOT NULL,
    serial_number TEXT,
    metrological_characteristics TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'retired')),
    comment TEXT,
    document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_registry_standards_scope_exclusive CHECK (
        NOT (subdivision_id IS NOT NULL AND unit_id IS NOT NULL)
    )
);

CREATE INDEX idx_registry_standards_organization_id ON registry_standards (organization_id);
CREATE INDEX idx_registry_standards_subdivision_id ON registry_standards (subdivision_id);
CREATE INDEX idx_registry_standards_unit_id ON registry_standards (unit_id);

CREATE TABLE registry_measuring_instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES auth_bootstrap_organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES auth_units(id) ON DELETE RESTRICT,
    equipment_id UUID REFERENCES registry_equipment(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    instrument_type TEXT NOT NULL,
    model TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'retired')),
    placement_kind VARCHAR(20) NOT NULL CHECK (placement_kind IN ('standalone', 'built_in')),
    comment TEXT,
    document_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_registry_measuring_instruments_placement CHECK (
        (placement_kind = 'standalone' AND equipment_id IS NULL) OR
        (placement_kind = 'built_in' AND equipment_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX uq_registry_measuring_instruments_registration_number
    ON registry_measuring_instruments (organization_id, registration_number);
CREATE INDEX idx_registry_measuring_instruments_organization_id ON registry_measuring_instruments (organization_id);
CREATE INDEX idx_registry_measuring_instruments_unit_id ON registry_measuring_instruments (unit_id);
CREATE INDEX idx_registry_measuring_instruments_equipment_id ON registry_measuring_instruments (equipment_id);

CREATE TABLE registry_measuring_instrument_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    measuring_instrument_id UUID NOT NULL REFERENCES registry_measuring_instruments(id) ON DELETE CASCADE,
    standard_id UUID NOT NULL REFERENCES registry_standards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (measuring_instrument_id, standard_id)
);

CREATE INDEX idx_registry_measuring_instrument_standards_instrument_id
    ON registry_measuring_instrument_standards (measuring_instrument_id);
CREATE INDEX idx_registry_measuring_instrument_standards_standard_id
    ON registry_measuring_instrument_standards (standard_id);

COMMIT;
