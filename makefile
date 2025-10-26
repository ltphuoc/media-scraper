# === VARIABLES ===
PROJECT_NAME = media-scraper
DOCKER_COMPOSE = docker compose
ARTILLERY = npx artillery
REPORT_FILE = artillery-report.json

# === COMMANDS ===

.PHONY: help
help:
	@echo ""
	@echo "🚀 $(PROJECT_NAME) Commands:"
	@echo "--------------------------------------------"
	@echo "make up           -> Build & start all services (API, Worker, DB, Redis, Landing, Dashboard)"
	@echo "make down         -> Stop and remove containers"
	@echo "make logs         -> Tail logs for API + Worker"
	@echo "make smoke        -> Run smoke test (Artillery)"
	@echo "make load         -> Run load test (Artillery, ~5000 requests)"
	@echo "make report       -> Generate HTML report from last load test"
	@echo "make clean        -> Stop and remove containers + volumes"
	@echo "--------------------------------------------"

# === CORE ===
start:
	@echo "🔍 Checking environment file..."
	@if [ ! -f .env ]; then \
		echo "⚙️  No .env found, creating one from .env.example..."; \
		cp .env.example .env; \
	else \
		echo "✅ .env file already exists."; \
	fi

	@echo "🧱 [1/3] Building and starting $(PROJECT_NAME) services..."
	$(DOCKER_COMPOSE) up --build -d

	@echo "⏳ [2/3] Waiting for API healthcheck (up to 60 seconds)..."
	@bash -c 'for i in {1..30}; do \
		if curl -fs http://localhost:4000/health > /dev/null 2>&1; then \
			echo "\n✅ API is healthy!"; \
			break; \
		fi; \
		printf "."; \
		sleep 2; \
	done'

	@echo "🧪 [3/3] Running smoke test..."
	$(ARTILLERY) run tests/smoke-test.yml || (echo "❌ Smoke test failed!" && exit 1)

	@echo "💥 Running load test (~5000 requests)..."
	$(ARTILLERY) run tests/load-test.yml --output $(REPORT_FILE)

	@echo ""
	@echo "🎉 All services started and tested successfully!"
	@echo "--------------------------------------------"
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔗 API:      http://localhost:4000"
	@echo "🔗 Queue:    http://localhost:4000/admin/queues"
	@echo "📈 Report:   artillery-report.json"
	@echo "--------------------------------------------"

up:
	@echo "🧱 Building and starting $(PROJECT_NAME) services..."
	$(DOCKER_COMPOSE) up --build -d

down:
	@echo "🧹 Stopping services..."
	$(DOCKER_COMPOSE) down

logs:
	@echo "📜 Showing logs..."
	$(DOCKER_COMPOSE) logs -f api worker

clean:
	@echo "🔥 Removing containers and volumes..."
	$(DOCKER_COMPOSE) down -v

# === TESTS ===
smoke:
	@echo "✅ Running smoke test..."
	$(ARTILLERY) run tests/smoke-test.yml

load:
	@echo "💥 Running load test (~5000 requests)..."
	$(ARTILLERY) run tests/load-test.yml --output $(REPORT_FILE)

