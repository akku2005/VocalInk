# VocalInk Server - Production Deployment Guide

This guide provides comprehensive instructions for deploying the VocalInk server to production with security, performance, and scalability in mind.

## 🚀 Pre-Deployment Checklist

### System Requirements
- **Node.js**: 18.x or higher
- **MongoDB**: 6.0 or higher
- **Redis**: 6.0 or higher
- **Memory**: Minimum 4GB RAM, Recommended 8GB+
- **Storage**: Minimum 50GB, Recommended 100GB+
- **CPU**: Minimum 2 cores, Recommended 4+ cores
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### Security Prerequisites
- [ ] Firewall configured (UFW/iptables)
- [ ] SSL certificates obtained
- [ ] Domain DNS configured
- [ ] Server hardened (SSH key-based auth, fail2ban)
- [ ] Regular security updates enabled

## 📋 Step-by-Step Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git build-essential python3

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/vocalink-server.git
cd vocalink-server

# Install dependencies
npm ci --only=production

# Run production setup script
node scripts/setup-production.js

# Create production environment file
cp .env.production .env
# Edit .env with your production values
nano .env
```

### 3. Environment Configuration

Update your `.env` file with production values:

```env
# Application environment
NODE_ENV=production
APP_VERSION=1.0.0

# Server configuration
PORT=3000
HOST=0.0.0.0
TRUST_PROXY=true

# Database connection
MONGO_URI=mongodb://localhost:27017/vocalink_production
MONGO_MAX_POOL_SIZE=20
MONGO_MIN_POOL_SIZE=5

# JWT Configuration (USE STRONG SECRETS!)
JWT_SECRET=your-256-bit-cryptographically-secure-secret-here
JWT_REFRESH_SECRET=your-256-bit-cryptographically-secure-refresh-secret-here

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-strong-redis-password

# Security Configuration
ENABLE_HTTPS=true
FORCE_HTTPS=true
ENABLE_2FA=true
ENABLE_DEVICE_FINGERPRINTING=true

# Rate Limiting
GENERAL_RATE_LIMIT_MAX=50
AUTH_RATE_LIMIT_MAX=3
AI_RATE_LIMIT_PER_HOUR=50

# Monitoring
SENTRY_DSN=your-sentry-dsn-here
ENABLE_MONITORING=true
```

### 4. Database Setup

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh
use vocalink_production
db.createUser({
  user: "vocalink_user",
  pwd: "your-strong-password",
  roles: ["readWrite"]
})

# Create indexes (run after first deployment)
node scripts/create-indexes.js
```

### 5. Redis Setup

