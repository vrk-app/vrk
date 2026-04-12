# Quickstart / Local Setup

Этот документ помогает поднять текущий локальный baseline проекта с нуля: от `git clone` до первого запуска.

## Что запустится

Сейчас в репозитории можно локально поднять только `apps/backend`.

- backend: Go
- база: PostgreSQL
- API docs: Swagger

`apps/web` и `apps/field` пока не реализованы, поэтому в quickstart ниже запускается только backend.

## Что нужно заранее

Перед стартом проверь, что у тебя установлены:

- `git`
- `Go 1.26.x`
- `make`
- `Docker` или локальный `PostgreSQL 17`

Если хочешь проверить быстро:

```bash
git --version
go version
make --version
docker --version
```

Если используешь локальный PostgreSQL вместо Docker, `docker --version` не нужен.

## Быстрый старт

### 1. Клонируй репозиторий

```bash
git clone https://github.com/vrk-app/vrk.git
cd vrk
```

Если репозиторий уже клонирован, просто перейди в его корень.

### 2. Создай локальный `.env`

Из корня проекта:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Это обязательный шаг. Без `apps/backend/.env` команды `make` в backend не стартуют.

### 3. Перейди в backend

```bash
cd apps/backend
```

### 4. Установи backend tools

```bash
make install-tools
```

Команда установит:

- `migrate`
- `sqlc`
- `swag`

### 5. Подними базу данных

Самый простой вариант для новичка:

```bash
make create-db
```

Эта команда поднимет PostgreSQL в Docker на `localhost:5432`.

Если хочешь использовать свой локальный PostgreSQL, он должен совпадать с параметрами из `apps/backend/.env`:

- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `DB_NAME=db`

### 6. Примени миграции

```bash
make migrate-up
```

### 7. Запусти backend

```bash
make run
```

После этого API должен стартовать на `http://localhost:8080`.

## Как проверить, что всё работает

### 1. Открой Swagger

Открой в браузере:

```text
http://localhost:8080/swagger/index.html
```

Если страница открылась, сервер запущен.

### 2. Проверь API через `curl`

```bash
curl http://localhost:8080/api/v1/organizations/
curl http://localhost:8080/api/v1/equipment/
```

Оба запроса должны отвечать без `5xx`.

### 3. Убедись, что есть тестовые данные

В проекте есть seed-миграция:

```text
apps/backend/migrations/000004_temp_data_for_tests.up.sql
```

Она добавляет демо-данные. Если `organizations` и `equipment` возвращают непустой ответ, значит миграции применились нормально.

## Частые проблемы

### `Makefile: .env: No such file or directory`

Создай `.env`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

### `go: command not found`

Значит, Go не установлен или не в `PATH`.

Проверь:

```bash
go version
```

### `migrate` / `sqlc` / `swag` not found

Повтори:

```bash
make install-tools
```

### Backend не подключается к базе

Проверь:

- база действительно запущена;
- значения в `apps/backend/.env` совпадают с реальной БД;
- если база локальная, то база `db` действительно создана.

## Для агента

Перед изменениями сначала читать:

- [`AGENTS.md`](../AGENTS.md)
- [`docs/architecture/source-of-truth.md`](architecture/source-of-truth.md)
- [`docs/testing/test-strategy.md`](testing/test-strategy.md)
- [`docs/roadmap.md`](roadmap.md)

И не предполагать наличие `apps/web` или `apps/field` в текущем runtime.
