-- migrations/000002_applications_agreements.up.sql
BEGIN;

-- =============================================================================
-- 1. Справочники
-- =============================================================================

CREATE TABLE application_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application_statuses (
    id SMALLSERIAL PRIMARY KEY, -- int с автоинкрементом
    status VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    usage_classification_id UUID NOT NULL, -- ⚠️ FK добавим в миграции 3
    norm_hour_amount INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. Основные таблицы
-- =============================================================================

-- Графики работ
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID, -- ⚠️ FK добавим в миграции 3
    completion_date DATE NOT NULL,
    price INT NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Договоры/Соглашения
CREATE TABLE agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(255) NOT NULL, -- Путь к файлу в S3
    factory_id UUID NOT NULL, -- ⚠️ Таблица 'factories' будет позже...
    organization_id UUID NOT NULL REFERENCES organization_units(id) ON DELETE RESTRICT,
    number NUMERIC(10,0) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    subject_of_agreement TEXT NOT NULL,
    schedule_id UUID NOT NULL, -- ⚠️ FK на schedules (добавим ниже)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Заявки
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_type_id UUID NOT NULL REFERENCES application_types(id) ON DELETE RESTRICT,
    responsible_brigade_id UUID NOT NULL REFERENCES organization_units(id) ON DELETE RESTRICT,
    responsible_user_contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    user_client_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE RESTRICT,
    number NUMERIC(10,0) NOT NULL,
    status_id SMALLINT NOT NULL REFERENCES application_statuses(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Стоимость работ по договору
CREATE TABLE agreement_works_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
    equipment_id UUID, -- ⚠️ FK добавим в миграции 3
    service_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
    norm_hour INT NOT NULL DEFAULT 0,
    material_used_amount INT NOT NULL DEFAULT 0,
    price INT NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Связь материалов и типов услуг
CREATE TABLE materials_service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID, -- ⚠️ FK добавим в миграции 3
    service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (material_id, service_type_id)
);

-- =============================================================================
-- 3. Внешние ключи (которые можно добавить сразу)
-- =============================================================================

-- agreements.schedule_id → schedules.id
ALTER TABLE agreements 
    ADD CONSTRAINT fk_agreements_schedule 
    FOREIGN KEY (schedule_id) 
    REFERENCES schedules(id) 
    ON DELETE RESTRICT;

COMMIT;