```bash
# Configure Redis
sudo nano /etc/redis/redis.conf

# Add/modify these settings:
bind 127.0.0.1
requirepass your-strong-redis-password
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

### 6. Application Deployment

```bash
# Test the application
npm run test

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs vocalink
```

### 7. Nginx Configuration

Create Nginx configuration:

```nginx
# /etc/nginx/sites-available/vocalink
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # Client Max Body Size
    client_max_body_size 10M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # API Routes with Rate Limiting
    location /api/auth {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static Files
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/vocalink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 8. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 9. Firewall Configuration

```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Check status
sudo ufw status
```

### 10. Monitoring Setup

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Setup log rotation
sudo cp logrotate.conf /etc/logrotate.d/vocalink

# Setup cron jobs
crontab crontab.txt

# Check cron jobs
crontab -l
```

## 🔒 Security Hardening

### 1. Server Hardening

```bash
# Disable root login
sudo passwd -l root

# Setup SSH key authentication
ssh-keygen -t ed25519 -C "your-email@example.com"
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Add/modify these settings:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Change default SSH port
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Restart SSH
sudo systemctl restart sshd
```

### 2. Fail2ban Setup

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Create jail configuration
sudo nano /etc/fail2ban/jail.local

# Add this configuration:
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

# Restart fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### 3. Application Security

```bash
# Create security audit script
cat > security-audit.sh << 'EOF'
#!/bin/bash
echo "=== VocalInk Security Audit ==="
echo "Date: $(date)"
echo ""

# Check for open ports
echo "Open ports:"
sudo netstat -tlnp | grep LISTEN
echo ""

# Check for running processes
echo "Running processes:"
ps aux | grep node
echo ""

# Check file permissions
echo "File permissions:"
ls -la *.js *.json
echo ""

# Check for vulnerabilities
echo "NPM audit:"
npm audit --audit-level moderate
echo ""

# Check logs for errors
echo "Recent errors in logs:"
tail -n 50 logs/app.log | grep -i error
echo ""
EOF

chmod +x security-audit.sh
```

## 📊 Performance Optimization

### 1. Database Optimization

```bash
# MongoDB optimization
sudo nano /etc/mongod.conf

# Add/modify these settings:
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2
    collectionConfig:
      blockCompressor: snappy

operationProfiling:
  slowOpThresholdMs: 100
  mode: slowOp

# Restart MongoDB
sudo systemctl restart mongod
```

### 2. Redis Optimization

```bash
# Redis optimization
sudo nano /etc/redis/redis.conf

# Add/modify these settings:
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
tcp-keepalive 300

# Restart Redis
sudo systemctl restart redis-server
```

### 3. Node.js Optimization

```bash
# Add to your start script
export NODE_OPTIONS="--max-old-space-size=2048 --optimize-for-size --gc-interval=100"
```

## 🚨 Monitoring and Alerting

### 1. Health Checks

```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="https://your-domain.com/health"
MAX_RETRIES=3
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        echo "✅ Server is healthy"
        exit 0
    else
        echo "❌ Health check failed (attempt $i/$MAX_RETRIES)"
        if [ $i -lt $MAX_RETRIES ]; then
            sleep $RETRY_DELAY
        fi
    fi
done

echo "❌ Server is unhealthy after $MAX_RETRIES attempts"
exit 1
EOF

chmod +x health-check.sh
```

### 2. Log Monitoring

```bash
# Setup log monitoring
cat > log-monitor.sh << 'EOF'
#!/bin/bash
LOG_FILE="logs/app.log"
ERROR_THRESHOLD=10
TIME_WINDOW=300  # 5 minutes

# Count errors in the last 5 minutes
error_count=$(tail -n 1000 "$LOG_FILE" | grep "$(date -d '5 minutes ago' '+%Y-%m-%d %H:%M')" | grep -c "ERROR")

if [ $error_count -gt $ERROR_THRESHOLD ]; then
    echo "⚠️ High error rate detected: $error_count errors in last 5 minutes"
    # Add your alerting logic here (email, webhook, etc.)
fi
EOF

chmod +x log-monitor.sh
```

## 🔄 Deployment Process

### 1. Automated Deployment

```bash
# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --only=production

# Run tests
npm test

# Run database migrations (if any)
# node scripts/migrate.js

# Restart application
pm2 reload vocalink

# Check health
sleep 10
./health-check.sh

echo "✅ Deployment completed successfully!"
EOF

chmod +x deploy.sh
```

### 2. Rollback Process

```bash
# Create rollback script
cat > rollback.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Starting rollback..."

# Get current commit
CURRENT_COMMIT=$(git rev-parse HEAD)

# Get previous commit
PREVIOUS_COMMIT=$(git rev-parse HEAD~1)

# Checkout previous commit
git checkout $PREVIOUS_COMMIT

# Install dependencies
npm ci --only=production

# Restart application
pm2 reload vocalink

# Check health
sleep 10
./health-check.sh

echo "✅ Rollback completed successfully!"
echo "Previous commit: $PREVIOUS_COMMIT"
echo "Current commit: $CURRENT_COMMIT"
EOF

chmod +x rollback.sh
```

## 📈 Scaling Considerations

### 1. Horizontal Scaling

```bash
# Load balancer configuration (Nginx)
upstream vocalink_backend {
    least_conn;
    server 127.0.0.1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3003 weight=1 max_fails=3 fail_timeout=30s;
}
```

### 2. Database Scaling

```bash
# MongoDB replica set setup
# Add secondary nodes and configure replication
# Consider MongoDB Atlas for managed scaling
```

### 3. Cache Scaling

```bash
# Redis cluster setup
# Consider Redis Enterprise or AWS ElastiCache
```

## 🆘 Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Check logs
   pm2 logs vocalink
   
   # Check environment
   node -e "console.log(process.env.NODE_ENV)"
   
   # Check dependencies
   npm ls --depth=0
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Check connection
   mongosh "mongodb://localhost:27017/vocalink_production"
   ```

3. **Memory issues**
   ```bash
   # Check memory usage
   free -h
   
   # Check Node.js memory
   pm2 show vocalink
   ```

4. **Performance issues**
   ```bash
   # Check database performance
   mongosh --eval "db.currentOp()"
   
   # Check Redis performance
   redis-cli info memory
   ```

### Emergency Procedures

```bash
# Emergency restart
pm2 restart vocalink

# Emergency rollback
./rollback.sh

# Emergency shutdown
pm2 stop vocalink
sudo systemctl stop nginx
sudo systemctl stop mongod
sudo systemctl stop redis-server
```

## 📚 Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MongoDB Production Checklist](https://docs.mongodb.com/manual/administration/production-checklist/)
- [Redis Production Best Practices](https://redis.io/topics/admin)
- [Nginx Performance Tuning](https://nginx.org/en/docs/beginners_guide.html)
- [SSL/TLS Security](https://ssl-config.mozilla.org/)

## 🎯 Maintenance Schedule

### Daily
- [ ] Check application health
- [ ] Monitor error logs
- [ ] Check system resources

### Weekly
- [ ] Review security logs
- [ ] Check backup status
- [ ] Update system packages
- [ ] Review performance metrics

### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Backup restoration test
- [ ] SSL certificate renewal check

### Quarterly
- [ ] Full security assessment
- [ ] Performance optimization review
- [ ] Disaster recovery test
- [ ] Update deployment procedures

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures, monitor for new vulnerabilities, and keep your systems updated. 