# Onboarding: от clone до PR (platform baseline + Storybook)

Это пошаговое руководство для нового разработчика.
Цель: пройти полный цикл работы с текущим runnable baseline репозитория от `git clone` до создания Pull Request.

Важно: на текущем этапе локально поднимаются два связанных baseline-контура:

- compose-driven platform stack: `apps/backend` + `apps/web` runtime + `apps/field` scaffold;
- отдельный Storybook harness в `apps/web` для reusable UI foundation.

## Что вы получите после прохождения

После этого гайда вы сможете:

- клонировать репозиторий;
- поднять локальный platform stack;
- поднять локальный Storybook из `apps/web`;
- запустить PostgreSQL через Docker или подключить локальную БД;
- применить миграции и проверить API;
- создать рабочую ветку по правилам проекта;
- прогнать минимальные локальные проверки перед PR;
- оформить commit, push и Pull Request.

## 1. Предварительные требования

Нужно заранее иметь:

- `git`;
- `Go 1.26.1` или совместимый `1.26.x` toolchain, если вы хотите запускать backend вне контейнерного baseline;
- `Node.js v24.14.1`, ориентируясь на repo-root `.nvmrc` и `package.json`, если вы работаете с JS/TS workspace вне контейнеров;
- `pnpm 10.33.0`, ориентируясь на repo-root `packageManager`;
- `python3` для `make smoke` и других repo-local verification scripts;
- `make`;
- `Docker`, если хочешь поднять PostgreSQL одной командой;
- или локальный `PostgreSQL 17`, если Docker не используешь;
- опционально: `gh` для создания PR из терминала.

Быстрая проверка:

```bash
git --version
go version
node --version
pnpm --version
make --version
docker --version
gh --version
```

Если используешь локальный PostgreSQL вместо Docker, `docker --version` не нужен.
Если создаешь PR через браузер, `gh --version` тоже не обязателен.
Для UI-задач `node --version` должен вернуть именно `v24.14.1`, а локальный `pnpm` должен быть синхронизирован через `corepack use pnpm@10.33.0`, иначе `pnpm install` может расходиться с repo policy.

## 2. Клонирование репозитория

Основной способ:

```bash
git clone https://github.com/vrk-app/vrk.git
cd vrk
```

Если у тебя настроен SSH-доступ к GitHub, можно так:

```bash
git clone git@github.com:vrk-app/vrk.git
cd vrk
```

## 3. Быстрый старт текущего platform baseline

Если нужен воспроизводимый Stage 02 runtime stack без локального `go`:

```bash
nvm use
corepack use pnpm@10.33.0
pnpm install
make dev
make smoke
```

По умолчанию поднимутся:

- backend: `http://localhost:18080`
- web runtime: `http://localhost:3100`
- field scaffold: `http://localhost:3102`

`make dev` возвращается после compose `--wait`, когда container health уже достигнут. `make smoke` можно запускать сразу после него: smoke сам подождет короткое bounded окно, пока host-порты backend/web/field начнут принимать подключения, и только потом перейдет к строгим runtime assertions.

Если порты заняты, их можно переопределить через `BACKEND_HOST_PORT`, `WEB_HOST_PORT`, `FIELD_HOST_PORT`.

Если нужен clean-room прогон с повторным применением миграций и исходным seeded baseline, используйте:

```bash
make clean
make dev
make smoke
```

`make down` останавливает stack, но сохраняет named Postgres volume.

Storybook по-прежнему запускается отдельно:

```bash
pnpm storybook
```

## 4. Что важно знать про текущий baseline

Сейчас в репозитории реально можно локально поднять:

- compose-driven `apps/backend` runtime на Go;
- web runtime shell из `apps/web`;
- field scaffold из `apps/field`;
- Storybook harness из `apps/web`;
- PostgreSQL и миграции;
- Swagger UI для API.

Это означает:

- для compose baseline достаточно `Docker`, `make`, `python3`, `Node.js` и `pnpm`;
- для backend-only задач вне compose по-прежнему нужен Go toolchain и PostgreSQL;
- `apps/web` уже входит и как Storybook-first foundation, и как runnable runtime shell;
- `apps/field` входит в baseline как PWA-first scaffold;
- repo-level policy по Node.js теперь зафиксирована на `v24.14.1` через `.nvmrc`, root `package.json`, root `.npmrc`, `apps/web/package.json` и `apps/field/package.json`.

