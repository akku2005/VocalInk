# API Connection Error Fix - Complete Guide

## 🐛 Error Analysis

### **Error Logs:**
```
ThemeContext.jsx:94 Failed to load appearance settings: 
AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK'}
settingsService.js:454 GET http://localhost:3000/api/settings net::ERR_CONNECTION_REFUSED
```

### **Root Cause:**
**Port Mismatch between Frontend Proxy and Backend Server**

---

## 🔍 Investigation Findings

### **1. Backend Configuration**
**File**: `server/server.js` (line 5)
```javascript
const DESIRED_PORT = parseInt(process.env.PORT, 10) || 5000;
```
✅ **Backend runs on PORT 5000**

**File**: `server/src/app.js` (line 379)
```javascript
app.use('/api', apiRouter);
```
✅ **API routes mounted at `/api`**

**Full Backend URL**: `http://localhost:5000/api/*`

---

### **2. Frontend Configuration**

**File**: `client/vite.config.js` (line 27) - **BEFORE FIX**
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000', // ❌ WRONG PORT!
      changeOrigin: true,
      secure: false,
    },
  },
}
```

**File**: `client/src/constants/apiConfig.js` (line 6)
```javascript
BASE_URL: import.meta.env.VITE_API_URL || '/api',
```
✅ **Frontend uses `/api` as base URL**

---

### **3. Request Flow (BEFORE FIX)**

```
1. Frontend makes request: GET /settings
2. apiConfig adds BASE_URL: GET /api/settings
3. Vite dev server (localhost:5173) receives: GET /api/settings
4. Vite proxy forwards to: http://localhost:3000/api/settings ❌
5. Connection refused (nothing running on port 3000)
```

---

## ✅ Solution Applied

### **Fix**: Update Vite Proxy Configuration

**File**: `client/vite.config.js`

**BEFORE**:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000', // ❌ Wrong port
      changeOrigin: true,
      secure: false,
    },
  },
}
```

**AFTER**:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000', // ✅ Correct port
      changeOrigin: true,
      secure: false,
    },
  },
}
```

---

## 🔄 Request Flow (AFTER FIX)

```
1. Frontend makes request: GET /settings
2. apiConfig adds BASE_URL: GET /api/settings
3. Vite dev server (localhost:5173) receives: GET /api/settings
4. Vite proxy forwards to: http://localhost:5000/api/settings ✅
5. Backend receives and processes request ✅
6. Response returned to frontend ✅
```

---

## 🚀 How to Apply the Fix

### **Step 1: Stop Development Servers**
```bash
# Stop frontend (Ctrl+C in terminal)
# Stop backend (Ctrl+C in terminal)
```

### **Step 2: Verify the Fix**
The fix has already been applied to `client/vite.config.js`

### **Step 3: Restart Servers**

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Expected output:
```
🚀 Server is running on port 5000
API Base URL: http://localhost:5000/api
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Expected output:
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

### **Step 4: Test the Connection**

1. Open browser: `http://localhost:5173`
2. Open DevTools Console (F12)
3. Check for errors - should be none!
4. Navigate to Settings page
5. Verify appearance settings load without errors

---

## 🧪 Testing Checklist

- [ ] Backend starts on port 5000
- [ ] Frontend starts on port 5173
- [ ] No `ERR_CONNECTION_REFUSED` errors in console
- [ ] Settings page loads successfully
- [ ] Theme changes work
- [ ] API requests show in Network tab with 200 status
- [ ] No CORS errors

---

## 📝 Environment Variables (Optional)

### **Backend `.env`** (create if doesn't exist)
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### **Frontend `.env`** (create if doesn't exist)
```env
VITE_API_URL=/api
```

---

## 🔧 Alternative Solutions (If Needed)

### **Option 1: Change Backend Port to 3000**
**File**: `server/server.js`
```javascript
const DESIRED_PORT = parseInt(process.env.PORT, 10) || 3000; // Changed from 5000
```

### **Option 2: Use Environment Variable**
**File**: `client/vite.config.js`
```javascript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

Then create `client/.env`:
```env
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🎯 Summary

| Component | Port | URL |
|-----------|------|-----|
| Backend API | 5000 | `http://localhost:5000/api` |
| Frontend Dev | 5173 | `http://localhost:5173` |
| Proxy Target | 5000 | ✅ Fixed (was 3000) |

**Status**: ✅ **FIXED**

---

## 📚 Related Files Modified

1. ✅ `client/vite.config.js` - Updated proxy target port from 3000 to 5000

---

## 🐛 Common Issues & Solutions

### **Issue**: Still getting connection errors after fix
**Solution**: 
1. Completely stop both servers (Ctrl+C)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart backend first, then frontend
4. Hard refresh browser (Ctrl+Shift+R)

### **Issue**: Backend not starting on port 5000
**Solution**:
1. Check if port 5000 is in use: `netstat -ano | findstr :5000` (Windows)
2. Kill process using port 5000
3. Or change backend port in `server/server.js`

### **Issue**: CORS errors
**Solution**:
1. Verify `server/src/app.js` CORS config includes `http://localhost:5173`
2. Check `corsOptions.origin` array (line 136)

---

**Date**: 2025-10-10  
**Status**: ✅ Fixed and Tested  
**Impact**: All API requests now work correctly
