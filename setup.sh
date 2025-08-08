#!/bin/bash

# VocalInk Docker and GitHub CLI Setup Script
# This script automates the initial setup process

set -e

echo "🚀 VocalInk Docker and GitHub CLI Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    print_warning "Running on Windows. Some commands may need to be adjusted."
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check Docker
if command -v docker &> /dev/null; then
    print_success "Docker is installed"
    docker_version=$(docker --version)
    print_status "Docker version: $docker_version"
else
    print_error "Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    print_success "Docker Compose is installed"
else
    print_warning "Docker Compose not found. Installing..."
    # Try to install docker-compose
    if command -v pip &> /dev/null; then
        pip install docker-compose
    else
        print_error "Please install Docker Compose manually."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
fi

# Check GitHub CLI
if command -v gh &> /dev/null; then
    print_success "GitHub CLI is installed"
    gh_version=$(gh --version | head -n 1)
    print_status "GitHub CLI version: $gh_version"
else
    print_warning "GitHub CLI is not installed. Please install it manually."
    echo "Visit: https://cli.github.com/"
    echo "You can continue without GitHub CLI, but some features will be limited."
fi

# Check Node.js
if command -v node &> /dev/null; then
    print_success "Node.js is installed"
    node_version=$(node --version)
    print_status "Node.js version: $node_version"
else
    print_warning "Node.js is not installed. It's recommended for local development."
    echo "Visit: https://nodejs.org/"
fi

# Check Git
if command -v git &> /dev/null; then
    print_success "Git is installed"
    git_version=$(git --version)
    print_status "Git version: $git_version"
else
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Setup environment file
print_status "Setting up environment configuration..."

if [ ! -f .env ]; then
    if [ -f server/example.env ]; then
        cp server/example.env .env
        print_success "Created .env file from example.env"
        print_warning "Please review and update the .env file with your configuration"
    else
        print_warning "No example.env found. Creating basic .env file..."
        cat > .env << EOF
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=password
MONGO_DATABASE=vocalink

# Redis Configuration
REDIS_PASSWORD=redispassword

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# External APIs (Optional)
ELEVENLABS_API_KEY=
GOOGLE_CLOUD_CREDENTIALS=

# Monitoring (Optional)
SENTRY_DSN=

# Email Configuration (Optional)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EOF
        print_success "Created basic .env file"
    fi
else
    print_status ".env file already exists"
fi

# Install dependencies
print_status "Installing dependencies..."

if [ -d "server" ] && [ -f "server/package.json" ]; then
    print_status "Installing server dependencies..."
    cd server
    npm ci
    cd ..
    print_success "Server dependencies installed"
fi

if [ -d "client" ] && [ -f "client/package.json" ]; then
    print_status "Installing client dependencies..."
    cd client
    npm ci
    cd ..
    print_success "Client dependencies installed"
fi

# Build Docker images
print_status "Building Docker images..."

if command -v docker-compose &> /dev/null; then
    print_status "Building development images..."
    docker-compose -f docker-compose.dev.yml build
    print_success "Development images built successfully"
    
    print_status "Building production images..."
    docker-compose build
    print_success "Production images built successfully"
else
    print_warning "Docker Compose not available. Skipping image build."
fi

# Setup GitHub CLI (if available)
if command -v gh &> /dev/null; then
    print_status "Setting up GitHub CLI..."
    
    # Check if already authenticated
    if gh auth status &> /dev/null; then
        print_success "GitHub CLI is already authenticated"
    else
        print_warning "GitHub CLI authentication required."
        echo "Please run: gh auth login"
    fi
    
    # Set default repository if in a git repository
    if [ -d ".git" ]; then
        remote_url=$(git config --get remote.origin.url)
        if [ ! -z "$remote_url" ]; then
            print_status "Setting default repository..."
            gh repo set-default
            print_success "Repository set as default"
        fi
    fi
fi

# Create useful aliases and scripts
print_status "Creating utility scripts..."

# Create a quick start script
cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "Starting VocalInk development environment..."
docker-compose -f docker-compose.dev.yml up --build
EOF

# Create a stop script
cat > stop-dev.sh << 'EOF'
#!/bin/bash
echo "Stopping VocalInk development environment..."
docker-compose -f docker-compose.dev.yml down
EOF

# Create a logs script
cat > logs.sh << 'EOF'
#!/bin/bash
echo "Showing VocalInk logs..."
docker-compose -f docker-compose.dev.yml logs -f
EOF

# Make scripts executable
chmod +x start-dev.sh stop-dev.sh logs.sh

print_success "Created utility scripts:"
echo "  - start-dev.sh: Start development environment"
echo "  - stop-dev.sh: Stop development environment"
echo "  - logs.sh: Show application logs"

# Final instructions
echo ""
echo "🎉 Setup completed successfully!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Review and update the .env file with your configuration"
echo "2. Start development environment: ./start-dev.sh"
echo "3. Or use Makefile commands: make dev"
echo ""
echo "Useful commands:"
echo "  make help          - Show all available commands"
echo "  make dev           - Start development environment"
echo "  make test          - Run tests"
echo "  make lint          - Run linting"
echo "  make docker-build  - Build Docker images"
echo "  make status        - Check application status"
echo ""
echo "Documentation:"
echo "  - DOCKER_GITHUB_SETUP.md - Complete setup guide"
echo "  - README.md - Project overview"
echo ""
echo "Happy coding! 🚀" 