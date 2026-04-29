COMPOSE_FILE := compose.platform.yml
COMPOSE_DEV_FILE := compose.dev.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)
COMPOSE_DEV := docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV_FILE)

.PHONY: dev web-dev dev-seed down clean logs smoke backend-test backend-build

dev:
	mkdir -p .local
	$(COMPOSE) up --build -d --wait db migrate backend web field
	$(COMPOSE) run --rm --build dev-seed

web-dev:
	mkdir -p .local
	$(COMPOSE_DEV) up --build web

dev-seed:
	mkdir -p .local
	$(COMPOSE) run --rm --build dev-seed

down:
	$(COMPOSE) down --remove-orphans

clean:
	$(COMPOSE) down --volumes --remove-orphans

logs:
	$(COMPOSE) logs --tail=200

smoke:
	./scripts/platform_smoke.sh

backend-test:
	./scripts/backend_go_test.sh

backend-build:
	./scripts/backend_go_build.sh
