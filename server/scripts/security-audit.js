#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Security audit configuration
const auditConfig = {
  criticalIssues: [],
  warnings: [],
  recommendations: [],
  passedChecks: [],
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// Helper functions
const log = {
  info: (message) => console.log(`${colors.blue}ℹ${colors.reset} ${message}`),
  success: (message) => console.log(`${colors.green}✓${colors.reset} ${message}`),
  warning: (message) => console.log(`${colors.yellow}⚠${colors.reset} ${message}`),
  error: (message) => console.log(`${colors.red}✗${colors.reset} ${message}`),
  critical: (message) => console.log(`${colors.red}${colors.bold}🚨${colors.reset} ${message}`),
  section: (title) => console.log(`\n${colors.cyan}${colors.bold}${title}${colors.reset}`),
};

// Check environment variables
const checkEnvironmentVariables = () => {
  log.section('Environment Variables Security Check');
  
  const envFile = path.join(__dirname, '..', '.env');
  const exampleEnvFile = path.join(__dirname, '..', 'example.env');
  
  // Check if .env file exists
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    // Check for default secrets
    const defaultSecrets = [
      'your-super-secret-jwt-key-change-this-in-production',
      'your-super-secret-refresh-key-change-this-in-production',
      'your-session-secret-change-this-in-production',
      'your-cookie-secret-change-this-in-production',
      'your-256-bit-cryptographically-secure-secret-here-change-this',
      'your-256-bit-cryptographically-secure-refresh-secret-here-change-this',
    ];
    
    defaultSecrets.forEach(secret => {
      if (envContent.includes(secret)) {
        auditConfig.criticalIssues.push(`Default secret found in .env: ${secret}`);
        log.critical(`Default secret found: ${secret}`);
      }
    });
    
    // Check for weak secrets
    const weakSecrets = [
      'password',
      '123456',
      'admin',
      'secret',
      'key',
      'token',
    ];
    
    weakSecrets.forEach(weak => {
      if (envContent.includes(weak)) {
        auditConfig.warnings.push(`Potentially weak secret found: ${weak}`);
        log.warning(`Potentially weak secret: ${weak}`);
      }
    });
    
    // Check for missing required variables
    const requiredVars = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SESSION_SECRET',
      'MONGO_URI',
    ];
    
    requiredVars.forEach(varName => {
      if (!envContent.includes(varName)) {
        auditConfig.warnings.push(`Missing required environment variable: ${varName}`);
        log.warning(`Missing required variable: ${varName}`);
      }
    });
    
    log.success('Environment variables check completed');
  } else {
    auditConfig.warnings.push('.env file not found');
    log.warning('.env file not found');
  }
};

// Check package.json for security issues
const checkPackageSecurity = () => {
  log.section('Package Security Check');
  
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check for known vulnerable packages
    const vulnerablePackages = [
      'lodash',
      'moment',
      'jquery',
      'express',
      'mongoose',
    ];
    
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    
    Object.keys(dependencies).forEach(pkg => {
      if (vulnerablePackages.includes(pkg)) {
        auditConfig.warnings.push(`Potentially vulnerable package: ${pkg}`);
        log.warning(`Potentially vulnerable package: ${pkg}`);
      }
    });
    
    // Check for outdated packages
    try {
      const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(outdatedOutput);
      
      Object.keys(outdated).forEach(pkg => {
        auditConfig.warnings.push(`Outdated package: ${pkg}`);
        log.warning(`Outdated package: ${pkg}`);
      });
    } catch (error) {
      // No outdated packages or npm outdated not available
    }
    
    log.success('Package security check completed');
  } catch (error) {
    auditConfig.criticalIssues.push('Failed to read package.json');
    log.error('Failed to read package.json');
  }
};

