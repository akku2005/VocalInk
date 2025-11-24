# 🧪 Day 2 Testing Guide - Draft Management System

**Testing Date**: November 23, 2025 03:09 AM  
**Components to Test**: Backend APIs + Frontend Integration

---

## 🎯 Testing Objectives

1. ✅ Verify backend endpoints work correctly
2. ✅ Test autosave functionality
3. ✅ Test version history retrieval
4. ✅ Test version restore
5. ✅ Test version deletion
6. ✅ Validate data integrity
7. ✅ Check error handling

---

## 📋 Prerequisites

**Required**:
- ✅ Backend server running (port 3000)
- ✅ Frontend server running (port 5173)
- ✅ User logged in (for auth token)
- ✅ At least one draft blog exists

**Test Tools**:
- Browser DevTools (Network tab)
- Postman/Thunder Client (optional)
- React DevTools (optional)

---

## 🧪 Test Plan

### **Test 1: Backend - Auto-save Endpoint**

**Endpoint**: `POST /api/blogs/drafts/:id/autosave`

**Test Steps**:
1. Get a draft blog ID from your database
2. Send POST request with updated content
3. Verify response includes version number
4. Check database for saved version

**Expected Request**:
```json
POST /api/blogs/drafts/[BLOG_ID]/autosave
Authorization: Bearer [YOUR_TOKEN]
Content-Type: application/json

{
  "title": "Test Auto-save",
  "content": "<p>This is test content for autosave</p>",
  "summary": "Testing autosave functionality",
  "tags": ["test", "autosave"],
  "coverImage": ""
}
```

**Expected Response**:
```json
{
  "message": "Draft auto-saved successfully",
  "lastAutosaved": "2025-11-23T03:15:30.000Z",
  "versionNumber": 1,
  "versionsCount": 1
}
```

**Success Criteria**:
- ✅ Status code: 200
- ✅ Response includes `versionNumber`
- ✅ Response includes `lastAutosaved`
- ✅ `versionsCount` increments with each save

---

### **Test 2: Backend - Manual Save Endpoint**

**Endpoint**: `POST /api/blogs/drafts/:id/save`

**Test Steps**:
1. Use same blog ID
2. Send POST with changeDescription
3. Verify manual save flag is set

**Expected Request**:
```json
POST /api/blogs/drafts/[BLOG_ID]/save
Authorization: Bearer [YOUR_TOKEN]

{
  "title": "Test Manual Save",
  "content": "<p>Manual save content</p>",
  "changeDescription": "Added introduction paragraph"
}
```

**Expected Response**:
```json
{
  "message": "Draft saved successfully",
  "lastAutosaved": "2025-11-23T03:16:00.000Z",
  "versionNumber": 2,
  "versionsCount": 2
}
```

**Success Criteria**:
- ✅ Status code: 200
- ✅ Version number incremented
- ✅ Change description saved

---

### **Test 3: Backend - Get Version History**

**Endpoint**: `GET /api/blogs/drafts/:id/versions`

**Test Steps**:
1. Request version history
2. Verify all versions are returned
3. Check version sorting (newest first)

**Expected Request**:
```
GET /api/blogs/drafts/[BLOG_ID]/versions
Authorization: Bearer [YOUR_TOKEN]
```

**Expected Response**:
```json
{
  "blogId": "...",
  "title": "Test Manual Save",
  "currentVersion": 2,
  "lastAutosaved": "2025-11-23T03:16:00.000Z",
  "versions": [
    {
      "versionNumber": 2,
      "title": "Test Manual Save",
      "summary": null,
      "savedAt": "2025-11-23T03:16:00.000Z",
      "savedBy": { ... },
      "isAutosave": false,
      "changeDescription": "Added introduction paragraph",
      "preview": "Manual save content..."
    },
    {
      "versionNumber": 1,
      "title": "Test Auto-save",
      "summary": "Testing autosave functionality",
      "savedAt": "2025-11-23T03:15:30.000Z",
      "savedBy": { ... },
      "isAutosave": true,
      "changeDescription": "Auto-saved version 1",
      "preview": "This is test content for autosave..."
    }
  ]
}
```

**Success Criteria**:
- ✅ Status code: 200
- ✅ Versions sorted newest first
- ✅ Each version has all required fields
- ✅ `isAutosave` correctly set
- ✅ Preview truncated to 200 chars

---

### **Test 4: Backend - Restore Version**

**Endpoint**: `POST /api/blogs/drafts/:id/restore/:versionNumber`

**Test Steps**:
1. Choose a version to restore (e.g., version 1)
2. Send restore request
3. Verify current content is backed up
4. Verify version is restored

**Expected Request**:
```
POST /api/blogs/drafts/[BLOG_ID]/restore/1
Authorization: Bearer [YOUR_TOKEN]
```

**Expected Response**:
```json
{
  "message": "Successfully restored to version 1",
  "restoredVersion": 1,
  "currentVersion": 3,
  "blog": {
    "title": "Test Auto-save",
    "content": "<p>This is test content for autosave</p>",
    "summary": "Testing autosave functionality",
    "tags": ["test", "autosave"],
    "coverImage": ""
  }
}
```

**Success Criteria**:
- ✅ Status code: 200
- ✅ Content matches version 1
- ✅ New backup version created (version 3)
- ✅ Current blog content updated

---

### **Test 5: Backend - Delete Version**

