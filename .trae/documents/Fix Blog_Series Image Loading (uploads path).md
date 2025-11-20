## Problem Summary
- Blog and series images uploaded to `"/uploads/image"` return relative paths like `"/uploads/<file>"`.
- Frontend prefixes these to `"/api/uploads/..."` during upload, which 404s because backend serves static files at `"/uploads"` (not under `"/api"`).
- In dev, Vite proxies only `"/api"` to the backend, so requests to `"/uploads"` hit the Vite server instead of the backend.

## Fix Strategy
1. Backend alias: serve static uploads under both `"/uploads"` and `"/api/uploads"` to immediately unbreak existing stored URLs.
2. Dev proxy: proxy `"/uploads"` to backend so relative URLs work during development.
3. Frontend normalization: centralize an `resolveAssetUrl(url)` helper and use it everywhere for cover/content images; stop manual `"/api"` prefixing.
4. Rendering safety: normalize on render so previously saved `"/api/uploads/..."` also displays.

## Files To Update
- Backend
  - `server/src/app.js`: add `app.use('/api/uploads', express.static(...))` alongside existing `'/uploads'` static route.
- Frontend
  - `client/vite.config.js`: add dev proxy for `'/uploads'` → `http://localhost:5000`.
  - `client/src/constants/apiConfig.js`: add `getAssetBase()` and `resolveAssetUrl(url)` helper.
  - `client/src/components/ui/RichTextEditor.jsx`: use `resolveAssetUrl` for inserted image URLs, remove manual `"/api"` prefix.
  - `client/src/pages/CreateBlogPageNew.jsx`: use `resolveAssetUrl` for cover image, remove manual `"/api"` prefix.
  - `client/src/pages/CreateSeriesPagemain.jsx`: use `resolveAssetUrl` for cover image, remove manual `"/api"` prefix.
  - `client/src/components/blog/BlogCard.jsx`: normalize `coverSrc` via helper before render.
  - `client/src/components/blog/ArticleView.jsx`: normalize `article.coverImage` via helper; also sanitize `article.content` by replacing `"src=\"/api/uploads/"` → `"src=\"/uploads/"` when rendering.
  - `client/src/pages/SeriesPage.jsx`: normalize `series.coverImage` via helper before render.

## Implementation Steps
1. Add backend static alias:
   - In `server/src/app.js:371`, duplicate uploads static route with `app.use('/api/uploads', express.static(path.join(__dirname, '../public/uploads'), { maxAge: staticCacheMaxAge }))`.
2. Extend Vite proxy:
   - In `client/vite.config.js:25-34`, add a new entry for `'/uploads'` pointing to `http://localhost:5000`.
3. Create helper functions:
   - In `client/src/constants/apiConfig.js`, export:
     - `getAssetBase()`: returns `VITE_API_URL` without trailing `/api` or empty string.
     - `resolveAssetUrl(url)`: if `http(s)`, return; if starts with `/api/uploads`, strip `/api`; if starts with `/uploads`, prefix with `getAssetBase()` when running on a different origin; else return unchanged.
4. Use helper in upload flows:
   - Replace manual `url = resp.data.url.startsWith('http') ? resp.data.url : '/api' + resp.data.url` with `resolveAssetUrl(resp.data.url)` in:
     - `client/src/components/ui/RichTextEditor.jsx:91-96,110-115,169-174`
     - `client/src/pages/CreateBlogPageNew.jsx:73-79`
     - `client/src/pages/CreateSeriesPagemain.jsx:56-59`
5. Normalize on render:
   - `BlogCard.jsx:50` wrap `coverSrc` with `resolveAssetUrl(coverSrc)`.
   - `ArticleView.jsx:308-315` set `src={resolveAssetUrl(article.coverImage)}`; before `dangerouslySetInnerHTML`, replace `src="/api/uploads/` with `src="/uploads/`.
   - `SeriesPage.jsx:528-533,331-336` wrap `series.coverImage` with `resolveAssetUrl(series.coverImage)`.

## Verification Plan
- Dev: run backend and frontend; ensure Vite proxies `/uploads`; open an article and series with covers stored as both `'/uploads/...'` and `'/api/uploads/...'` and confirm images render.
- Upload test: insert an image via editor paste/drop and cover uploads; confirm returned path is normalized and renders.
- Production: confirm static serving works for both paths; check CORS and cache headers intact.

## Rollback Safety
- Changes are additive (backend alias route) and centralized (helper); easy to revert if needed. No schema migrations required.

Approve to implement these changes and run verification?