// Check for security vulnerabilities in dependencies
const checkNpmAudit = () => {
  log.section('NPM Security Audit');
  
  try {
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditOutput);
    
    if (audit.metadata.vulnerabilities) {
      const { critical, high, moderate, low } = audit.metadata.vulnerabilities;
      
      if (critical > 0) {
        auditConfig.criticalIssues.push(`${critical} critical vulnerabilities found`);
        log.critical(`${critical} critical vulnerabilities found`);
      }
      
      if (high > 0) {
        auditConfig.criticalIssues.push(`${high} high vulnerabilities found`);
        log.critical(`${high} high vulnerabilities found`);
      }
      
      if (moderate > 0) {
        auditConfig.warnings.push(`${moderate} moderate vulnerabilities found`);
        log.warning(`${moderate} moderate vulnerabilities found`);
      }
      
      if (low > 0) {
        auditConfig.warnings.push(`${low} low vulnerabilities found`);
        log.warning(`${low} low vulnerabilities found`);
      }
    } else {
      log.success('No vulnerabilities found');
      auditConfig.passedChecks.push('NPM audit passed');
    }
  } catch (error) {
    auditConfig.warnings.push('NPM audit failed or not available');
    log.warning('NPM audit failed or not available');
  }
};

// Check file permissions
const checkFilePermissions = () => {
  log.section('File Permissions Check');
  
  const criticalFiles = [
    '.env',
    'package.json',
    'package-lock.json',
    'server.js',
  ];
  
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const mode = stats.mode.toString(8);
      
      // Check if file is world-readable (should not be)
      if (mode.endsWith('666') || mode.endsWith('777')) {
        auditConfig.criticalIssues.push(`File ${file} has overly permissive permissions: ${mode}`);
        log.critical(`File ${file} has overly permissive permissions: ${mode}`);
      } else {
        auditConfig.passedChecks.push(`File ${file} has appropriate permissions: ${mode}`);
      }
    }
  });
  
  log.success('File permissions check completed');
};

// Check for hardcoded secrets in code
const checkHardcodedSecrets = () => {
  log.section('Hardcoded Secrets Check');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const secrets = [
    'password',
    'secret',
    'key',
    'token',
    'api_key',
    'private_key',
    'access_key',
  ];
  
  const scanDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          secrets.forEach(secret => {
            const regex = new RegExp(`["']([^"']*${secret}[^"']*)["']`, 'gi');
            const matches = content.match(regex);
            
            if (matches) {
              matches.forEach(match => {
                // Skip obvious false positives
                if (!match.includes('process.env') && 
                    !match.includes('require') && 
                    !match.includes('import') &&
                    match.length > 10) {
                  auditConfig.warnings.push(`Potential hardcoded secret in ${filePath}: ${match}`);
                  log.warning(`Potential hardcoded secret in ${filePath}: ${match}`);
                }
              });
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
  };
  
  if (fs.existsSync(srcDir)) {
    scanDirectory(srcDir);
  }
  
  log.success('Hardcoded secrets check completed');
};

// Check SSL/TLS configuration
const checkSSLConfiguration = () => {
  log.section('SSL/TLS Configuration Check');
  
  const envFile = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    if (process.env.NODE_ENV === 'production') {
      if (!envContent.includes('ENABLE_HTTPS=true')) {
        auditConfig.criticalIssues.push('HTTPS not enabled in production');
        log.critical('HTTPS not enabled in production');
      }
      
      if (!envContent.includes('FORCE_HTTPS=true')) {
        auditConfig.warnings.push('HTTPS redirect not forced in production');
        log.warning('HTTPS redirect not forced in production');
      }
    }
  }
  
  log.success('SSL/TLS configuration check completed');
};

// Check database security
const checkDatabaseSecurity = () => {
  log.section('Database Security Check');
  
  const envFile = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    // Check for default MongoDB URI
    if (envContent.includes('mongodb://localhost:27017') && process.env.NODE_ENV === 'production') {
      auditConfig.criticalIssues.push('Using default MongoDB URI in production');
      log.critical('Using default MongoDB URI in production');
    }
    
    // Check for MongoDB without authentication
    if (envContent.includes('mongodb://') && !envContent.includes('mongodb://localhost') && !envContent.includes('@')) {
      auditConfig.warnings.push('MongoDB connection without authentication');
      log.warning('MongoDB connection without authentication');
    }
  }
  
  log.success('Database security check completed');
};

