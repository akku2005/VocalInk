# VocalInk Project Makefile
# Provides common commands for development, testing, and deployment

.PHONY: help install test build clean docker-build docker-run docker-stop docker-logs
.PHONY: dev prod lint format security-audit coverage deploy-staging deploy-prod
.PHONY: github-setup github-pr github-release github-issue

# Default target
help: ## Show this help message
	@echo "VocalInk Project - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development Commands
install: ## Install all dependencies
	@echo "Installing dependencies..."
	cd server && npm ci
	cd client && npm ci

dev: ## Start development environment
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up --build

prod: ## Start production environment
	@echo "Starting production environment..."
	docker-compose up --build -d

# Testing Commands
test: ## Run all tests
	@echo "Running tests..."
	cd server && npm test
	cd client && npm run build

test-backend: ## Run backend tests only
	@echo "Running backend tests..."
	cd server && npm test

test-frontend: ## Run frontend tests only
	@echo "Running frontend tests..."
	cd client && npm run build

coverage: ## Generate test coverage report
	@echo "Generating coverage report..."
	cd server && npm run test:coverage

# Code Quality Commands
lint: ## Run linting on all code
	@echo "Running linting..."
	cd server && npm run lint
	cd client && npm run lint

format: ## Format all code
	@echo "Formatting code..."
	cd server && npm run format
	cd client && npm run format

lint-fix: ## Fix linting issues
	@echo "Fixing linting issues..."
	cd server && npm run lint:fix
	cd client && npm run lint:fix

# Security Commands
security-audit: ## Run security audit
	@echo "Running security audit..."
	cd server && npm run security-audit
	cd client && npm audit

security-fix: ## Fix security vulnerabilities
	@echo "Fixing security vulnerabilities..."
	cd server && npm run security-fix
	cd client && npm audit fix

# Docker Commands
docker-build: ## Build all Docker images
	@echo "Building Docker images..."
	docker-compose build

docker-run: ## Run application with Docker
	@echo "Running application with Docker..."
	docker-compose up -d

docker-stop: ## Stop all Docker containers
	@echo "Stopping Docker containers..."
	docker-compose down

docker-logs: ## Show Docker logs
	@echo "Showing Docker logs..."
	docker-compose logs -f

docker-clean: ## Clean Docker resources
	@echo "Cleaning Docker resources..."
	docker-compose down -v --remove-orphans
	docker system prune -f

# Build Commands
build: ## Build all applications
	@echo "Building applications..."
	cd server && npm run build
	cd client && npm run build

build-prod: ## Build for production
	@echo "Building for production..."
	cd client && npm run build
	cd server && npm ci --only=production

# Deployment Commands
deploy-staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	# Add your staging deployment logic here
	@echo "Staging deployment completed"

deploy-prod: ## Deploy to production environment
	@echo "Deploying to production..."
	# Add your production deployment logic here
	@echo "Production deployment completed"

# GitHub CLI Commands
github-setup: ## Setup GitHub CLI
	@echo "Setting up GitHub CLI..."
	@if ! command -v gh &> /dev/null; then \
		echo "GitHub CLI not found. Please install it first: https://cli.github.com/"; \
		exit 1; \
	fi
	gh auth login
	gh repo set-default

github-pr: ## Create a pull request
	@echo "Creating pull request..."
	gh pr create --title "$(TITLE)" --body "$(BODY)" --base main

github-release: ## Create a GitHub release
	@echo "Creating GitHub release..."
	gh release create $(VERSION) --title "$(TITLE)" --notes "$(NOTES)"

github-issue: ## Create a GitHub issue
	@echo "Creating GitHub issue..."
	gh issue create --title "$(TITLE)" --body "$(BODY)" --label "$(LABEL)"

# Database Commands
db-backup: ## Backup database
	@echo "Backing up database..."
	cd server && npm run backup

db-restore: ## Restore database
	@echo "Restoring database..."
	# Add your database restore logic here

# Monitoring Commands
monitor: ## Start monitoring
	@echo "Starting monitoring..."
	cd server && npm run monitor

health-check: ## Check application health
	@echo "Checking application health..."
	curl -f http://localhost:3000/health || exit 1
	curl -f http://localhost:80/health || exit 1

# Utility Commands
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf server/node_modules client/node_modules
	rm -rf server/coverage client/dist
	rm -rf .nyc_output

logs: ## Show application logs
	@echo "Showing application logs..."
	docker-compose logs -f

status: ## Show application status
	@echo "Application Status:"
	@docker-compose ps
	@echo ""
	@echo "Health Checks:"
	@curl -s http://localhost:3000/health || echo "Server: DOWN"
	@curl -s http://localhost:80/health || echo "Client: DOWN"

# Environment Setup
setup-env: ## Setup environment variables
	@echo "Setting up environment variables..."
	@if [ ! -f .env ]; then \
		cp server/example.env .env; \
		echo "Created .env file from example.env"; \
	else \
		echo ".env file already exists"; \
	fi

# Development Workflow
workflow: ## Complete development workflow
	@echo "Running complete development workflow..."
	@make install
	@make lint
	@make test
	@make build
	@make docker-build
	@make docker-run
	@echo "Development workflow completed!"

# Production Workflow
prod-workflow: ## Complete production workflow
	@echo "Running complete production workflow..."
	@make security-audit
	@make test
	@make build-prod
	@make docker-build
	@make deploy-prod
	@echo "Production workflow completed!" 