## 4.1. Быстрый старт для UI harness

Если задача относится к Storybook/UI foundation:

```bash
nvm use
corepack use pnpm@10.33.0
pnpm install
pnpm storybook
```

Storybook должен подняться на:

```text
http://localhost:6006
```

Для воспроизводимого smoke check из корня репозитория:

```bash
pnpm run web:browser-install
pnpm run web:smoke
```

`pnpm run web:browser-install` нужен один раз на новую машину, чтобы локально поставить Chromium для Playwright browser-smoke, который проверяет submit flow `/login` и `/register` -> `/company`.

## 5. Настройка локального `.env`

Из корня репозитория:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Это обязательный шаг.
`apps/backend/Makefile` делает `include .env`, поэтому без `apps/backend/.env` backend-команды не стартуют.

Текущие значения по умолчанию в `apps/backend/.env.example` уже подходят для локального запуска:

```dotenv
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=db
DB_SSL_MODE=disable
```

## 6. Установка backend tools

Перейди в backend и установи инструменты:

```bash
cd apps/backend
make install-tools
```

Команда устанавливает:

- `migrate`;
- `sqlc`;
- `swag`.

Если после установки shell не видит эти бинарники, добавь Go bin directory в `PATH`:

```bash
export PATH="$(go env GOPATH)/bin:$PATH"
```

## 7. Подъем базы данных

### Вариант A. PostgreSQL через Docker

Самый простой путь:

```bash
make create-db
```

Команда поднимет контейнер `db` c PostgreSQL `17-alpine` на `localhost:5432`.

### Вариант B. Локальный PostgreSQL

Если Docker не используешь, подними свой PostgreSQL и убедись, что значения совпадают с `apps/backend/.env`:

- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `DB_NAME=db`

Если параметры другие, обнови `apps/backend/.env` до запуска миграций и сервера.

## 8. Применение миграций

Из `apps/backend`:

```bash
make migrate-up
```

Это создаст схему и применит seed-данные из миграций.

## 9. Запуск backend

Из `apps/backend`:

```bash
make run
```

После этого API должен стартовать на:

```text
http://localhost:8080
```

## 10. Проверка, что baseline работает

### 9.1 Swagger UI

Открой в браузере:

```text
http://localhost:8080/swagger/index.html
```

Если страница открылась, сервер запущен и Swagger отдается корректно.

### 9.2 Smoke через `curl`

В отдельном терминале выполни:

```bash
curl http://localhost:8080/api/v1/organizations/
curl http://localhost:8080/api/v1/equipment/
curl http://localhost:8080/api/v1/agreements/
```

Ожидаемый результат:

- HTTP `200`;
- JSON-ответ без `5xx`;
- как минимум для `organizations` и `equipment` должен вернуться непустой список или объект с данными, потому что в репозитории есть seed-миграция `apps/backend/migrations/000004_temp_data_for_tests.up.sql`.

## 11. Создание рабочей ветки

Перед началом изменений синхронизируй `main`:

```bash
git checkout main
git pull --ff-only origin main
```

В этом репозитории `CONTRIBUTING.md` фиксирует такой формат веток:

```text
<type>/<short-kebab-case>
```

Опционально с тикетом:

```text
<type>/<ticket>-<short-kebab-case>
```

Примеры:

- `feat/agreement-crud`
- `fix/NCFG-132-auth-validation`
- `docs/onboarding-backend`

Допустимые `type`: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `style`, `build`, `ci`, `chore`.

## 12. Внесение изменений и локальная проверка

Сделай изменения в своей ветке, затем перед PR выполни минимум из `apps/backend`:

```bash
go test ./...
go build ./...
```

Если изменения затронули schema или SQL queries, дополнительно:

```bash
make sqlc-generate
```

Если изменения затронули API contract или Swagger annotations, дополнительно:

```bash
make swagger
```

Если изменения затронули миграции, локально проверь, что они реально применяются к базе и не ломают baseline.

## 13. Commit

Добавь изменения:

```bash
git add <измененные_файлы>
```

Используй Conventional Commits:

```bash
git commit -m "<type>(scope): <summary>"
```

Примеры:

