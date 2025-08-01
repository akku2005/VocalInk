# VocalInk Badge API Documentation

## Overview

The VocalInk Badge API provides a comprehensive system for managing badges, tracking user achievements, and facilitating badge claims. This system supports advanced features including fraud prevention, real-time evaluation, analytics, and security measures.

## Base URL

```
https://api.vocalink.com/api/badges
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **Badge Claims**: 10 claims per day per user
- **Badge Searches**: 100 searches per 15 minutes per user
- **Badge Listing**: 200 requests per 5 minutes per user
- **Admin endpoints**: No rate limiting for admin users

## Public Endpoints

### Get All Badges

Retrieve all badges with advanced filtering and pagination.

**Endpoint:** `GET /api/badges`

**Query Parameters:**
- `category` (string): Filter by category
- `rarity` (string): Filter by rarity
- `status` (string): Filter by status (default: 'active')
- `search` (string): Search in name, description, and tags
- `tags` (array): Filter by tags
- `limit` (number): Number of badges per page (default: 50, max: 100)
- `page` (number): Page number (default: 1)
- `sortBy` (string): Sort field (default: 'createdAt')
- `sortOrder` (string): Sort order - 'asc' or 'desc' (default: 'desc')

**Example Request:**
```bash
curl -X GET "https://api.vocalink.com/api/badges?category=engagement&rarity=rare&limit=20&page=1"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "badgeKey": "first_blog_post",
        "name": "First Blog Post",
        "description": "Published your first blog post",
        "icon": "https://example.com/icons/first-blog.png",
        "rarity": "common",
        "category": "content",
        "analytics": {
          "totalEarned": 1250,
          "popularityScore": 0.85
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalBadges": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Search Badges

Search badges by name, description, or tags.

**Endpoint:** `GET /api/badges/search`

**Query Parameters:**
- `query` (string, required): Search query
- `category` (string): Filter by category
- `rarity` (string): Filter by rarity
- `limit` (number): Number of results (default: 20, max: 100)

**Example Request:**
```bash
curl -X GET "https://api.vocalink.com/api/badges/search?query=blog&category=content&limit=10"
```

### Get Popular Badges

Get the most popular badges based on analytics.

**Endpoint:** `GET /api/badges/popular`

**Query Parameters:**
- `limit` (number): Number of badges (default: 10, max: 50)

### Get Rare Badges

Get rare, epic, legendary, and mythic badges.

**Endpoint:** `GET /api/badges/rare`

**Query Parameters:**
- `limit` (number): Number of badges (default: 10, max: 50)

### Get Badge Statistics

Get overall badge statistics.

**Endpoint:** `GET /api/badges/stats`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalBadges": 150,
    "byCategory": [
      { "_id": "engagement", "count": 45 },
      { "_id": "content", "count": 35 },
      { "_id": "social", "count": 30 }
    ],
    "byRarity": [
      { "_id": "common", "count": 60 },
      { "_id": "uncommon", "count": 40 },
      { "_id": "rare", "count": 30 },
      { "_id": "epic", "count": 15 },
      { "_id": "legendary", "count": 4 },
      { "_id": "mythic", "count": 1 }
    ]
  }
}
```

### Get Badge by Category

Get badges filtered by category.

**Endpoint:** `GET /api/badges/category/:category`

**Path Parameters:**
- `category` (string): Badge category

**Query Parameters:**
- `limit` (number): Number of badges (default: 20, max: 100)

### Get Badge by ID

Get detailed information about a specific badge.

**Endpoint:** `GET /api/badges/:id`

**Path Parameters:**
- `id` (string): Badge ID

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "badgeKey": "first_blog_post",
    "name": "First Blog Post",
    "description": "Published your first blog post",
    "longDescription": "A milestone achievement for new bloggers...",
    "icon": "https://example.com/icons/first-blog.png",
    "iconDark": "https://example.com/icons/first-blog-dark.png",
    "color": "#3B82F6",
    "backgroundColor": "#EFF6FF",
    "rarity": "common",
    "category": "content",
    "subcategories": ["writing", "milestone"],
    "tags": ["blog", "first", "content"],
    "requirements": {
      "blogsRequired": 1,
      "xpRequired": 0
    },
    "rewards": {
      "xpReward": 50,
      "featureUnlocks": ["custom_avatar"],
      "specialPrivileges": ["early_access"]
    },
    "analytics": {
      "totalEarned": 1250,
      "totalAttempts": 1500,
      "successRate": 0.83,
      "popularityScore": 0.85
    },
    "earnedUsers": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "https://example.com/avatars/john.png"
      }
    ],
    "earnedCount": 1250,
    "userHasEarned": false,
    "userEligible": true,
    "userProgress": {
      "completed": false,
      "progress": 75,
      "requirements": [
        {
          "name": "Blogs Required",
          "current": 0,
          "required": 1,
          "completed": false,
          "progress": 0
        }
      ]
    }
  }
}
```

