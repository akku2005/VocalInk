#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Production Setup Script for VocalInk Server
 * This script configures the server for production deployment
 */

class ProductionSetup {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.configDir = path.join(this.rootDir, 'src', 'config');
    this.logsDir = path.join(this.rootDir, 'logs');
    this.modelsDir = path.join(this.rootDir, 'models');
    this.backupsDir = path.join(this.rootDir, 'backups');
  }

  /**
   * Run production setup
   */
  async run() {
    try {
      console.log('🚀 Starting VocalInk Production Setup...\n');

      // Create necessary directories
      await this.createDirectories();

      // Generate secure secrets
      await this.generateSecrets();

      // Setup production configuration
      await this.setupProductionConfig();

      // Setup logging
      await this.setupLogging();

      // Setup monitoring
      await this.setupMonitoring();

      // Setup security
      await this.setupSecurity();

      // Setup database indexes
      await this.setupDatabaseIndexes();

      // Setup AI services
      await this.setupAIServices();

      // Setup backup
      await this.setupBackup();

      // Create production startup script
      await this.createProductionStartup();

      console.log('\n✅ Production setup completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Update your .env file with the generated secrets');
      console.log('2. Configure your database connection');
      console.log('3. Set up Redis for caching and sessions');
      console.log('4. Configure your reverse proxy (Nginx/Apache)');
      console.log('5. Set up SSL certificates');
      console.log('6. Configure monitoring and alerting');
      console.log('7. Test the production setup');
      console.log('8. Deploy to your production server');

    } catch (error) {
      console.error('\n❌ Production setup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Create necessary directories
   */
  async createDirectories() {
    console.log('📁 Creating directories...');

    const directories = [
      this.logsDir,
      this.modelsDir,
      this.backupsDir,
      path.join(this.rootDir, 'uploads'),
      path.join(this.rootDir, 'public', 'tts'),
      path.join(this.rootDir, 'public', 'audio'),
      path.join(this.rootDir, 'translations')
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
      } else {
        console.log(`  ℹ️  Exists: ${dir}`);
      }
    }
  }

  /**
   * Generate secure secrets
   */
  async generateSecrets() {
    console.log('\n🔐 Generating secure secrets...');

    const secrets = {
      JWT_SECRET: crypto.randomBytes(32).toString('hex'),
      JWT_REFRESH_SECRET: crypto.randomBytes(32).toString('hex'),
      SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
      COOKIE_SECRET: crypto.randomBytes(32).toString('hex'),
      ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
    };

    // Create secrets file
    const secretsPath = path.join(this.rootDir, 'secrets.json');
    fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));

    console.log('  ✅ Generated secrets.json');
    console.log('  ⚠️  IMPORTANT: Keep this file secure and never commit it to version control!');

    return secrets;
  }

  /**
   * Setup production configuration
   */
  async setupProductionConfig() {
    console.log('\n⚙️  Setting up production configuration...');

    // Create production config
    const productionConfig = {
      server: {
        port: process.env.PORT || 3000,
        host: '0.0.0.0',
        trustProxy: true,
        compression: true
      },
      database: {
        maxPoolSize: 20,
        minPoolSize: 5,
        autoIndex: false,
        readPreference: 'secondaryPreferred'
      },
      security: {
        enableHTTPS: true,
        forceHTTPS: true,
        enableHSTS: true,
        enableCSP: true
      },
      performance: {
        enableClustering: true,
        clusterWorkers: require('os').cpus().length,
        maxHeapSize: '2G',
        enableCompression: true
      }
    };

    const configPath = path.join(this.configDir, 'production.json');
    fs.writeFileSync(configPath, JSON.stringify(productionConfig, null, 2));

    console.log('  ✅ Created production.json configuration');
  }

  /**
   * Setup logging
   */
  async setupLogging() {
    console.log('\n📝 Setting up logging...');

    // Create logrotate configuration
    const logrotateConfig = `
${path.join(this.rootDir, 'logs', '*.log')} {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        kill -USR1 \`cat ${path.join(this.rootDir, 'logs', 'app.pid')} 2>/dev/null\` 2>/dev/null || true
    endscript
}
`;

    const logrotatePath = path.join(this.rootDir, 'logrotate.conf');
    fs.writeFileSync(logrotatePath, logrotateConfig);

    // Create logging configuration
    const loggingConfig = {
      level: 'warn',
      format: 'json',
      transports: {
        file: {
          enabled: true,
          filename: path.join(this.logsDir, 'app.log'),
          maxSize: '50m',
          maxFiles: 10
        },
        console: {
          enabled: false
        }
      }
    };

    const loggingPath = path.join(this.configDir, 'logging.json');
    fs.writeFileSync(loggingPath, JSON.stringify(loggingConfig, null, 2));

    console.log('  ✅ Created logging configuration');
    console.log('  ✅ Created logrotate configuration');
  }

  /**
   * Setup monitoring
   */
  async setupMonitoring() {
    console.log('\n📊 Setting up monitoring...');

    // Create monitoring configuration
    const monitoringConfig = {
      enabled: true,
      healthCheck: {
        enabled: true,
        interval: 30000,
        timeout: 5000
      },
      metrics: {
        enabled: true,
        collectInterval: 60000
      },
      alerts: {
        enabled: true,
        email: process.env.ALERT_EMAIL || 'alerts@your-domain.com',
        webhook: process.env.ALERT_WEBHOOK || ''
      }
    };

    const monitoringPath = path.join(this.configDir, 'monitoring.json');
    fs.writeFileSync(monitoringPath, JSON.stringify(monitoringConfig, null, 2));

    // Create health check script
    const healthCheckScript = `#!/bin/bash
# Health check script for VocalInk server

HEALTH_URL="http://localhost:${process.env.PORT || 3000}/health"
MAX_RETRIES=3
RETRY_DELAY=5

for i in \$(seq 1 \$MAX_RETRIES); do
    if curl -f -s "\$HEALTH_URL" > /dev/null; then
        echo "✅ Server is healthy"
        exit 0
    else
        echo "❌ Health check failed (attempt \$i/\$MAX_RETRIES)"
        if [ \$i -lt \$MAX_RETRIES ]; then
            sleep \$RETRY_DELAY
        fi
    fi
done

echo "❌ Server is unhealthy after \$MAX_RETRIES attempts"
exit 1
`;

    const healthCheckPath = path.join(this.rootDir, 'health-check.sh');
    fs.writeFileSync(healthCheckPath, healthCheckScript);
    fs.chmodSync(healthCheckPath, '755');

    console.log('  ✅ Created monitoring configuration');
    console.log('  ✅ Created health check script');
  }

  /**
   * Setup security
   */
  async setupSecurity() {
    console.log('\n🔒 Setting up security...');

    // Create security configuration
    const securityConfig = {
      rateLimiting: {
        general: { windowMs: 900000, max: 50 },
        auth: { windowMs: 900000, max: 3 },
        api: { windowMs: 900000, max: 100 },
        ai: { windowMs: 3600000, max: 50 }
      },
      headers: {
        enableCSP: true,
        enableHSTS: true,
        enableXSSProtection: true,
        enableFrameDeny: true
      },
      validation: {
        maxFileSize: 5242880,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
        enableFileScanning: true
      }
    };

    const securityPath = path.join(this.configDir, 'security.json');
    fs.writeFileSync(securityPath, JSON.stringify(securityConfig, null, 2));

    // Create firewall rules (example for UFW)
    const firewallRules = `# UFW Firewall Rules for VocalInk
# Allow SSH
ufw allow ssh

# Allow HTTP (for redirect to HTTPS)
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Allow application port
ufw allow ${process.env.PORT || 3000}/tcp

# Enable firewall
ufw --force enable

# Show status
ufw status
`;

    const firewallPath = path.join(this.rootDir, 'firewall-rules.sh');
    fs.writeFileSync(firewallPath, firewallRules);
    fs.chmodSync(firewallPath, '755');

    console.log('  ✅ Created security configuration');
    console.log('  ✅ Created firewall rules script');
  }

  /**
   * Setup database indexes
   */
  async setupDatabaseIndexes() {
    console.log('\n🗄️  Setting up database indexes...');

    // Create index creation script
    const indexScript = `
// Database Index Creation Script for Production
// Run this script after deploying to production

const mongoose = require('mongoose');
const logger = require('./src/utils/logger');

async function createIndexes() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      autoIndex: false
    });

    console.log('Connected to database');

    // Import models to ensure indexes are created
    require('./src/models/user.model');
    require('./src/models/blog.model');
    require('./src/models/series.model');
    require('./src/models/comment.model');
    require('./src/models/badge.model');
    require('./src/models/seriesProgress.model');
    require('./src/models/xpTransaction.model');
    require('./src/models/abusereport.model');
    require('./src/models/notification.model');

    // Wait for index creation
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('Indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create indexes:', error);
    process.exit(1);
  }
}

createIndexes();
`;

    const indexPath = path.join(this.rootDir, 'scripts', 'create-indexes.js');
    fs.writeFileSync(indexPath, indexScript);

    console.log('  ✅ Created database index creation script');
  }

  /**
   * Setup AI services
   */
  async setupAIServices() {
    console.log('\n🤖 Setting up AI services...');

    // Create AI configuration
    const aiConfig = {
      machineLearning: {
        enabled: true,
        modelPath: path.join(this.rootDir, 'models'),
        tensorflowBackend: 'tensorflow',
        maxConcurrentModels: 2,
        modelCacheSize: 50,
        trainingEnabled: false
      },
      services: {
        sentiment: { enabled: true, confidenceThreshold: 0.8 },
        topicClassification: { enabled: true, confidenceThreshold: 0.7 },
        contentQuality: { enabled: true, confidenceThreshold: 0.8 }
      }
    };

    const aiPath = path.join(this.configDir, 'ai.json');
    fs.writeFileSync(aiPath, JSON.stringify(aiConfig, null, 2));

    // Create AI model directory
    const aiModelsDir = path.join(this.rootDir, 'models');
    if (!fs.existsSync(aiModelsDir)) {
      fs.mkdirSync(aiModelsDir, { recursive: true });
    }

    console.log('  ✅ Created AI configuration');
    console.log('  ✅ Created AI models directory');
  }

  /**
   * Setup backup
   */
  async setupBackup() {
    console.log('\n💾 Setting up backup...');

    // Create backup script
    const backupScript = `#!/bin/bash
# Backup script for VocalInk

BACKUP_DIR="${this.backupsDir}"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="vocalink_backup_\$DATE"

echo "Starting backup: \$BACKUP_NAME"

# Create backup directory
mkdir -p "\$BACKUP_DIR/\$BACKUP_NAME"

# Backup database
if [ -n "\$MONGO_URI" ]; then
    echo "Backing up database..."
    mongodump --uri="\$MONGO_URI" --out="\$BACKUP_DIR/\$BACKUP_NAME/db"
fi

# Backup uploads
if [ -d "uploads" ]; then
    echo "Backing up uploads..."
    tar -czf "\$BACKUP_DIR/\$BACKUP_NAME/uploads.tar.gz" uploads/
fi

# Backup logs
if [ -d "logs" ]; then
    echo "Backing up logs..."
    tar -czf "\$BACKUP_DIR/\$BACKUP_NAME/logs.tar.gz" logs/
fi

# Create backup manifest
cat > "\$BACKUP_DIR/\$BACKUP_NAME/manifest.txt" << EOF
Backup created: \$(date)
Version: \$(node -p "require('./package.json').version")
Database: \$(if [ -d "\$BACKUP_DIR/\$BACKUP_NAME/db" ]; then echo "Included"; else echo "Not included"; fi)
Uploads: \$(if [ -f "\$BACKUP_DIR/\$BACKUP_NAME/uploads.tar.gz" ]; then echo "Included"; else echo "Not included"; fi)
Logs: \$(if [ -f "\$BACKUP_DIR/\$BACKUP_NAME/logs.tar.gz" ]; then echo "Included"; else echo "Not included"; fi)
EOF

# Compress backup
cd "\$BACKUP_DIR"
tar -czf "\$BACKUP_NAME.tar.gz" "\$BACKUP_NAME"
rm -rf "\$BACKUP_NAME"

echo "Backup completed: \$BACKUP_DIR/\$BACKUP_NAME.tar.gz"

# Clean old backups (keep last 30 days)
find "\$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Old backups cleaned up"
`;

    const backupPath = path.join(this.rootDir, 'scripts', 'backup.sh');
    fs.writeFileSync(backupPath, backupScript);
    fs.chmodSync(backupPath, '755');

    // Create cron job for automatic backup
    const cronJob = `# VocalInk Backup - Daily at 2 AM
0 2 * * * cd ${this.rootDir} && ./scripts/backup.sh >> logs/backup.log 2>&1

# VocalInk Health Check - Every 5 minutes
*/5 * * * * cd ${this.rootDir} && ./health-check.sh >> logs/health.log 2>&1
`;

    const cronPath = path.join(this.rootDir, 'crontab.txt');
    fs.writeFileSync(cronPath, cronJob);

    console.log('  ✅ Created backup script');
    console.log('  ✅ Created cron job configuration');
  }

  /**
   * Create production startup script
   */
  async createProductionStartup() {
    console.log('\n🚀 Creating production startup script...');

    // Create systemd service file
    const systemdService = `[Unit]
Description=VocalInk Production Server
After=network.target mongod.service redis.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=${this.rootDir}
ExecStart=/usr/bin/node start-production.js
ExecReload=/bin/kill -USR2 \$MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vocalink
Environment=NODE_ENV=production
Environment=PORT=${process.env.PORT || 3000}

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=${this.rootDir}/logs ${this.rootDir}/uploads ${this.rootDir}/backups

[Install]
WantedBy=multi-user.target
`;

    const systemdPath = path.join(this.rootDir, 'vocalink.service');
    fs.writeFileSync(systemdPath, systemdService);

    // Create PM2 ecosystem file
    const pm2Ecosystem = `module.exports = {
  apps: [{
    name: 'vocalink',
    script: 'start-production.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: ${process.env.PORT || 3000}
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: ${process.env.PORT || 3000}
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=2048',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads', 'backups'],
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
`;

    const pm2Path = path.join(this.rootDir, 'ecosystem.config.js');
    fs.writeFileSync(pm2Path, pm2Ecosystem);

    console.log('  ✅ Created systemd service file');
    console.log('  ✅ Created PM2 ecosystem file');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new ProductionSetup();
  setup.run();
}

module.exports = ProductionSetup; 