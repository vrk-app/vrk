# ADR-0003: Canonical Request Status Model

Статус: accepted  
Дата: 2026-04-11

## Контекст

`docs/PRD-MVP.md` фиксирует целевую стартовую модель статусов заявки, а текущий backend seed в `apps/backend/migrations/000004_temp_data_for_tests.up.sql` использует более узкий технический набор.

## Решение

Канонической бизнес-моделью для MVP считать следующий порядок статусов:

1. `draft`
2. `created`
3. `assigned_to_contractor`
4. `in_progress`
5. `estimate_pending`
6. `completed_by_contractor`
7. `accepted_by_customer`
8. `cancelled`

Этот lifecycle применяется как целевая рамка для web, contractor и field workflows. Для внеплановых работ статус `estimate_pending` обязателен, для плановых он может пропускаться валидным переходом.

## Текущий технический baseline

Сейчас seed-данные backend содержат:

- `created`
- `accepted`
- `in_progress`
- `completed`
- `verified`
- `cancelled`

## Нормализация

До миграции на каноническую модель использовать следующую интерпретацию существующих статусов:

| Текущий seed | Канонический смысл |
| --- | --- |
| `created` | `created` |
| `accepted` | `assigned_to_contractor` |
| `in_progress` | `in_progress` |
| `completed` | `completed_by_contractor` |
| `verified` | `accepted_by_customer` |
| `cancelled` | `cancelled` |

Отсутствующие в seed статусы:

- `draft`
- `estimate_pending`

## Последствия

- Stage 04 не должен проектировать request workflows поверх старой модели без явной миграции.
- До выравнивания схемы и API статусный seed считается временным.
- Все новые UI/API сценарии должны ориентироваться на каноническую модель, а не на случайный текущий набор seed-статусов.