## User Endpoints (Authentication Required)

### Get User Badges

Get badges earned by a user.

**Endpoint:** `GET /api/badges/user/badges`

**Query Parameters:**
- `earned` (boolean): Show only earned badges
- `available` (boolean): Show only available badges
- `limit` (number): Number of badges per page (default: 50)
- `page` (number): Page number (default: 1)

**Example Response:**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "First Blog Post",
        "description": "Published your first blog post",
        "icon": "https://example.com/icons/first-blog.png",
        "rarity": "common",
        "category": "content"
      }
    ],
    "totalEarned": 5,
    "totalAvailable": 150
  }
}
```

### Get User Eligible Badges

Get badges that the user is eligible to claim.

**Endpoint:** `GET /api/badges/user/eligible`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "eligibleBadges": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "First Blog Post",
        "description": "Published your first blog post",
        "icon": "https://example.com/icons/first-blog.png",
        "rarity": "common",
        "category": "content"
      }
    ],
    "count": 1
  }
}
```

### Claim Badge

Claim a badge that the user is eligible for.

**Endpoint:** `POST /api/badges/:badgeId/claim`

**Path Parameters:**
- `badgeId` (string): Badge ID to claim

**Headers:**
- `X-Device-Fingerprint` (optional): Device fingerprint for security
- `X-User-Location` (optional): User location JSON for geographic restrictions

**Example Request:**
```bash
curl -X POST "https://api.vocalink.com/api/badges/507f1f77bcf86cd799439011/claim" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "X-Device-Fingerprint: abc123" \
  -H "X-User-Location: {\"country\":\"US\",\"region\":\"CA\"}"
```

**Example Response (Auto-approved):**
```json
{
  "success": true,
  "claim": {
    "_id": "507f1f77bcf86cd799439013",
    "claimId": "claim_abc123",
    "badgeId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "status": "approved",
    "claimedAt": "2024-01-15T10:30:00Z",
    "processedAt": "2024-01-15T10:30:01Z",
    "rewards": {
      "xpAwarded": 50,
      "featuresUnlocks": ["custom_avatar"],
      "privilegesGranted": ["early_access"]
    }
  },
  "message": "Congratulations! You earned the \"First Blog Post\" badge!",
  "badge": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "First Blog Post",
    "description": "Published your first blog post",
    "icon": "https://example.com/icons/first-blog.png"
  },
  "xpGained": 50
}
```

**Example Response (Under Review):**
```json
{
  "success": true,
  "claim": {
    "_id": "507f1f77bcf86cd799439013",
    "claimId": "claim_abc123",
    "badgeId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "status": "under_review",
    "claimedAt": "2024-01-15T10:30:00Z",
    "fraudCheck": {
      "score": 0.7,
      "riskLevel": "high",
      "manualReviewRequired": true
    }
  },
  "message": "Badge claim initiated successfully"
}
```

### Get User Claim History

Get the user's badge claim history.

**Endpoint:** `GET /api/badges/user/claims`

**Query Parameters:**
- `status` (string): Filter by claim status
- `limit` (number): Number of claims per page (default: 50)
- `page` (number): Page number (default: 1)

## Admin Endpoints (Admin Authentication Required)

### Create Badge

Create a new badge.

**Endpoint:** `POST /api/badges`

