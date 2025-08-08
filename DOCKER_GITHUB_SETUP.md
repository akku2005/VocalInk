# Docker and GitHub CLI Setup Guide

This guide provides comprehensive instructions for setting up Docker and GitHub CLI for the VocalInk project following industry best practices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Setup](#docker-setup)
3. [GitHub CLI Setup](#github-cli-setup)
4. [Development Workflow](#development-workflow)
5. [Production Deployment](#production-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- GitHub CLI
- Git
- Node.js 18+ (for local development)

### Install Docker

#### Windows
```bash
# Download and install Docker Desktop from:
# https://www.docker.com/products/docker-desktop
```

#### macOS
```bash
# Using Homebrew
brew install --cask docker

# Or download from:
# https://www.docker.com/products/docker-desktop
```

#### Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up stable repository
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER
```

### Install GitHub CLI

#### Windows
```bash
# Using winget
winget install GitHub.cli

# Or download from:
# https://cli.github.com/
```

#### macOS
```bash
# Using Homebrew
brew install gh
```

#### Linux
```bash
# Using package manager
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

## Docker Setup

### Project Structure
```
VocalInk/
├── docker-compose.yml          # Production environment
├── docker-compose.dev.yml      # Development environment
├── server/
│   ├── Dockerfile             # Production server image
│   ├── Dockerfile.dev         # Development server image
│   └── .dockerignore          # Exclude files from build
├── client/
│   ├── Dockerfile             # Production client image
│   ├── Dockerfile.dev         # Development client image
│   ├── nginx.conf             # Nginx configuration
│   └── .dockerignore          # Exclude files from build
└── .github/
    └── workflows/
        └── ci.yml             # CI/CD pipeline
```

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
MONGO_DATABASE=vocalink

# Redis Configuration
REDIS_PASSWORD=your-redis-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# External APIs
ELEVENLABS_API_KEY=your-elevenlabs-api-key
GOOGLE_CLOUD_CREDENTIALS=your-google-cloud-credentials

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Quick Start

#### Development Environment
```bash
# Start development environment
make dev

# Or manually
docker-compose -f docker-compose.dev.yml up --build
```

#### Production Environment
```bash
# Start production environment
make prod

# Or manually
docker-compose up --build -d
```

### Available Commands

```bash
# Development
make dev                    # Start development environment
make install               # Install dependencies
make test                  # Run all tests
make lint                  # Run linting
make format                # Format code

# Docker Operations
make docker-build          # Build all Docker images
make docker-run            # Run with Docker
make docker-stop           # Stop containers
make docker-logs           # Show logs
make docker-clean          # Clean Docker resources

# Production
make prod                  # Start production environment
make build-prod            # Build for production
make deploy-prod           # Deploy to production

# Monitoring
make health-check          # Check application health
make status                # Show application status
make logs                  # Show application logs
```

## GitHub CLI Setup

### Authentication

```bash
# Login to GitHub
gh auth login

# Follow the interactive prompts to authenticate
```

### Repository Setup

```bash
# Set default repository
gh repo set-default

# View repository information
gh repo view
```

### Common GitHub CLI Commands

```bash
# Create issues
gh issue create --title "Bug Report" --body "Description" --label "bug"

# Create pull requests
gh pr create --title "Feature" --body "Description" --base main

# Create releases
gh release create v1.0.0 --title "Release v1.0.0" --notes "Release notes"

# View issues and PRs
gh issue list
gh pr list

# Clone repositories
gh repo clone username/repository
```

### GitHub CLI with Makefile

```bash
# Setup GitHub CLI
make github-setup

# Create pull request
make github-pr TITLE="Feature" BODY="Description"

# Create release
make github-release VERSION="v1.0.0" TITLE="Release v1.0.0" NOTES="Release notes"

# Create issue
make github-issue TITLE="Bug" BODY="Description" LABEL="bug"
```

## Development Workflow

### 1. Initial Setup
```bash
# Clone repository
git clone https://github.com/yourusername/VocalInk.git
cd VocalInk

# Setup environment
make setup-env

# Install dependencies
make install

# Start development environment
make dev
```

### 2. Daily Development
```bash
# Start development environment
make dev

# In another terminal, run tests
make test

# Check code quality
make lint
make format

# Build for testing
make build
```

### 3. Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
make github-pr TITLE="Add new feature" BODY="Description"
```

## Production Deployment

### 1. Build Production Images
```bash
# Build all images
make docker-build

# Or build specific services
docker-compose build server client
```

### 2. Deploy to Production
```bash
# Deploy to production
make deploy-prod

# Or manually
docker-compose up -d
```

### 3. Monitor Deployment
```bash
# Check application status
make status

# View logs
make logs

# Health check
make health-check
```

## CI/CD Pipeline

### GitHub Actions Workflow

The project includes a comprehensive CI/CD pipeline in `.github/workflows/ci.yml`:

1. **Security Scanning**: Trivy vulnerability scanner
2. **Testing**: Backend and frontend tests
3. **Code Quality**: Linting and formatting
4. **Docker Build**: Multi-stage builds with caching
5. **Deployment**: Staging and production deployments

### Pipeline Stages

```yaml
# Security and Code Quality
security:
  - Trivy vulnerability scanning
  - npm audit

# Backend Testing
test-backend:
  - Unit tests
  - Integration tests
  - Coverage reporting

# Frontend Testing
test-frontend:
  - Build verification
  - Linting

# Docker Build and Push
build-and-push:
  - Multi-stage builds
  - Image optimization
  - Registry push

# Deployment
deploy-staging:
deploy-production:
```

### Environment Secrets

Configure these secrets in your GitHub repository:

- `DOCKER_REGISTRY`: Container registry URL
- `DOCKER_USERNAME`: Registry username
- `DOCKER_PASSWORD`: Registry password
- `KUBECONFIG`: Kubernetes configuration
- `SLACK_WEBHOOK`: Slack notifications

## Security Best Practices

### Docker Security

1. **Multi-stage builds** to reduce image size
2. **Non-root users** in containers
3. **Health checks** for monitoring
4. **Security scanning** with Trivy
5. **Regular base image updates**

### Environment Security

1. **Secrets management** with environment variables
2. **Network isolation** with Docker networks
3. **Resource limits** to prevent abuse
4. **Read-only file systems** where possible

### Code Security

1. **Dependency scanning** with npm audit
2. **Static analysis** with ESLint
3. **Vulnerability scanning** in CI/CD
4. **Regular security updates**

## Troubleshooting

### Common Issues

#### Docker Issues
```bash
# Permission denied
sudo usermod -aG docker $USER
# Log out and log back in

# Port already in use
docker-compose down
# Or change ports in docker-compose.yml

# Build cache issues
docker system prune -a
```

#### GitHub CLI Issues
```bash
# Authentication problems
gh auth logout
gh auth login

# Repository not found
gh repo set-default
```

#### Application Issues
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs [service-name]

# Restart services
docker-compose restart [service-name]

# Health check
make health-check
```

### Debug Commands

```bash
# Enter running container
docker exec -it vocalink-server bash

# View container resources
docker stats

# Inspect container
docker inspect vocalink-server

# View network
docker network ls
docker network inspect vocalink-network
```

### Performance Optimization

```bash
# Optimize Docker images
docker system prune -a

# Monitor resource usage
docker stats

# Optimize build cache
docker build --no-cache .
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub CLI Documentation](https://cli.github.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review GitHub Issues
3. Create a new issue with detailed information
4. Contact the development team 