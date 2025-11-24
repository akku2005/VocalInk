# 🧪 Day 2 Backend API Testing - Curl Commands

**Testing Method**: Direct API calls using curl  
**Date**: November 23, 2025

---

## 📋 Prerequisites

Before testing, you need:
1. **Auth Token** - Get from browser after login
2. **Blog ID** - Get from database or API response

---

## Step 1: Get Your Auth Token

### Option A: From Browser (Easiest)
1. Open http://localhost:5173 in your browser
2. Login to your account
3. Open DevTools (F12) → Application/Storage → Local Storage
4. Look for `token` or `authToken` key
5. Copy the value

### Option B: Login via API
```bash
# Login and get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Response will include: { "token": "eyJhbGc..." }
```

**Save your token:**
```bash
# For Windows PowerShell:
$TOKEN = "paste-your-token-here"

# For Linux/Mac bash:
export TOKEN="paste-your-token-here"
```

---

## Step 2: Get a Blog ID

### Option A: List Your Blogs
```bash
# Windows PowerShell:
curl -X GET "http://localhost:3000/api/blogs/getBlogs" `
  -H "Authorization: Bearer $TOKEN"

# Linux/Mac:
curl -X GET "http://localhost:3000/api/blogs/getBlogs" \
  -H "Authorization: Bearer $TOKEN"
```

### Option B: Create a Test Blog
```bash
# Windows PowerShell:
curl -X POST "http://localhost:3000/api/blogs/addBlog" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    \"title\": \"Test Draft Blog\",
    \"content\": \"<p>This is a test blog for draft management</p>\",
    \"summary\": \"Testing draft autosave\",
    \"tags\": [\"test\"],
    \"status\": \"draft\",
    \"mood\": \"Educational\"
  }'

# Linux/Mac:
curl -X POST "http://localhost:3000/api/blogs/addBlog" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Draft Blog",
    "content": "<p>This is a test blog for draft management</p>",
    "summary": "Testing draft autosave",
    "tags": ["test"],
    "status": "draft",
    "mood": "Educational"
  }'
```

**Save the blog ID from response:**
```bash
# Windows PowerShell:
$BLOG_ID = "paste-blog-id-here"

# Linux/Mac:
export BLOG_ID="paste-blog-id-here"
```

---

## 🧪 Test 1: Auto-save Draft

**Endpoint**: `POST /api/blogs/drafts/:id/autosave`

```bash
# Windows PowerShell:
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/autosave" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    \"title\": \"Updated Title - Auto-save Test\",
    \"content\": \"<p>This content was auto-saved at $(Get-Date)</p>\",
    \"summary\": \"Auto-save is working!\",
    \"tags\": [\"test\", \"autosave\"],
    \"coverImage\": \"\"
  }'

# Linux/Mac:
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/autosave" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title - Auto-save Test",
    "content": "<p>This content was auto-saved at '$(date)'</p>",
    "summary": "Auto-save is working!",
    "tags": ["test", "autosave"],
    "coverImage": ""
  }'
```

**Expected Response:**
```json
{
  "message": "Draft auto-saved successfully",
  "lastAutosaved": "2025-11-23T03:15:30.123Z",
  "versionNumber": 1,
  "versionsCount": 1
}
```

**Success Criteria:**
- ✅ Status 200
- ✅ versionNumber: 1
- ✅ versionsCount: 1

---

## 🧪 Test 2: Manual Save with Description

**Endpoint**: `POST /api/blogs/drafts/:id/save`

```bash
# Windows PowerShell:
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/save" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    \"title\": \"Manual Save Test\",
    \"content\": \"<p>This is a manual save with custom description</p>\",
    \"changeDescription\": \"Added introduction and main content\"
  }'

# Linux/Mac:
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/save" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Manual Save Test",
    "content": "<p>This is a manual save with custom description</p>",
    "changeDescription": "Added introduction and main content"
  }'
```

**Expected Response:**
```json
{
  "message": "Draft saved successfully",
  "lastAutosaved": "2025-11-23T03:16:00.456Z",
  "versionNumber": 2,
  "versionsCount": 2
}
```

**Success Criteria:**
- ✅ Status 200
- ✅ versionNumber: 2 (incremented)
- ✅ versionsCount: 2

---

## 🧪 Test 3: Get Version History

**Endpoint**: `GET /api/blogs/drafts/:id/versions`

```bash
# Windows PowerShell:
curl -X GET "http://localhost:3000/api/blogs/drafts/$BLOG_ID/versions" `
  -H "Authorization: Bearer $TOKEN"

# Linux/Mac:
curl -X GET "http://localhost:3000/api/blogs/drafts/$BLOG_ID/versions" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "blogId": "...",
  "title": "Manual Save Test",
  "currentVersion": 2,
  "lastAutosaved": "2025-11-23T03:16:00.456Z",
  "versions": [
    {
      "versionNumber": 2,
      "title": "Manual Save Test",
      "summary": null,
      "savedAt": "2025-11-23T03:16:00.456Z",
      "savedBy": {
        "firstName": "Your",
        "lastName": "Name",
        "username": "yourusername"
      },
      "isAutosave": false,
      "changeDescription": "Added introduction and main content",
      "preview": "This is a manual save with custom description..."
    },
    {
      "versionNumber": 1,
      "title": "Updated Title - Auto-save Test",
      "summary": "Auto-save is working!",
      "savedAt": "2025-11-23T03:15:30.123Z",
      "savedBy": { ... },
      "isAutosave": true,
      "changeDescription": "Auto-saved version 1",
      "preview": "This content was auto-saved at..."
    }
  ]
}
```

