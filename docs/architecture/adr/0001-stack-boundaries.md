# ADR-0001: Stack Boundaries For MVP

Статус: accepted  
Дата: 2026-04-11

## Контекст

В `README.md` технологическая концепция сформулирована как черновая гипотеза, а `docs/roadmap.md` уже требует не ломать текущий кодовый вектор. Репозиторий при этом содержит только Go backend в `apps/backend/` и не содержит web/mobile приложений.

## Решение

Зафиксировать следующую MVP-архитектуру:

- backend: Go modular monolith в `apps/backend`
- API: REST + OpenAPI
- database: PostgreSQL
- cache/queue: Redis-ready, но не обязательный runtime для Stage 00
- web: Next.js + TypeScript в будущем `apps/web`
- field engineer client: PWA-first mobile contour в будущем `apps/field`
- files: S3-compatible object storage abstraction

## Обоснование

- Текущий код и миграции уже лежат в Go backend.
- Swagger и SQL migrations уже встроены в текущий backend-контур.
- В репозитории пока нет ни одного артефакта, оправдывающего смену backend-стека.
- PWA-first снижает стоимость первого offline MVP по сравнению с native-first веткой.

## Последствия

- Stage 01 должен создать `apps/web` и Storybook foundation, а Stage 02 должен достраивать app runtime и `apps/field`, а не пытаться заменить существующий backend.
- До отдельного ADR запрещено переписывать backend на другой язык или фреймворк.
- Архитектурные решения следующих этапов должны укладываться в modular monolith + explicit module boundaries.
