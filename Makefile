COMPOSE_FILE := compose.platform.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)

.PHONY: dev down clean logs smoke backend-test backend-build

dev:
	$(COMPOSE) up --build -d --wait

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