**Success Criteria:**
- ✅ Status 200
- ✅ 2 versions listed
- ✅ Newest version first (version 2, then version 1)
- ✅ isAutosave correctly set (false for version 2, true for version 1)
- ✅ changeDescription present

---

## 🧪 Test 4: Restore Previous Version

**Endpoint**: `POST /api/blogs/drafts/:id/restore/:versionNumber`

```bash
# Restore to version 1
# Windows PowerShell:
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/restore/1" `
  -H "Authorization: Bearer $TOKEN"

# Linux/Mac:
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/restore/1" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "message": "Successfully restored to version 1",
  "restoredVersion": 1,
  "currentVersion": 3,
  "blog": {
    "title": "Updated Title - Auto-save Test",
    "content": "<p>This content was auto-saved at...</p>",
    "summary": "Auto-save is working!",
    "tags": ["test", "autosave"],
    "coverImage": ""
  }
}
```

**Success Criteria:**
- ✅ Status 200
- ✅ restoredVersion: 1
- ✅ currentVersion: 3 (new backup created)
- ✅ Blog content matches version 1

**Verify restore created backup:**
```bash
# Get version history again
curl -X GET "http://localhost:3000/api/blogs/drafts/$BLOG_ID/versions" \
  -H "Authorization: Bearer $TOKEN"

# Should now show 3 versions:
# v3: Backup before restore
# v2: Manual Save Test
# v1: Auto-save Test
```

---

## 🧪 Test 5: Delete a Version

**Endpoint**: `DELETE /api/blogs/drafts/:id/versions/:versionNumber`

```bash
# Delete version 2
# Windows PowerShell:
curl -X DELETE "http://localhost:3000/api/blogs/drafts/$BLOG_ID/versions/2" `
  -H "Authorization: Bearer $TOKEN"

# Linux/Mac:
curl -X DELETE "http://localhost:3000/api/blogs/drafts/$BLOG_ID/versions/2" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**
```json
{
  "message": "Version 2 deleted successfully",
  "remainingVersions": 2
}
```

**Success Criteria:**
- ✅ Status 200
- ✅ remainingVersions: 2 (was 3, now 2)

**Verify deletion:**
```bash
curl -X GET "http://localhost:3000/api/blogs/drafts/$BLOG_ID/versions" \
  -H "Authorization: Bearer $TOKEN"

# Should now show only 2 versions (v3 and v1, v2 deleted)
```

---

## 🧪 Test 6: Error Handling

### Test Unauthorized Access (No Token)
```bash
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/autosave" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'

# Expected: 401 Unauthorized
```

### Test Blog Not Found
```bash
curl -X POST "http://localhost:3000/api/blogs/drafts/000000000000000000000000/autosave" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'

# Expected: 404 Not Found
# Response: {"message": "Blog not found"}
```

### Test Version Not Found
```bash
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/restore/999" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 404 Not Found
# Response: {"message": "Version not found"}
```

---

## ✅ Quick Test Script (All Tests Combined)

### Windows PowerShell Script:
```powershell
# Setup
$TOKEN = "paste-your-token"
$BLOG_ID = "paste-blog-id"

# Test 1: Auto-save
Write-Host "Test 1: Auto-save..." -ForegroundColor Yellow
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/autosave" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"title":"Test Auto-save","content":"<p>Auto-save test</p>"}'

# Test 2: Manual Save
Write-Host "`nTest 2: Manual save..." -ForegroundColor Yellow
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/save" `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"title":"Test Manual","changeDescription":"Testing manual save"}'

# Test 3: Version History
Write-Host "`nTest 3: Get versions..." -ForegroundColor Yellow
curl -X GET "http://localhost:3000/api/blogs/drafts/$BLOG_ID/versions" `
  -H "Authorization: Bearer $TOKEN"

# Test 4: Restore
Write-Host "`nTest 4: Restore version 1..." -ForegroundColor Yellow
curl -X POST "http://localhost:3000/api/blogs/drafts/$BLOG_ID/restore/1" `
  -H "Authorization: Bearer $TOKEN"

Write-Host "`nAll tests complete!" -ForegroundColor Green
```

---

## 📊 Test Results Template

| Test | Endpoint | Status | Notes |
|------|----------|--------|-------|
| Auto-save | POST /drafts/:id/autosave | ⏳ | |
| Manual Save | POST /drafts/:id/save | ⏳ | |
| Get Versions | GET /drafts/:id/versions | ⏳ | |
| Restore | POST /drafts/:id/restore/:v | ⏳ | |
| Delete | DELETE /drafts/:id/versions/:v | ⏳ | |
| Error Handling | Various | ⏳ | |

**Overall Status**: ⏳ Pending

---

## 🐛 Troubleshooting

### "401 Unauthorized"
- Check token is correct and not expired
- Ensure `Bearer ` prefix in Authorization header
- Re-login to get fresh token

### "404 Blog not found"
- Verify BLOG_ID is correct
- Check blog exists: `curl GET /api/blogs/:id`
- Ensure blog belongs to logged-in user

### "Cannot connect to localhost:3000"
- Verify backend server is running
- Check server logs for errors
- Try: `curl http://localhost:3000/api/health` (if health endpoint exists)

### "500 Internal Server Error"
- Check server logs
- Verify MongoDB is running
- Check blog model has `versions` field

---

**Ready to test! Start with getting your auth token and blog ID, then run the tests.** 🚀

