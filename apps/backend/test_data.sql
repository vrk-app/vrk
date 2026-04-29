-- Добавление организации "ООО Ромашка" (заказчик)
-- Предполагается, что справочные данные (property_types, organization_roles, user_roles) уже заполнены,
-- но если нет – добавим их.

-- 1. Убедимся, что тип собственности "ООО" существует
INSERT INTO property_types (id, property_type)
SELECT gen_random_uuid(), 'ООО'
WHERE NOT EXISTS (SELECT 1 FROM property_types WHERE property_type = 'ООО');

-- 2. Убедимся, что роль организации "customer" существует
INSERT INTO organization_roles (id, title)
SELECT gen_random_uuid(), 'customer'
WHERE NOT EXISTS (SELECT 1 FROM organization_roles WHERE title = 'customer');

-- 3. Убедимся, что роль пользователя "depot_master" существует
INSERT INTO user_roles (id, title)
SELECT gen_random_uuid(), 'depot_master'
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE title = 'depot_master');

-- 4. Создаём организацию (без директора пока, так как директор ещё не создан)
INSERT INTO organization_units (
    id,
    property_type_id,
    role_id,
    name,
    short_name,
    inn,
    kpp,
    address,
    parent_id,
    power_of_attorney_number,
    poa_issue_date,
    poa_expiration_date,
    logo
)
SELECT
    gen_random_uuid(),
    (SELECT id FROM property_types WHERE property_type = 'ООО'),
    (SELECT id FROM organization_roles WHERE title = 'customer'),
    'ООО Ромашка',
    'Ромашка',
    '1234567890',
    '123456789',
    'г. Москва, ул. Цветочная, д. 1',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL;

-- 5. Создаём пользователя-директора
--    Пароль: "password123" захеширован bcrypt (стоимость 10)
INSERT INTO users (
    id,
    name,
    surname,
    patronymic,
    email,
    phone_number,
    password,
    title,
    organization_id,
    role_id
)
SELECT
    gen_random_uuid(),
    'Иван',
    'Петров',
    'Сергеевич',
    'ivan@romashka.ru',
    '+79001234567',
    '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrCqZqQ8Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', -- bcrypt hash of "password123"
    'Директор',
    (SELECT id FROM organization_units WHERE name = 'ООО Ромашка' AND inn = '1234567890'),
    (SELECT id FROM user_roles WHERE title = 'depot_master');

-- 6. Назначаем директора организации
UPDATE organization_units
SET director_id = (SELECT id FROM users WHERE email = 'ivan@romashka.ru')
WHERE name = 'ООО Ромашка' AND inn = '1234567890';

-- (Опционально) Добавляем базовые права для пользователя, если нужно
-- Например, полный доступ к оборудованию и заявкам (permission_types = 'equipment', 'applications')
-- permission_levels = 'full'
-- Сначала убедимся, что уровни и типы прав существуют
INSERT INTO permission_types (id, permission_type)
SELECT gen_random_uuid(), 'equipment'
WHERE NOT EXISTS (SELECT 1 FROM permission_types WHERE permission_type = 'equipment');

INSERT INTO permission_types (id, permission_type)
SELECT gen_random_uuid(), 'applications'
WHERE NOT EXISTS (SELECT 1 FROM permission_types WHERE permission_type = 'applications');

INSERT INTO permission_levels (id, permission_level)
SELECT gen_random_uuid(), 'full'
WHERE NOT EXISTS (SELECT 1 FROM permission_levels WHERE permission_level = 'full');

-- Назначаем права пользователю
INSERT INTO user_permissions (id, user_id, permission_type_id, permission_level_id)
SELECT
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'ivan@romashka.ru'),
    pt.id,
    pl.id
FROM permission_types pt
CROSS JOIN permission_levels pl
WHERE pt.permission_type IN ('equipment', 'applications')
  AND pl.permission_level = 'full'
ON CONFLICT (user_id, permission_type_id, permission_level_id) DO NOTHING;

-- Добавление базовых статусов оборудования
INSERT INTO equipment_statuses (status)
VALUES 
    ('operational'),
    ('under_repair'),
    ('standby'),
    ('decommissioned'),
    ('in_stock')
ON CONFLICT (status) DO NOTHING;
