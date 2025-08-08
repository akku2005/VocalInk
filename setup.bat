@echo off
setlocal enabledelayedexpansion

echo 🚀 VocalInk Docker and GitHub CLI Setup
echo ========================================

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Docker is installed
    for /f "tokens=*" %%i in ('docker --version') do echo [INFO] Docker version: %%i
) else (
    echo [ERROR] Docker is not installed. Please install Docker first.
    echo Visit: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Check Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Docker Compose is installed
) else (
    echo [WARNING] Docker Compose not found. Please install it manually.
    echo Visit: https://docs.docker.com/compose/install/
)

REM Check GitHub CLI
gh --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] GitHub CLI is installed
    for /f "tokens=*" %%i in ('gh --version') do (
        echo [INFO] GitHub CLI version: %%i
        goto :gh_version_done
    )
    :gh_version_done
) else (
    echo [WARNING] GitHub CLI is not installed. Please install it manually.
    echo Visit: https://cli.github.com/
    echo You can continue without GitHub CLI, but some features will be limited.
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Node.js is installed
    for /f "tokens=*" %%i in ('node --version') do echo [INFO] Node.js version: %%i
) else (
    echo [WARNING] Node.js is not installed. It's recommended for local development.
    echo Visit: https://nodejs.org/
)

REM Check Git
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Git is installed
    for /f "tokens=*" %%i in ('git --version') do echo [INFO] Git version: %%i
) else (
    echo [ERROR] Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Setup environment file
echo [INFO] Setting up environment configuration...

if not exist .env (
    if exist server\example.env (
        copy server\example.env .env >nul
        echo [SUCCESS] Created .env file from example.env
        echo [WARNING] Please review and update the .env file with your configuration
    ) else (
        echo [WARNING] No example.env found. Creating basic .env file...
        (
            echo # Database Configuration
            echo MONGO_ROOT_USERNAME=admin
            echo MONGO_ROOT_PASSWORD=password
            echo MONGO_DATABASE=vocalink
            echo.
            echo # Redis Configuration
            echo REDIS_PASSWORD=redispassword
            echo.
            echo # JWT Configuration
            echo JWT_SECRET=your-super-secret-jwt-key-change-this
            echo JWT_EXPIRES_IN=7d
            echo.
            echo # External APIs ^(Optional^)
            echo ELEVENLABS_API_KEY=
            echo GOOGLE_CLOUD_CREDENTIALS=
            echo.
            echo # Monitoring ^(Optional^)
            echo SENTRY_DSN=
            echo.
            echo # Email Configuration ^(Optional^)
            echo EMAIL_HOST=
            echo EMAIL_PORT=
            echo EMAIL_USER=
            echo EMAIL_PASS=
        ) > .env
        echo [SUCCESS] Created basic .env file
    )
) else (
    echo [INFO] .env file already exists
)

REM Install dependencies
echo [INFO] Installing dependencies...

if exist server\package.json (
    echo [INFO] Installing server dependencies...
    cd server
    call npm ci
    cd ..
    echo [SUCCESS] Server dependencies installed
)

if exist client\package.json (
    echo [INFO] Installing client dependencies...
    cd client
    call npm ci
    cd ..
    echo [SUCCESS] Client dependencies installed
)

REM Build Docker images
echo [INFO] Building Docker images...

docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Building development images...
    docker-compose -f docker-compose.dev.yml build
    echo [SUCCESS] Development images built successfully
    
    echo [INFO] Building production images...
    docker-compose build
    echo [SUCCESS] Production images built successfully
) else (
    echo [WARNING] Docker Compose not available. Skipping image build.
)

REM Setup GitHub CLI (if available)
gh --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Setting up GitHub CLI...
    
    REM Check if already authenticated
    gh auth status >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] GitHub CLI is already authenticated
    ) else (
        echo [WARNING] GitHub CLI authentication required.
        echo Please run: gh auth login
    )
    
    REM Set default repository if in a git repository
    if exist .git (
        for /f "tokens=*" %%i in ('git config --get remote.origin.url 2^>nul') do (
            if not "%%i"=="" (
                echo [INFO] Setting default repository...
                gh repo set-default
                echo [SUCCESS] Repository set as default
            )
        )
    )
)

REM Create useful scripts
echo [INFO] Creating utility scripts...

REM Create a quick start script
(
    echo @echo off
    echo echo Starting VocalInk development environment...
    echo docker-compose -f docker-compose.dev.yml up --build
) > start-dev.bat

REM Create a stop script
(
    echo @echo off
    echo echo Stopping VocalInk development environment...
    echo docker-compose -f docker-compose.dev.yml down
) > stop-dev.bat

REM Create a logs script
(
    echo @echo off
    echo echo Showing VocalInk logs...
    echo docker-compose -f docker-compose.dev.yml logs -f
) > logs.bat

echo [SUCCESS] Created utility scripts:
echo   - start-dev.bat: Start development environment
echo   - stop-dev.bat: Stop development environment
echo   - logs.bat: Show application logs

REM Final instructions
echo.
echo 🎉 Setup completed successfully!
echo ================================
echo.
echo Next steps:
echo 1. Review and update the .env file with your configuration
echo 2. Start development environment: start-dev.bat
echo 3. Or use Makefile commands: make dev
echo.
echo Useful commands:
echo   make help          - Show all available commands
echo   make dev           - Start development environment
echo   make test          - Run tests
echo   make lint          - Run linting
echo   make docker-build  - Build Docker images
echo   make status        - Check application status
echo.
echo Documentation:
echo   - DOCKER_GITHUB_SETUP.md - Complete setup guide
echo   - README.md - Project overview
echo.
echo Happy coding! 🚀
pause 