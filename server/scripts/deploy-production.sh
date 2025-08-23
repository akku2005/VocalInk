#!/bin/bash

# Production Deployment Script for Security Fixes
# This script deploys the security fixes to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="VocalInk"
DEPLOY_DIR="/opt/vocalink"
BACKUP_DIR="/opt/backups/vocalink"
LOG_FILE="/var/log/vocalink/deploy.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required commands exist
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed"; exit 1; }
    command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed"; exit 1; }
    command -v pm2 >/dev/null 2>&1 || { log_error "PM2 is required but not installed"; exit 1; }
    command -v redis-cli >/dev/null 2>&1 || { log_warning "Redis CLI not found - some features may not work"; }
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"
    if ! node -e "process.exit(process.version < 'v$REQUIRED_VERSION' ? 1 : 0)"; then
        log_error "Node.js version $REQUIRED_VERSION or higher is required. Current version: $NODE_VERSION"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup of current deployment..."
    
    if [ -d "$DEPLOY_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        cp -r "$DEPLOY_DIR" "$BACKUP_DIR/backup_$TIMESTAMP"
        log_success "Backup created: $BACKUP_DIR/backup_$TIMESTAMP"
    else
        log_warning "No existing deployment found to backup"
    fi
}

# Update dependencies
update_dependencies() {
    log "Updating dependencies..."
    
    cd "$DEPLOY_DIR"
    
    # Install new dependencies
    npm install --production --no-optional
    
    # Check for security vulnerabilities
    log "Checking for security vulnerabilities..."
    npm audit --audit-level=moderate || log_warning "Some security vulnerabilities found - review npm audit report"
    
    log_success "Dependencies updated"
}

# Deploy security fixes
deploy_security_fixes() {
    log "Deploying security fixes..."
    
    cd "$DEPLOY_DIR"
    
    # Copy new security files
    log "Installing security monitoring service..."
    cp -f src/services/SecurityMonitoringService.js src/services/
    
    log "Installing enhanced rate limiter..."
    cp -f src/middleware/enhancedRateLimiter.js src/middleware/
    
    log "Installing secure parser utility..."
    cp -f src/utils/secureParser.js src/utils/
    
    log "Installing security routes..."
    cp -f src/routes/security.js src/routes/
    
    log "Updating main application..."
    cp -f src/app.js src/app/
    
    # Update other modified files
    log "Updating modified components..."
    cp -f src/models/badge.model.js src/models/
    cp -f src/services/WebSocketService.js src/services/
    cp -f src/middleware/xpMiddleware.js src/middleware/
    cp -f src/badge/badge.controller.js src/badge/
    cp -f src/abusereport/abusereport.controller.js src/abusereport/
    cp -f src/ai/ai-enhanced.controller.js src/ai/
    cp -f src/services/CacheService.js src/services/
    cp -f src/services/BadgeService.js src/services/
    cp -f src/services/STTService.js src/services/
    cp -f src/services/I18nService.js src/services/
    cp -f src/services/AIMachineLearningService.js src/services/
    cp -f src/config/index.js src/config/
    cp -f src/series/series.controller.js src/series/
    cp -f src/user/user.controller.js src/user/
    
    log_success "Security fixes deployed"
}

# Run security tests
run_security_tests() {
    log "Running security tests..."
    
    cd "$DEPLOY_DIR"
    
    # Run the security testing suite
    if [ -f "scripts/security-test.js" ]; then
        log "Executing security test suite..."
        node scripts/security-test.js || {
            log_warning "Some security tests failed - review the results"
        }
    else
        log_warning "Security test script not found - skipping tests"
    fi
    
    log_success "Security tests completed"
}

# Restart services
restart_services() {
    log "Restarting services..."
    
    # Restart PM2 processes
    pm2 restart vocalink || {
        log_error "Failed to restart PM2 process"
        exit 1
    }
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if pm2 list | grep -q "vocalink.*online"; then
        log_success "Services restarted successfully"
    else
        log_error "Services failed to start properly"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if application is responding
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:3000/health" > /dev/null; then
            log_success "Application is responding to health checks"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Application failed to respond after $max_attempts attempts"
            exit 1
        fi
        
        log "Attempt $attempt/$max_attempts - waiting for application to be ready..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    # Check security endpoints
    log "Testing security endpoints..."
    if curl -f -s "http://localhost:3000/api/security/health" > /dev/null; then
        log_success "Security endpoints are accessible"
    else
        log_warning "Security endpoints may not be working properly"
    fi
    
    log_success "Deployment verification completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up security monitoring..."
    
    # Create log directory if it doesn't exist
    mkdir -p /var/log/vocalink/security
    
    # Setup log rotation for security logs
    if [ ! -f /etc/logrotate.d/vocalink-security ]; then
        cat > /etc/logrotate.d/vocalink-security << EOF
/var/log/vocalink/security/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 vocalink vocalink
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
        log_success "Log rotation configured for security logs"
    fi
    
    # Setup security monitoring alerts
    log "Setting up security monitoring alerts..."
    
    # Create monitoring script
    cat > "$DEPLOY_DIR/scripts/monitor-security.sh" << 'EOF'
#!/bin/bash
# Security monitoring script

LOG_FILE="/var/log/vocalink/security/monitor.log"
ALERT_EMAIL="admin@vocalink.com"

# Check for critical security events
check_critical_events() {
    local critical_count=$(grep -c "CRITICAL" /var/log/vocalink/security/*.log 2>/dev/null || echo "0")
    
    if [ "$critical_count" -gt 0 ]; then
        echo "CRITICAL: $critical_count critical security events detected" | tee -a "$LOG_FILE"
        # Send alert email
        echo "Critical security events detected on VocalInk server" | mail -s "SECURITY ALERT" "$ALERT_EMAIL"
    fi
}

# Check for failed authentication attempts
check_auth_failures() {
    local auth_failures=$(grep -c "auth_failure" /var/log/vocalink/security/*.log 2>/dev/null || echo "0")
    
    if [ "$auth_failures" -gt 10 ]; then
        echo "WARNING: High number of authentication failures: $auth_failures" | tee -a "$LOG_FILE"
    fi
}

# Run checks
check_critical_events
check_auth_failures

echo "Security monitoring check completed at $(date)" >> "$LOG_FILE"
EOF
    
    chmod +x "$DEPLOY_DIR/scripts/monitor-security.sh"
    
    # Add to crontab for regular monitoring
    (crontab -l 2>/dev/null; echo "*/5 * * * * $DEPLOY_DIR/scripts/monitor-security.sh") | crontab -
    
    log_success "Security monitoring setup completed"
}

# Main deployment function
main() {
    log "Starting production deployment of security fixes for $APP_NAME"
    
    # Check permissions
    check_permissions
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup
    create_backup
    
    # Update dependencies
    update_dependencies
    
    # Deploy security fixes
    deploy_security_fixes
    
    # Run security tests
    run_security_tests
    
    # Restart services
    restart_services
    
    # Verify deployment
    verify_deployment
    
    # Setup monitoring
    setup_monitoring
    
    log_success "Production deployment completed successfully!"
    log "Security fixes are now active and monitoring is enabled"
    log "Review the security dashboard at /api/security/dashboard"
    
    # Display next steps
    echo
    echo -e "${GREEN}Next Steps:${NC}"
    echo "1. Monitor the security dashboard for any issues"
    echo "2. Review security logs at /var/log/vocalink/security/"
    echo "3. Test the security endpoints manually"
    echo "4. Update your security documentation"
    echo "5. Consider running a security audit"
}

# Run main function
main "$@" 