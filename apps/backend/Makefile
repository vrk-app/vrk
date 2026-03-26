run:
	go run cmd/api/main.go

build:
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