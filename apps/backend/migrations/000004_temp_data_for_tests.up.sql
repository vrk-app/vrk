-- migrations/000004_seed_data.up.sql
BEGIN;

-- =============================================================================
-- 1. Заполнение справочников прав доступа
-- =============================================================================

-- permission_types
INSERT INTO permission_types (id, permission_type) VALUES
    (gen_random_uuid(), 'equipment'),
    (gen_random_uuid(), 'applications'),
    (gen_random_uuid(), 'users'),
    (gen_random_uuid(), 'reports'),
    (gen_random_uuid(), 'warehouse');

-- permission_levels
INSERT INTO permission_levels (id, permission_level) VALUES
    (gen_random_uuid(), 'read'),
    (gen_random_uuid(), 'write'),
    (gen_random_uuid(), 'delete'),
    (gen_random_uuid(), 'full');

-- user_roles
INSERT INTO user_roles (id, title) VALUES
    (gen_random_uuid(), 'depot_master'),
    (gen_random_uuid(), 'regional_manager_customer'),
    (gen_random_uuid(), 'org_head_customer'),
    (gen_random_uuid(), 'team_member'),
    (gen_random_uuid(), 'regional_manager_contractor'),
    (gen_random_uuid(), 'contractor_head'),
    (gen_random_uuid(), 'viewer');

-- =============================================================================
-- 2. Заполнение справочников организаций
-- =============================================================================

-- property_types
INSERT INTO property_types (id, property_type) VALUES
    (gen_random_uuid(), 'ООО'),
    (gen_random_uuid(), 'АО'),
    (gen_random_uuid(), 'ПАО'),
    (gen_random_uuid(), 'ИП'),
    (gen_random_uuid(), 'ОАО');

-- organization_roles
INSERT INTO organization_roles (id, title) VALUES
    (gen_random_uuid(), 'customer'),
    (gen_random_uuid(), 'contractor');

-- =============================================================================
-- 3. Создание организаций (заказчики и подрядчики)
-- =============================================================================

-- Получаем ID типов
DO $$
DECLARE
    ooo_id UUID;
    ao_id UUID;
    customer_role_id UUID;
    contractor_role_id UUID;
BEGIN
    SELECT id INTO ooo_id FROM property_types WHERE property_type = 'ООО' LIMIT 1;
    SELECT id INTO ao_id FROM property_types WHERE property_type = 'АО' LIMIT 1;
    SELECT id INTO customer_role_id FROM organization_roles WHERE title = 'customer' LIMIT 1;
    SELECT id INTO contractor_role_id FROM organization_roles WHERE title = 'contractor' LIMIT 1;

    -- Заказчики
    INSERT INTO organization_units (id, property_type_id, role_id, name, short_name, inn, kpp, address, parent_id) VALUES
        (gen_random_uuid(), ooo_id, customer_role_id, 'ООО "Ромашка"', 'Ромашка', '1234567890', '123456789', 'г. Москва, ул. Цветочная, д. 1', NULL),
        (gen_random_uuid(), ooo_id, customer_role_id, 'ООО "Лютик"', 'Лютик', '2345678901', '234567890', 'г. Санкт-Петербург, Невский пр., д. 100', NULL),
        (gen_random_uuid(), ao_id, customer_role_id, 'АО "ТехноСервис"', 'ТехноСервис', '3456789012', '345678901', 'г. Екатеринбург, ул. Машиностроителей, д. 50', NULL);

    -- Подрядчики
    INSERT INTO organization_units (id, property_type_id, role_id, name, short_name, inn, kpp, address, parent_id) VALUES
        (gen_random_uuid(), ooo_id, contractor_role_id, 'ООО "РемСтрой"', 'РемСтрой', '4567890123', '456789012', 'г. Москва, ул. Строителей, д. 10', NULL),
        (gen_random_uuid(), ao_id, contractor_role_id, 'АО "Метрология+"', 'Метрология+', '5678901234', '567890123', 'г. Казань, ул. Лаборантов, д. 5', NULL);
END $$;

-- =============================================================================
-- 4. Создание пользователей (без директоров пока, добавим позже)
-- =============================================================================