**Endpoint**: `DELETE /api/blogs/drafts/:id/versions/:versionNumber`

**Test Steps**:
1. Choose a version to delete
2. Send delete request
3. Verify version is removed
4. Verify version count decremented

**Expected Request**:
```
DELETE /api/blogs/drafts/[BLOG_ID]/versions/2
Authorization: Bearer [YOUR_TOKEN]
```

**Expected Response**:
```json
{
  "message": "Version 2 deleted successfully",
  "remainingVersions": 2
}
```

**Success Criteria**:
- ✅ Status code: 200
- ✅ Version count decremented
- ✅ Deleted version not in history

---

### **Test 6: Backend - Error Handling**

**Test Cases**:

#### 6.1: Unauthorized Access
```
POST /api/blogs/drafts/[BLOG_ID]/autosave
(No Authorization header)

Expected: 401 Unauthorized
```

#### 6.2: Blog Not Found
```
POST /api/blogs/drafts/000000000000000000000000/autosave
Authorization: Bearer [TOKEN]

Expected: 404 Not Found
{
  "message": "Blog not found"
}
```

#### 6.3: Not Blog Owner
```
POST /api/blogs/drafts/[SOMEONE_ELSES_BLOG_ID]/autosave
Authorization: Bearer [YOUR_TOKEN]

Expected: 403 Forbidden
{
  "message": "Not authorized to edit this blog"
}
```

#### 6.4: Version Not Found
```
POST /api/blogs/drafts/[BLOG_ID]/restore/999
Authorization: Bearer [TOKEN]

Expected: 404 Not Found
{
  "message": "Version not found"
}
```

---

### **Test 7: Frontend - useAutosave Hook**

**Setup**:
1. Create a test blog draft
2. Open CreateBlogPage or integrate hook
3. Edit content
4. Watch console logs

**Test Steps**:
1. Type in editor
2. Wait 30 seconds
3. Check console for `[Autosave] Success`
4. Verify save status updates
5. Check `lastSaved` timestamp

**Success Criteria**:
- ✅ Hook triggers after 30s of inactivity
- ✅ `saveStatus` changes: `idle` → `saving` → `saved`
- ✅ `lastSaved` updates with timestamp
- ✅ Console shows success log
- ✅ Network tab shows POST request

---

### **Test 8: Frontend - Version History Component**

**Test Steps**:
1. Open VersionHistory modal
2. Verify versions list loads
3. Test restore button
4. Test delete button
5. Test close button

**Success Criteria**:
- ✅ Modal opens/closes smoothly
- ✅ All versions displayed
- ✅ Relative timestamps shown ("5m ago")
- ✅ Auto-save vs manual indicators visible
- ✅ Restore works with confirmation
- ✅ Delete works with confirmation
- ✅ Loading states appear

---

### **Test 9: Frontend - Save Status Indicator**

**Test Steps**:
1. Watch indicator during autosave
2. Verify icon changes
3. Check timestamp format

**Success Criteria**:
- ✅ Shows "Saving..." with spinner
- ✅ Shows "Saved Xm ago" with check
- ✅ Shows error state if save fails
- ✅ Time updates correctly

---

### **Test 10: Integration - Full Workflow**

**End-to-End Test**:
1. Create new blog draft
2. Type some content
3. Wait for autosave (30s)
4. Verify "Saved" status
5. Make more changes
6. Wait for another autosave
7. Open version history
8. Verify 2+ versions exist
9. Restore to first version
10. Verify content restored
11. Check new backup version created

**Success Criteria**:
- ✅ Complete workflow works
- ✅ No errors in console
- ✅ All saves successful
- ✅ Version history accurate
- ✅ Restore works perfectly

---

## 🐛 Known Issues to Watch For

### Potential Issues:
1. **CORS errors** - Check backend CORS config
2. **Auth token expiry** - Re-login if 401
3. **Blog ID mismatch** - Ensure correct ID
4. **Database connection** - Check MongoDB
5. **Route conflicts** - Verify route order in blog.routes.js

### Debug Tips:
- Check browser console for errors
- Check Network tab for request/response
- Check server logs for backend errors
- Use React DevTools to inspect hook state
- Add console.logs in useAutosave hook

---

## ✅ Test Results Template

### Backend Tests:
- [ ] Auto-save endpoint works
- [ ] Manual save endpoint works
- [ ] Get version history works
- [ ] Restore version works
- [ ] Delete version works
- [ ] Error handling correct

### Frontend Tests:
- [ ] useAutosave hook works
- [ ] Save status indicator shows correct states
- [ ] Version history modal Opens/closes
- [ ] Version list displays correctly
- [ ] Restore functionality works
- [ ] Delete functionality works

### Integration Tests:
- [ ] Full workflow completes
- [ ] No console errors
- [ ] Data integrity maintained
- [ ] UI responsive and smooth

---

## 🎯 Success Metrics

**Functional**:
- All endpoints return correct status codes
- Data saves correctly to database
- Versions restore accurately
- Error handling works

**Performance**:
- Autosave latency < 500ms
- Version history loads < 1s
- Restore operation < 1s
- No UI lag

**UX**:
- Save status clearly visible
- Timestamps human-readable
- Confirmations prevent accidents
- Loading states present

---

## 📝 Testing Notes

**Date**: _____________  
**Tester**: _____________  
**Results**: _____________

**Issues Found**:
- 
- 

**Next Steps**:
- 
- 

---

**Ready to start testing!** 🚀

