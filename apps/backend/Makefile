# Загрузка переменных из .env
include .env

# URL базы данных
DB_URL := postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSL_MODE)

# Путь к миграциям
MIGRATIONS_PATH := migrations


sqlc-generate:
	@echo "Generating sqlc code..."
	sqlc generate
	@echo "SQLC code generated"

run: sqlc-generate
	go run cmd/api/main.go

build: sqlc-generate
	go build -o bin/vrk cmd/api/main.go

create-db:
	@echo "$(GREEN)Starting PostgreSQL...$(NC)"
	docker run -d \
		--name db \
		-e POSTGRES_USER=postgres \
		-e POSTGRES_PASSWORD=postgres \
		-e POSTGRES_DB=db \
		-p 5432:5432 \
		postgres:17-alpine
	@echo "$(GREEN)PostgreSQL started on port 5432$(NC)"

stop-db:
	@echo "Stopping PostgreSQL..."
	docker stop db
	@echo "PostgreSQL stopped"

rm-db: stop-db
	@echo "Removing PostgreSQL container..."
	docker rm db
	@echo "Container removed"

reset-db: rm-db create-db
	@echo "Database reset complete"

migrate-up:
	@echo "Applying migrations..."
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" up
	@echo "Migrations applied successfully"

migrate-down:
	@echo "Rolling back last migration..."
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" down 1
	@echo "Migration rolled back"

migrate-down-all:
	@echo "Rolling back ALL migrations..."
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" down -all
	@echo "All migrations rolled back"

migrate-create:
	migrate create -ext sql -dir $(MIGRATIONS_PATH) -seq $(name)

migrate-version:
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" version

migrate-force:
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" force $(version)

install-tools:
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.19.1
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@1.30.0