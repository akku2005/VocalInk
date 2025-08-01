# Redis Setup (Optional)

## Overview

Redis is used as an optional caching layer in the VocalInk application. The application will work perfectly without Redis, using in-memory caching as a fallback.

## Installation

### Option 1: Install Redis (Recommended for Production)

```bash
# Install Redis as an optional dependency
npm install redis

# Or install it manually
npm install redis@^4.6.13
```

### Option 2: Skip Redis (Development/Testing)

If you don't want to use Redis, simply don't install it. The application will automatically fall back to in-memory caching.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Default Configuration

If no Redis configuration is provided, the application will:
- Use in-memory caching
- Log a warning that Redis is not available
- Continue functioning normally

## Features Using Redis

### BadgeService Caching

The `BadgeService` uses Redis for caching:
- **Eligible badges**: Cached for 5 minutes
- **Badge analytics**: Cached for 10 minutes
- **User progress**: Cached for 15 minutes

### Fallback Behavior

When Redis is not available:
- In-memory cache is used instead
- Cache entries expire automatically
- No performance impact on core functionality

## Redis Installation Guide

### Windows

1. **Using WSL (Recommended)**:
   ```bash
   # Install WSL if not already installed
   wsl --install

   # Install Redis in WSL
   sudo apt update
   sudo apt install redis-server

   # Start Redis
   sudo service redis-server start
   ```

2. **Using Docker**:
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

3. **Using Windows Subsystem for Linux**:
   ```bash
   # Install Redis
   sudo apt update
   sudo apt install redis-server

   # Start Redis
   sudo service redis-server start
   ```

### macOS

```bash
# Using Homebrew
brew install redis

# Start Redis
brew services start redis
```

### Linux (Ubuntu/Debian)

```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# Enable on boot
sudo systemctl enable redis-server
```

### Docker

```bash
# Run Redis container
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine

# Or with persistent storage
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:alpine
```

## Testing Redis Connection

### Manual Test

```bash
# Connect to Redis CLI
redis-cli

# Test connection
127.0.0.1:6379> ping
PONG

# Test set/get
127.0.0.1:6379> set test "Hello Redis"
OK
127.0.0.1:6379> get test
"Hello Redis"
```

### Application Test

The application will log Redis connection status:

```
✅ Redis connected for BadgeService
```

Or if Redis is not available:

```
⚠️ Redis not available for BadgeService, using in-memory cache
```

## Performance Benefits

### With Redis
- **Distributed caching**: Multiple server instances share cache
- **Persistence**: Cache survives server restarts
- **Memory efficiency**: Cache doesn't consume application memory
- **Scalability**: Can handle high-traffic scenarios

### Without Redis (In-Memory)
- **Simple setup**: No additional infrastructure needed
- **Fast access**: Direct memory access
- **Development friendly**: Easy for local development
- **Stateless**: Cache cleared on server restart

## Production Considerations

### When to Use Redis

- **High traffic applications**: Multiple concurrent users
- **Multiple server instances**: Load balancing scenarios
- **Long-running applications**: Need persistent cache
- **Memory constraints**: Limited application memory

### When to Skip Redis

- **Development environments**: Local development
- **Low traffic applications**: Simple use cases
- **Single server deployments**: No load balancing
- **Testing environments**: CI/CD pipelines

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```
   Error: Redis connection failed
   ```
   **Solution**: Check if Redis is running and accessible

2. **Module Not Found**
   ```
   Error: Cannot find module 'redis'
   ```
   **Solution**: Install Redis or ignore (fallback will work)

3. **Permission Denied**
   ```
   Error: Redis permission denied
   ```
   **Solution**: Check Redis configuration and permissions

### Debug Commands

```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
tail -f /var/log/redis/redis-server.log

# Monitor Redis commands
redis-cli monitor

# Check Redis memory usage
redis-cli info memory
```

## Migration

### From In-Memory to Redis

1. Install Redis
2. Configure environment variables
3. Restart application
4. Cache will automatically migrate

### From Redis to In-Memory

1. Remove Redis dependency
2. Restart application
3. Cache will automatically fall back

## Monitoring

### Redis Metrics

Monitor these Redis metrics in production:
- **Memory usage**: `redis-cli info memory`
- **Connection count**: `redis-cli info clients`
- **Command statistics**: `redis-cli info stats`
- **Key count**: `redis-cli dbsize`

### Application Metrics

The application logs cache performance:
- Cache hit/miss ratios
- Redis connection status
- Fallback usage statistics

## Security

### Redis Security Best Practices

1. **Authentication**: Set Redis password
2. **Network security**: Bind to localhost only
3. **Firewall**: Restrict Redis port access
4. **Updates**: Keep Redis updated
5. **Monitoring**: Monitor for suspicious activity

### Configuration Example

```env
# Secure Redis configuration
REDIS_URL=redis://:password@localhost:6379
REDIS_PASSWORD=your_secure_password
```

## Conclusion

Redis is completely optional for the VocalInk application. The application will work perfectly with or without Redis, automatically adapting to the available infrastructure. For development and testing, you can skip Redis entirely. For production deployments with high traffic, Redis provides significant performance benefits. 