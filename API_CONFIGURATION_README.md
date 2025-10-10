# API Configuration Guide

This guide explains how to use the centralized API configuration for easy deployment and maintenance.

## Frontend Configuration

### File: `client/src/constants/apiConfig.js`

The frontend API configuration centralizes all API endpoints and makes them easily configurable for different environments.

### Environment Variables

Set the following environment variables in your deployment:

```env
# API Base URL
VITE_API_URL=http://localhost:3000/api
# or for production
VITE_API_URL=https://your-api-domain.com/api
```

### Using the Configuration

Instead of hardcoding URLs, use the centralized configuration:

```javascript
import { apiHelpers } from '../services/api';

// Old way (hardcoded)
const response = await api.post('/auth/login', data);

// New way (configurable)
const response = await apiHelpers.post('AUTH.LOGIN', data);

// Get full URL
const loginUrl = apiHelpers.getUrl('AUTH.LOGIN');
```

### Available Endpoints

All endpoints are organized by category:

- `AUTH.*` - Authentication endpoints
- `USERS.*` - User management
- `BLOGS.*` - Blog operations
- `COMMENTS.*` - Comment management
- `AI.*` - AI services
- etc.

## Backend Configuration

### File: `server/src/config/routes.js`

The backend route configuration centralizes all route definitions and prefixes.

### Route Organization

Routes are organized with clear prefixes:

```javascript
const { API_ROUTES } = require('../config/routes');

// Use in route definitions
router.use(API_ROUTES.AUTH, authRoutes);
router.use(API_ROUTES.USERS, userRoutes);
```

### Available Route Categories

- `API_ROUTES.AUTH` - `/auth`
- `API_ROUTES.USERS` - `/users`
- `API_ROUTES.BLOGS` - `/blogs`
- etc.

## Deployment Configuration

### Development

```env
# Frontend (.env)
VITE_API_URL=http://localhost:3000/api

# Backend (.env)
NODE_ENV=development
PORT=3000
```

### Production

```env
# Frontend (.env.production)
VITE_API_URL=https://your-api-domain.com/api

# Backend (.env)
NODE_ENV=production
PORT=3000
API_BASE_URL=https://your-api-domain.com
```

### Staging

```env
# Frontend (.env.staging)
VITE_API_URL=https://staging-api.your-domain.com/api

# Backend (.env.staging)
NODE_ENV=staging
PORT=3000
API_BASE_URL=https://staging-api.your-domain.com
```

## Benefits

1. **Easy Deployment**: Change API URLs by updating environment variables
2. **Centralized Management**: All endpoints defined in one place
3. **Type Safety**: Consistent endpoint naming
4. **Environment Flexibility**: Different configs for dev/staging/prod
5. **Maintenance**: Easy to add/modify endpoints

## Migration Guide

### Updating Existing Code

Replace hardcoded API calls:

```javascript
// Before
await api.get('/users/profile')
await api.post('/auth/login', data)

// After
await apiHelpers.get('USERS.PROFILE')
await apiHelpers.post('AUTH.LOGIN', data)
```

### Adding New Endpoints

1. Add to `apiConfig.js` ENDPOINTS section
2. Use in services with `apiHelpers.get('CATEGORY.ENDPOINT')`

### Route Changes

1. Add to `routes.js` ROUTES section
2. Update route registration in `routes/index.js`

## Troubleshooting

### Common Issues

1. **404 Errors**: Check if API_BASE_URL is set correctly
2. **CORS Issues**: Ensure frontend VITE_API_URL matches backend CORS settings
3. **Environment Variables**: Verify variables are loaded in deployment

### Debugging

Enable API logging in development:

```javascript
// Logs are automatically enabled in development mode
// Check browser console for API request/response details
```