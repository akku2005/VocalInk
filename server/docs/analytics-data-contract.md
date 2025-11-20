# Personal Analytics Data Contract

## Endpoint
- `GET /api/dashboard/personal-analytics`
- Protected route (requires a valid `Authorization: Bearer ...` token)
- Query parameter: `period` (optional). Supported values: `7d`, `30d`, `90d`, `1y`. Defaults to `30d`.

## Response Shape
```json
{
  "stats": {
    "totalViews": 0,
    "totalLikes": 0,
    "totalComments": 0,
    "totalShares": 0,
    "totalBookmarks": 0,
    "totalBlogs": 0,
    "followerCount": 0,
    "followingCount": 0,
    "engagementRate": 0,
    "avgLikesPerBlog": 0,
    "avgCommentsPerBlog": 0,
    "avgBookmarksPerBlog": 0
  },
  "timeline": [
    { "label": "11/15", "views": 12, "likes": 3, "comments": 2 }
  ],
  "topPosts": [
    {
      "id": "6143e6eea4f8c4f8b14d5be2",
      "title": "My post",
      "slug": "my-post",
      "coverImage": "...",
      "views": 25,
      "likes": 4,
      "comments": 1,
      "bookmarks": 2,
      "engagementScore": 16,
      "publishedAt": "2025-11-14T09:00:00.000Z"
    }
  ],
  "audience": {
    "ageGroups": [
      { "label": "13-17", "min": 13, "max": 17, "value": 0 },
      ...
    ],
    "locations": [
      { "label": "City, State", "value": 3 }
    ]
  },
  "bestTimes": [
    { "label": "10:00", "value": 2 }
  ],
  "period": "7d",
  "generatedAt": "2025-11-15T12:00:00.123Z",
  "meta": {
    "source": "live",
    "period": "7d",
    "cacheTTL": 300,
    "durationMs": 120
  }
}
```

## Caching
- The payload is cached in `CacheService` under the key `personal-analytics:{userId}:{period}` with a TTL of `PERSONAL_ANALYTICS_CACHE_TTL` (default 300 seconds).
- Cache entries are invalidated whenever a blog-related mutation occurs (creation, update, deletion, publishing, summary regeneration, likes/bookmarks, TTS generation). The invalidation helper lives in `blog.controller.js`.
- Cached responses are still logged via `AnalyticsFetchLog` with `source: "cache"` so the front-end can show smooth UI while tracking freshness.

## Tracking
- Each fetch (live or cache) produces an `AnalyticsFetchLog` document that records:
  - `user`: reference to the authenticated user
  - `period`: the requested period (`7d`, `30d`, `90d`, `1y`)
  - `source`: `"live"` or `"cache"`
  - `durationMs`: how long the fetch took
  - The document expires automatically after 7 days (`expireAfterSeconds`).
- The front-end can inspect these logs via `dashboard.personalAnalytics.test.js` to ensure caching behaves as expected.

## Error Handling
- `401 Unauthorized` when the request is not authenticated.
- `500 Internal Server Error` if aggregation fails (e.g., database outage). The error payload includes a generic message and the logged exception.