**Request Body:**
```json
{
  "badgeKey": "first_blog_post",
  "name": "First Blog Post",
  "description": "Published your first blog post",
  "longDescription": "A milestone achievement for new bloggers...",
  "icon": "https://example.com/icons/first-blog.png",
  "iconDark": "https://example.com/icons/first-blog-dark.png",
  "color": "#3B82F6",
  "backgroundColor": "#EFF6FF",
  "rarity": "common",
  "category": "content",
  "subcategories": ["writing", "milestone"],
  "tags": ["blog", "first", "content"],
  "requirements": {
    "blogsRequired": 1,
    "xpRequired": 0,
    "logicalExpression": "BLOG_COUNT >= 1",
    "variables": {
      "BLOG_COUNT": {
        "type": "count",
        "source": "blog",
        "field": "_id",
        "aggregation": "count"
      }
    }
  },
  "rewards": {
    "xpReward": 50,
    "featureUnlocks": ["custom_avatar"],
    "specialPrivileges": ["early_access"]
  },
  "visibility": {
    "isPublic": true,
    "showInLeaderboard": true,
    "allowSocialSharing": true
  },
  "security": {
    "requiresVerification": false,
    "maxClaimsPerUser": 1,
    "cooldownPeriod": 0,
    "fraudThreshold": 0.8
  }
}
```

### Update Badge

Update an existing badge.

**Endpoint:** `PUT /api/badges/:id`

**Path Parameters:**
- `id` (string): Badge ID

**Request Body:** Same as create badge (all fields optional)

### Delete Badge

Delete a badge (only if no users have earned it).

**Endpoint:** `DELETE /api/badges/:id`

**Path Parameters:**
- `id` (string): Badge ID

### Award Badge to User

Manually award a badge to a user.

**Endpoint:** `POST /api/badges/award`

**Request Body:**
```json
{
  "badgeId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012"
}
```

### Get Pending Claims

Get claims that require admin review.

**Endpoint:** `GET /api/badges/admin/claims/pending`

**Query Parameters:**
- `riskLevel` (string): Filter by risk level (low, medium, high, critical)
- `limit` (number): Number of claims per page (default: 50)
- `page` (number): Page number (default: 1)

**Example Response:**
```json
{
  "success": true,
  "data": {
    "claims": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "claimId": "claim_abc123",
        "badgeId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "First Blog Post",
          "description": "Published your first blog post",
          "icon": "https://example.com/icons/first-blog.png",
          "rarity": "common",
          "category": "content"
        },
        "userId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "John Doe",
          "email": "john@example.com",
          "avatar": "https://example.com/avatars/john.png"
        },
        "status": "under_review",
        "claimedAt": "2024-01-15T10:30:00Z",
        "fraudCheck": {
          "score": 0.7,
          "riskLevel": "high",
          "flags": ["suspicious_ip_activity"],
          "manualReviewRequired": true
        }
      }
    ],
    "count": 1
  }
}
```

### Review Claim

Review and approve/reject a pending claim.

**Endpoint:** `PUT /api/badges/admin/claims/:claimId/review`

**Path Parameters:**
- `claimId` (string): Claim ID

**Request Body:**
```json
{
  "decision": "approve",
  "notes": "User meets all requirements, claim approved"
}
```

**Possible Decisions:**
- `approve`: Approve the claim and award the badge
- `reject`: Reject the claim

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., already has badge)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Security Features

### Fraud Prevention
- IP-based rate limiting
- Device fingerprinting
- Behavioral analysis
- Geographic restrictions
- Account age verification
- Suspicious pattern detection

### Data Protection
- Request signing and verification
- Audit trails for all actions
- Secure claim processing
- Encrypted data transmission

### Rate Limiting
- Per-user and per-IP limits
- Different limits for different actions
- Admin bypass for legitimate operations

## Caching

The API implements intelligent caching:
- Badge listings: 5 minutes
- Badge details: 10 minutes
- Statistics: 30 minutes
- User-specific data: 5 minutes

## Best Practices

1. **Always validate responses** and handle errors gracefully
2. **Implement proper retry logic** for transient failures
3. **Cache badge data** on the client side when appropriate
4. **Monitor rate limits** and implement backoff strategies
5. **Use HTTPS** for all API communications
6. **Store tokens securely** and refresh them before expiration
7. **Implement proper error handling** for network failures

## Rate Limit Headers

The API includes rate limit information in response headers:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## Webhooks (Future Feature)

The badge system will support webhooks for real-time notifications:
- Badge earned
- Claim status changed
- Fraud detected
- System alerts

## Support

For API support and questions:
- Email: api-support@vocalink.com
- Documentation: https://docs.vocalink.com/api
- Status page: https://status.vocalink.com 