```bash
git commit -m "docs: rewrite backend onboarding guide"
git commit -m "fix(api): validate agreement update payload"
```

Рекомендуемые scope для текущего backend baseline:

- `api`;
- `server`;
- `db`;
- `auth`;
- `config`;
- `deps`;
- `ci`.

Summary в commit message должен быть на английском и в повелительном наклонении: `add`, `fix`, `update`, `remove`, `rewrite`.

## 14. Push и Pull Request

Отправь ветку:

```bash
git push -u origin HEAD
```

Создай PR через GitHub CLI:

```bash
gh pr create --base main
```

Если `gh` не установлен, создай PR через GitHub UI в браузере.

Согласно `CONTRIBUTING.md`, для этого репозитория важно:

- один PR = одна логическая задача;
- заголовок PR оформляется в формате Conventional Commits;
- так как используется `Squash & merge`, заголовок PR станет финальным commit message в `main`;
- в описании PR нужно явно указать контекст, что изменено, как проверить и какие есть риски или ограничения.

## 15. Troubleshooting

### `Makefile: .env: No such file or directory`

Создай env-файл:

```bash
cp apps/backend/.env.example apps/backend/.env
```

### `go: command not found`

Go не установлен или не в `PATH`.

Проверь:

```bash
go version
```

### `migrate` / `sqlc` / `swag` not found`

Повтори:

```bash
cd apps/backend
make install-tools
```

И при необходимости добавь Go bin directory в `PATH`:

```bash
export PATH="$(go env GOPATH)/bin:$PATH"
```

### `docker: Error response from daemon: Conflict. The container name "/db" is already in use`

В `Makefile` имя контейнера жестко задано как `db`.
Если такой контейнер уже существует, сначала останови и удали его:

```bash
cd apps/backend
make rm-db
```

### Backend не подключается к базе

Проверь:

- база действительно запущена;
- значения в `apps/backend/.env` совпадают с реальной БД;
- если используется локальный PostgreSQL, база `db` реально создана;
- порт `5432` не занят другим контейнером или сервисом с несовместимыми параметрами.

### `connection refused` на `localhost:8080`

Проверь, что `make run` все еще работает в отдельном терминале и сервер не завершился из-за ошибки подключения к БД или конфигурации.

## 16. Финальный чеклист перед PR

- [ ] Репозиторий клонирован и рабочая ветка создана по формату `<type>/<short-kebab-case>`.
- [ ] Создан `apps/backend/.env`.
- [ ] PostgreSQL поднят через Docker или локально.
- [ ] Применены `make migrate-up`.
- [ ] Backend стартует через `make run`.
- [ ] Swagger открывается на `http://localhost:8080/swagger/index.html`.
- [ ] Smoke через `curl` к API проходит без `5xx`.
- [ ] Локально выполнены `go test ./...` и `go build ./...`.
- [ ] При необходимости выполнены `make sqlc-generate` и `make swagger`.
- [ ] Commit и PR оформлены по Conventional Commits.
- [ ] В PR нет локальных секретов, временных файлов и нерелевантных изменений.

## Приложение: базовый flow в одном блоке

```bash
# 1) Clone
git clone https://github.com/vrk-app/vrk.git
cd vrk

# 2) Env
cp apps/backend/.env.example apps/backend/.env

# 3) Tools
cd apps/backend
make install-tools
export PATH="$(go env GOPATH)/bin:$PATH"

# 4) DB + migrations
make create-db
make migrate-up

# 5) Run backend
make run

# 6) Separate terminal: smoke
curl http://localhost:8080/api/v1/organizations/
curl http://localhost:8080/api/v1/equipment/

# 7) Work in branch
cd ../..
git checkout main
git pull --ff-only origin main
git checkout -b docs/onboarding-backend

# ... change code or docs ...

# 8) Verify and commit
cd apps/backend
go test ./...
go build ./...
cd ../..
git add <files>
git commit -m "docs: rewrite backend onboarding guide"
git push -u origin HEAD

# 9) Open PR
gh pr create --base main
```

## Что еще полезно открыть перед задачей

- [`README.md`](../README.md)
- [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- [`docs/architecture/source-of-truth.md`](architecture/source-of-truth.md)
- [`docs/roadmap.md`](roadmap.md)
