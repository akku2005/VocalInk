## Scope
- Analyze non-admin endpoints mounted under `/api` in Express.
- Cover: Auth, Blogs, Series, Notifications, Settings, Images, Uploads, TTS, XP, Dashboard, Stats, Security.
- Exclude any path containing `/admin/`.

## Endpoint Inventory
- Mounted router: `server/src/routes/index.js:25-39` → base `/api/*`.
- Auth: `server/src/routes/auth.js` (JWT-based; rate-limited)
- Blogs: `server/src/blog/blog.routes.js`
- Series: `server/src/series/series.routes.js`
- Notifications: `server/src/notification/notification.routes.js`
- Settings: `server/src/routes/settings.js`
- Images: `server/src/routes/imageRoutes.js`
- Uploads (legacy local disk): `server/src/routes/upload.routes.js`
- TTS: `server/src/routes/tts.routes.js`
- XP: `server/src/routes/xp.js`
- Dashboard: `server/src/routes/dashboard.routes.js`
- Stats: `server/src/routes/stats.js`
- Security utilities: `server/src/routes/security.js`

## Authentication Model
- Middleware: `server/src/middleware/auth.js`
- Type: JWT bearer (`Authorization: Bearer <token>`)
- Additional headers: optional `X-Device-Fingerprint`; rate limits via `middleware/rateLimiter`.
- Roles: `authorize('admin')`, `requireAdmin`; owner checks via `requireOwnerOrAdmin`.

## Error Model
- Central handler: `server/src/middleware/errorHandler.js`
- Standard error response fields: `success`, `message`, `statusCode`, `timestamp`, `path`, `method`
- Special codes handled: 400 (validation), 401/Token issues, 403, 404, 409 (duplicate), 429, 500, plus `423` (lockout in auth flows).

## Payload Constraints Sources
- Auth schemas: `server/src/validations/authSchema.js` (Joi)
- Blog validation: `server/src/middleware/blogValidation.js` (express-validator)
- Series schemas: `server/src/validations/seriesSchema.js` (Joi)
- Settings controller enforces field whitelists: `server/src/controllers/settings.controller.js`
- Notifications: request queries and IDs enforced in controller (`notification.controller.js`)

## Deliverables
1. Endpoint documentation tables (method, path, auth, params, status codes, response shapes) for:
   - Auth
   - Blogs
   - Series
   - Notifications
   - Settings
   - Images
   - Uploads (legacy; mark deprecated)
   - TTS
   - XP
   - Dashboard
   - Stats
   - Security
2. Payload analysis per endpoint group:
   - JSON schema-like descriptions (types, formats, min/max, enums)
   - Example payloads and responses
   - Deprecations: flag `/uploads/image` as deprecated in favor of Cloudinary `/images/upload`
3. OpenAPI 3.0 (`server/swagger.json`) updates:
   - Components:
     - `securitySchemes.bearerAuth` (http bearer JWT)
     - Error model (`ErrorResponse`) with fields per errorHandler
     - Request models ($refs) for Auth, Blog, Series, Settings, Notifications
   - Paths for all non-admin endpoints with operation summaries, descriptions, parameters, and `requestBody`/responses
   - Examples: success and error for each operation
   - Tag grouping
4. Quality assurance:
   - Validate with Swagger UI (already served at `/api-docs` per `server/src/app.js:374-376`)
   - Run OpenAPI validator (lint) on the updated `swagger.json`
   - Spot-check sample requests against local server responses
   - Cross-check fields against validators/controllers for consistency

## Implementation Steps
1. Catalog endpoints and parameters
   - Extract path/methods from route files listed above
   - Map to controllers to collect status codes and response shapes
   - Collect query/path/body constraints from Joi/express-validator
2. Draft OpenAPI components
   - `components/schemas` for Auth, Blog, Series, Notification, Settings, ImageUpload
   - `components/schemas/ErrorResponse`
   - `components/securitySchemes.bearerAuth`
3. Author path specs
   - For each endpoint, define parameters (path/query), `requestBody` with `$ref`, `responses` with `$ref` to models, include examples
   - Mark deprecated endpoints in `paths` (e.g., `/uploads/image`)
   - Exclude `/admin/*` paths
4. Validate & QA
   - Open `/api-docs` to ensure Swagger UI renders all paths
   - Run OpenAPI validation tool; resolve `$ref` completeness and content-types
   - Execute sample cURL/HTTP calls for representative endpoints; confirm examples match
5. Hand-off
   - Provide the updated `swagger.json` and a short README section explaining security scheme, common error format, and examples

## Notes
- Backward compatibility: align documented response structures with actual controller outputs (some return raw object, some wrapped in `{ success, data }`).
- Document rate limiting where used (login/register/password reset).
- Ensure privacy/security: do not expose admin-only paths; omit admin security schemes.

Approve this plan to proceed with generating and updating the OpenAPI document and delivering the full endpoint analysis tables and examples.