-- migrations/000001_init_schema_users.up.sql
BEGIN;

-- =============================================================================
-- 1. Справочники прав доступа
-- =============================================================================

CREATE TABLE permission_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_type VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permission_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_level VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. Справочники организаций
-- =============================================================================

-- Типы собственности (АО, ООО, ИП и т.д.)
CREATE TABLE property_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_type VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Роли организации в системе (заказчик / подрядчик)
CREATE TABLE organization_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(50) NOT NULL UNIQUE, -- 'customer', 'contractor'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- =============================================================================
-- 3. Организационные единицы
-- =============================================================================

CREATE TABLE organization_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_type_id UUID NOT NULL REFERENCES property_types(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES organization_roles(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(50),
    inn CHAR(10) NOT NULL CHECK (inn ~ '^\d{10}$'), -- Только 10 цифр
    kpp CHAR(9) NOT NULL CHECK (kpp ~ '^\d{9}$'),   -- Только 9 цифр
    address VARCHAR(255) NOT NULL, -- Увеличено для полных адресов
    director_id UUID, -- ⚠️ FK на users добавим позже (циклическая зависимость)
    parent_id UUID REFERENCES organization_units(id) ON DELETE CASCADE, -- Иерархия
    power_of_attorney_number VARCHAR(100),
    poa_issue_date DATE,
    poa_expiration_date DATE,
    logo VARCHAR(255), -- Ссылка на файл в S3
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. Пользователи
-- =============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL,
    surname VARCHAR(20) NOT NULL,
    patronymic VARCHAR(20),
    email VARCHAR(320) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    title VARCHAR(50) NOT NULL,
    organization_id UUID NOT NULL, -- ⚠️ FK на organization_units добавим ниже
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. Права доступа (связи)
-- =============================================================================

CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_type_id UUID NOT NULL REFERENCES permission_types(id) ON DELETE CASCADE,
    permission_level_id UUID NOT NULL REFERENCES permission_levels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, permission_type_id, permission_level_id)
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_type_id UUID NOT NULL REFERENCES permission_types(id) ON DELETE CASCADE,
    permission_level_id UUID NOT NULL REFERENCES permission_levels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (role_id, permission_type_id, permission_level_id)
);

-- =============================================================================
-- 6. Исправление циклических зависимостей (ALTER TABLE)
-- =============================================================================

-- 6.1. users.organization_id → organization_units.id
ALTER TABLE users 
    ADD CONSTRAINT fk_users_organization 
    FOREIGN KEY (organization_id) 
    REFERENCES organization_units(id) 
    ON DELETE RESTRICT;

-- 6.2. organization_units.director_id → users.id (после создания users)
ALTER TABLE organization_units 
    ADD CONSTRAINT fk_organization_units_director 
    FOREIGN KEY (director_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;

COMMIT;