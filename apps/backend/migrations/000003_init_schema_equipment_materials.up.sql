-- migrations/000003_equipment_materials.up.sql
BEGIN;

-- =============================================================================
-- 1. Справочники
-- =============================================================================

CREATE TABLE usage_classifications (
    id SERIAL PRIMARY KEY,
    classification VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipment_statuses (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE metrological_types (
    id SERIAL PRIMARY KEY,
    metrological_operation_type VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. Словари и справочники оборудования
-- =============================================================================

CREATE TABLE manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    classification_id INT NOT NULL REFERENCES usage_classifications(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE measuring_instruments_dictionaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_number VARCHAR(50) NOT NULL UNIQUE,
    metrological_operation_type_id INT REFERENCES metrological_types(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE equipment_dictionaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    measuring_instruments_dictionary_id UUID NOT NULL REFERENCES measuring_instruments_dictionaries(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE standards_dictionaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    measuring_instruments_dictionary_id UUID NOT NULL REFERENCES measuring_instruments_dictionaries(id) ON DELETE RESTRICT,
    model VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. Склады и материалы
-- =============================================================================

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organization_units(id) ON DELETE RESTRICT,
    location VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    amount NUMERIC(12,5) NOT NULL CHECK (amount >= 0),
    unit VARCHAR(10) NOT NULL,
    price INT NOT NULL CHECK (price >= 0),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. Оборудование
-- =============================================================================

CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE RESTRICT,
    equipment_dictionary_id UUID NOT NULL REFERENCES equipment_dictionaries(id) ON DELETE RESTRICT,
    factory_number VARCHAR(50) NOT NULL,
    inventory_number VARCHAR(50),
    manufacture_year DATE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organization_units(id) ON DELETE RESTRICT,
    status_id SMALLINT NOT NULL REFERENCES equipment_statuses(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связь заявок и оборудования (Many-to-Many)
CREATE TABLE application_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (application_id, equipment_id)
);

-- =============================================================================
-- 5. Метрология
-- =============================================================================

CREATE TABLE standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
    certificate_number VARCHAR(100),
    last_operation_date DATE,
    next_operation_date DATE,
    document_provider_organization VARCHAR(100),
    document_url VARCHAR(255),
    metrological_characteristics TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE measuring_instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
    metrological_operation_type_id INT REFERENCES metrological_types(id) ON DELETE RESTRICT,
    certificate_number VARCHAR(100),
    last_operation_date DATE,
    next_operation_date DATE,
    document_provider_organization VARCHAR(200),
    document_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. Исправление внешних ключей из миграции 2 (через ALTER TABLE)
-- =============================================================================

-- 6.1. service_types.usage_classification_id → usage_classifications.id
ALTER TABLE service_types 
    ADD CONSTRAINT fk_service_types_usage_classification 
    FOREIGN KEY (usage_classification_id) 
    REFERENCES usage_classifications(id) 
    ON DELETE RESTRICT;

-- 6.2. schedules.equipment_id → equipment.id
ALTER TABLE schedules 
    ADD CONSTRAINT fk_schedules_equipment 
    FOREIGN KEY (equipment_id) 
    REFERENCES equipment(id) 
    ON DELETE CASCADE;

-- 6.3. agreement_works_costs.equipment_id → equipment.id
ALTER TABLE agreement_works_costs 
    ADD CONSTRAINT fk_agreement_works_costs_equipment 
    FOREIGN KEY (equipment_id) 
    REFERENCES equipment(id) 
    ON DELETE CASCADE;

-- 6.4. materials_service_types.material_id → materials.id
ALTER TABLE materials_service_types 
    ADD CONSTRAINT fk_materials_service_types_material 
    FOREIGN KEY (material_id) 
    REFERENCES materials(id) 
    ON DELETE CASCADE;

COMMIT;