DO $$
DECLARE
    depot_master_role UUID;
    team_member_role UUID;
    viewer_role UUID;
    romashka_id UUID;
    lyutik_id UUID;
    tehnoservice_id UUID;
    remstroy_id UUID;
    metrologia_id UUID;
BEGIN
    SELECT id INTO depot_master_role FROM user_roles WHERE title = 'depot_master' LIMIT 1;
    SELECT id INTO team_member_role FROM user_roles WHERE title = 'team_member' LIMIT 1;
    SELECT id INTO viewer_role FROM user_roles WHERE title = 'viewer' LIMIT 1;
    
    SELECT id INTO romashka_id FROM organization_units WHERE name = 'ООО "Ромашка"' LIMIT 1;
    SELECT id INTO lyutik_id FROM organization_units WHERE name = 'ООО "Лютик"' LIMIT 1;
    SELECT id INTO tehnoservice_id FROM organization_units WHERE name = 'АО "ТехноСервис"' LIMIT 1;
    SELECT id INTO remstroy_id FROM organization_units WHERE name = 'ООО "РемСтрой"' LIMIT 1;
    SELECT id INTO metrologia_id FROM organization_units WHERE name = 'АО "Метрология+"' LIMIT 1;

    -- Заказчики (мастера депо)
    INSERT INTO users (id, name, surname, patronymic, email, phone_number, password, title, organization_id, role_id) VALUES
        (gen_random_uuid(), 'Иван', 'Петров', 'Сергеевич', 'ivan.petrov@romashka.ru', '+79001234567', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrCqZqQ8Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Мастер депо', romashka_id, depot_master_role),
        (gen_random_uuid(), 'Алексей', 'Сидоров', 'Иванович', 'alexey.sidorov@lyutik.ru', '+79002345678', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrCqZqQ8Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Мастер депо', lyutik_id, depot_master_role),
        (gen_random_uuid(), 'Дмитрий', 'Кузнецов', 'Петрович', 'dmitry.kuznetsov@tehnoservice.ru', '+79003456789', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrCqZqQ8Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Мастер депо', tehnoservice_id, depot_master_role);

    -- Подрядчики (члены бригад)
    INSERT INTO users (id, name, surname, patronymic, email, phone_number, password, title, organization_id, role_id) VALUES
        (gen_random_uuid(), 'Сергей', 'Михайлов', 'Александрович', 'sergey.mikhailov@remstroy.ru', '+79004567890', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrCqZqQ8Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Инженер', remstroy_id, team_member_role),
        (gen_random_uuid(), 'Андрей', 'Новиков', 'Викторович', 'andrey.novikov@remstroy.ru', '+79005678901', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrCqZqQ8Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Инженер', remstroy_id, team_member_role),
        (gen_random_uuid(), 'Екатерина', 'Волкова', 'Сергеевна', 'ekaterina.volkova@metrologia.ru', '+79006789012', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrCqZqQ8Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'Метролог', metrologia_id, team_member_role);
END $$;

-- =============================================================================
-- 5. Назначение директоров организаций
-- =============================================================================

DO $$
DECLARE
    romashka_id UUID;
    lyutik_id UUID;
    tehnoservice_id UUID;
    remstroy_id UUID;
    metrologia_id UUID;
    ivan_id UUID;
    alexey_id UUID;
    dmitry_id UUID;
    sergey_id UUID;
    andrey_id UUID;
    ekaterina_id UUID;
BEGIN
    SELECT id INTO romashka_id FROM organization_units WHERE name = 'ООО "Ромашка"' LIMIT 1;
    SELECT id INTO lyutik_id FROM organization_units WHERE name = 'ООО "Лютик"' LIMIT 1;
    SELECT id INTO tehnoservice_id FROM organization_units WHERE name = 'АО "ТехноСервис"' LIMIT 1;
    SELECT id INTO remstroy_id FROM organization_units WHERE name = 'ООО "РемСтрой"' LIMIT 1;
    SELECT id INTO metrologia_id FROM organization_units WHERE name = 'АО "Метрология+"' LIMIT 1;
    
    SELECT id INTO ivan_id FROM users WHERE email = 'ivan.petrov@romashka.ru' LIMIT 1;
    SELECT id INTO alexey_id FROM users WHERE email = 'alexey.sidorov@lyutik.ru' LIMIT 1;
    SELECT id INTO dmitry_id FROM users WHERE email = 'dmitry.kuznetsov@tehnoservice.ru' LIMIT 1;
    SELECT id INTO sergey_id FROM users WHERE email = 'sergey.mikhailov@remstroy.ru' LIMIT 1;
    SELECT id INTO andrey_id FROM users WHERE email = 'andrey.novikov@remstroy.ru' LIMIT 1;
    SELECT id INTO ekaterina_id FROM users WHERE email = 'ekaterina.volkova@metrologia.ru' LIMIT 1;

    UPDATE organization_units SET director_id = ivan_id WHERE id = romashka_id;
    UPDATE organization_units SET director_id = alexey_id WHERE id = lyutik_id;
    UPDATE organization_units SET director_id = dmitry_id WHERE id = tehnoservice_id;
    UPDATE organization_units SET director_id = sergey_id WHERE id = remstroy_id;
    UPDATE organization_units SET director_id = ekaterina_id WHERE id = metrologia_id;
END $$;

-- =============================================================================
-- 6. Заполнение справочников оборудования
-- =============================================================================

-- usage_classifications
INSERT INTO usage_classifications (id, classification) VALUES
    (gen_random_uuid(), 'Производственное'),
    (gen_random_uuid(), 'Измерительное'),
    (gen_random_uuid(), 'Транспортное'),
    (gen_random_uuid(), 'Энергетическое');

-- equipment_status
INSERT INTO equipment_status (id, status) VALUES
    (1, 'operational'),
    (2, 'under_repair'),
    (3, 'standby'),
    (4, 'decommissioned'),
    (5, 'in_stock');

-- metrological_types
INSERT INTO metrological_types (id, metrological_operation_type) VALUES
    (gen_random_uuid(), 'calibration'),
    (gen_random_uuid(), 'verification'),
    (gen_random_uuid(), 'testing');

-- =============================================================================
-- 7. Заполнение оборудования
-- =============================================================================

DO $$
DECLARE
    production_class UUID;
    measuring_class UUID;
    romashka_id UUID;
    lyutik_id UUID;
    tehnoservice_id UUID;
    dict_id UUID;
BEGIN
    SELECT id INTO production_class FROM usage_classifications WHERE classification = 'Производственное' LIMIT 1;
    SELECT id INTO measuring_class FROM usage_classifications WHERE classification = 'Измерительное' LIMIT 1;
    SELECT id INTO romashka_id FROM organization_units WHERE name = 'ООО "Ромашка"' LIMIT 1;
    SELECT id INTO lyutik_id FROM organization_units WHERE name = 'ООО "Лютик"' LIMIT 1;
    SELECT id INTO tehnoservice_id FROM organization_units WHERE name = 'АО "ТехноСервис"' LIMIT 1;

    -- Справочники оборудования
    INSERT INTO equipment_dictionaries (id, manufacturer, classification_id, full_name, model) VALUES
        (gen_random_uuid(), 'Fanuc', production_class, 'Станок фрезерный ЧПУ', 'Fanuc Robodrill'),
        (gen_random_uuid(), 'Siemens', production_class, 'Токарный станок', 'Siemens Sinumerik'),
        (gen_random_uuid(), 'Endress+Hauser', measuring_class, 'Расходомер', 'Promag 55'),
        (gen_random_uuid(), 'Metso', measuring_class, 'Манометр', 'Metso 123');

    -- Оборудование
    INSERT INTO equipment (id, factory_number, inventory_number, manufacture_year, registration_year, equipment_dictionary_id, organization_id, status_id) 
    SELECT 
        gen_random_uuid(), 
        'SN-' || i,
        'INV-' || i,
        '2020-01-01'::date,
        '2021-01-01'::date,
        ed.id,
        org.id,
        1
    FROM equipment_dictionaries ed
    CROSS JOIN generate_series(1, 3) i
    CROSS JOIN (SELECT id FROM organization_units WHERE role_id = (SELECT id FROM organization_roles WHERE title = 'customer') LIMIT 1) org
    LIMIT 10;
END $$;

-- =============================================================================
-- 8. Склады и материалы
-- =============================================================================

DO $$
DECLARE
    remstroy_id UUID;
    warehouse_id UUID;
BEGIN
    SELECT id INTO remstroy_id FROM organization_units WHERE name = 'ООО "РемСтрой"' LIMIT 1;

    INSERT INTO warehouses (id, name, organization_id, location) VALUES
        (gen_random_uuid(), 'Основной склад', remstroy_id, 'г. Москва, ул. Складская, д. 1'),
        (gen_random_uuid(), 'Резервный склад', remstroy_id, 'г. Москва, ул. Запасная, д. 5');

    SELECT id INTO warehouse_id FROM warehouses WHERE name = 'Основной склад' LIMIT 1;

    INSERT INTO materials (id, name, amount, unit, price, warehouse_id) VALUES
        (gen_random_uuid(), 'Болт М8', 1000.5, 'шт', 10, warehouse_id),
        (gen_random_uuid(), 'Гайка М8', 1500.0, 'шт', 5, warehouse_id),
        (gen_random_uuid(), 'Шайба 8', 2000.0, 'шт', 3, warehouse_id),
        (gen_random_uuid(), 'Масло индустриальное', 50.0, 'л', 500, warehouse_id),
        (gen_random_uuid(), 'Смазка Литол', 30.0, 'кг', 300, warehouse_id);
END $$;

-- =============================================================================
-- 9. application_types и application_statuses
-- =============================================================================

INSERT INTO application_types (id, type) VALUES
    (gen_random_uuid(), 'repair'),
    (gen_random_uuid(), 'maintenance'),
    (gen_random_uuid(), 'calibration');

INSERT INTO application_statuses (status) VALUES
    ('created'),
    ('accepted'),
    ('in_progress'),
    ('completed'),
    ('verified'),
    ('cancelled');

-- =============================================================================
-- 10. Создание тестовых договоров и заявок
-- =============================================================================

DO $$
DECLARE
    remstroy_id UUID;
    romashka_id UUID;
    schedule_id UUID;
    agreement_id UUID;
    created_status SMALLINT;
    repair_type_id UUID;
    ivan_id UUID;
    sergey_id UUID;
BEGIN
    SELECT id INTO remstroy_id FROM organization_units WHERE name = 'ООО "РемСтрой"' LIMIT 1;
    SELECT id INTO romashka_id FROM organization_units WHERE name = 'ООО "Ромашка"' LIMIT 1;
    SELECT id INTO repair_type_id FROM application_types WHERE type = 'repair' LIMIT 1;
    SELECT id INTO ivan_id FROM users WHERE email = 'ivan.petrov@romashka.ru' LIMIT 1;
    SELECT id INTO sergey_id FROM users WHERE email = 'sergey.mikhailov@remstroy.ru' LIMIT 1;
    SELECT id INTO created_status FROM application_statuses WHERE status = 'created' LIMIT 1;

    -- Создание расписания
    INSERT INTO schedules (id, completion_date, price) VALUES
        (gen_random_uuid(), '2025-12-31', 100000);
    
    SELECT id INTO schedule_id FROM schedules LIMIT 1;

    -- Создание договора
    INSERT INTO agreements (id, source, factory_id, organization_id, number, start_date, end_date, subject_of_agreement, schedule_id) VALUES
        (gen_random_uuid(), 's3://agreements/agreement_001.pdf', remstroy_id, romashka_id, 1001, '2024-01-01', '2025-12-31', 'Техническое обслуживание и ремонт оборудования', schedule_id);
    
    SELECT id INTO agreement_id FROM agreements LIMIT 1;

    -- Создание заявки
    INSERT INTO applications (id, application_type_id, responsible_brigade_id, responsible_user_contractor_id, user_client_id, agreement_id, number, status_id) VALUES
        (gen_random_uuid(), repair_type_id, remstroy_id, sergey_id, ivan_id, agreement_id, 5001, created_status);
END $$;

COMMIT;