// Check logging configuration
const checkLoggingConfiguration = () => {
  log.section('Logging Configuration Check');
  
  const envFile = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    if (process.env.NODE_ENV === 'production') {
      if (envContent.includes('LOG_LEVEL=debug')) {
        auditConfig.warnings.push('Debug logging enabled in production');
        log.warning('Debug logging enabled in production');
      }
      
      if (!envContent.includes('ENABLE_STRUCTURED_LOGGING=true')) {
        auditConfig.recommendations.push('Consider enabling structured logging in production');
      }
    }
  }
  
  log.success('Logging configuration check completed');
};

// Generate security recommendations
const generateRecommendations = () => {
  log.section('Security Recommendations');
  
  const recommendations = [
    'Enable 2FA for all user accounts',
    'Implement rate limiting for all endpoints',
    'Use HTTPS in production',
    'Enable HSTS headers',
    'Implement proper session management',
    'Use secure cookies in production',
    'Enable file upload scanning',
    'Implement fraud detection',
    'Use environment variables for all secrets',
    'Regularly update dependencies',
    'Implement proper error handling',
    'Enable request logging',
    'Use prepared statements for database queries',
    'Implement proper input validation',
    'Enable CORS properly',
    'Use security headers',
    'Implement proper authentication',
    'Use JWT with short expiration times',
    'Implement proper authorization',
    'Enable audit logging',
  ];
  
  recommendations.forEach(rec => {
    auditConfig.recommendations.push(rec);
    log.info(rec);
  });
};

// Generate security report
const generateReport = () => {
  log.section('Security Audit Report');
  
  console.log(`\n${colors.bold}Summary:${colors.reset}`);
  console.log(`Critical Issues: ${auditConfig.criticalIssues.length}`);
  console.log(`Warnings: ${auditConfig.warnings.length}`);
  console.log(`Passed Checks: ${auditConfig.passedChecks.length}`);
  console.log(`Recommendations: ${auditConfig.recommendations.length}`);
  
  if (auditConfig.criticalIssues.length > 0) {
    console.log(`\n${colors.red}${colors.bold}Critical Issues:${colors.reset}`);
    auditConfig.criticalIssues.forEach(issue => {
      console.log(`  • ${issue}`);
    });
  }
  
  if (auditConfig.warnings.length > 0) {
    console.log(`\n${colors.yellow}${colors.bold}Warnings:${colors.reset}`);
    auditConfig.warnings.forEach(warning => {
      console.log(`  • ${warning}`);
    });
  }
  
  if (auditConfig.passedChecks.length > 0) {
    console.log(`\n${colors.green}${colors.bold}Passed Checks:${colors.reset}`);
    auditConfig.passedChecks.forEach(check => {
      console.log(`  • ${check}`);
    });
  }
  
  if (auditConfig.recommendations.length > 0) {
    console.log(`\n${colors.blue}${colors.bold}Recommendations:${colors.reset}`);
    auditConfig.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }
  
  // Overall security score
  const totalChecks = auditConfig.criticalIssues.length + auditConfig.warnings.length + auditConfig.passedChecks.length;
  const score = totalChecks > 0 ? Math.round((auditConfig.passedChecks.length / totalChecks) * 100) : 100;
  
  console.log(`\n${colors.bold}Security Score: ${score}%${colors.reset}`);
  
  if (score >= 90) {
    console.log(`${colors.green}Excellent security posture!${colors.reset}`);
  } else if (score >= 70) {
    console.log(`${colors.yellow}Good security posture, but improvements needed.${colors.reset}`);
  } else {
    console.log(`${colors.red}Security improvements urgently needed!${colors.reset}`);
  }
  
  // Exit with appropriate code
  if (auditConfig.criticalIssues.length > 0) {
    process.exit(1);
  } else if (auditConfig.warnings.length > 0) {
    process.exit(2);
  } else {
    process.exit(0);
  }
};

// Main audit function
const runSecurityAudit = () => {
  console.log(`${colors.bold}${colors.cyan}🔒 VocalInk Security Audit${colors.reset}\n`);
  
  checkEnvironmentVariables();
  checkPackageSecurity();
  checkNpmAudit();
  checkFilePermissions();
  checkHardcodedSecrets();
  checkSSLConfiguration();
  checkDatabaseSecurity();
  checkLoggingConfiguration();
  generateRecommendations();
  generateReport();
};

// Run the audit
if (require.main === module) {
  runSecurityAudit();
}

module.exports = {
  runSecurityAudit,
  auditConfig,
}; 