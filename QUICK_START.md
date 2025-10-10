# VocalInk - Quick Start Guide

## 🚀 Start Development Servers

### **Prerequisites**
- Node.js installed (v16+)
- MongoDB running (local or cloud)
- Both `server` and `client` dependencies installed

---

## 📦 Installation (First Time Only)

### **Backend Setup**
```bash
cd server
npm install
```

### **Frontend Setup**
```bash
cd client
npm install
```

---

## ▶️ Running the Application

### **Option 1: Two Separate Terminals (Recommended)**

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
✅ Backend should start on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
✅ Frontend should start on: `http://localhost:5173`

---

### **Option 2: Single Terminal (Using concurrently)**

From root directory:
```bash
npm run dev
```
(If configured in root `package.json`)

---

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Docs**: http://localhost:5000/api-docs (dev only)
- **Health Check**: http://localhost:5000/health

---

## ✅ Verify Everything Works

1. Open browser: `http://localhost:5173`
2. Open DevTools Console (F12)
3. Check for errors - should see no connection errors
4. Try logging in or registering
5. Navigate to Settings page
6. Change theme - should work without errors

---

## 🛑 Stopping the Servers

Press `Ctrl + C` in each terminal running the servers.

---

## 🔧 Port Configuration

| Service | Port | Can Change? |
|---------|------|-------------|
| Backend | 5000 | Yes - edit `server/server.js` |
| Frontend | 5173 | Yes - edit `client/vite.config.js` |
| MongoDB | 27017 | Yes - edit `.env` |

**Important**: If you change backend port, also update `client/vite.config.js` proxy target!

---

## 🐛 Troubleshooting

### **Backend won't start**
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill the process or change port
```

### **Frontend won't start**
```bash
# Check if port 5173 is in use
netstat -ano | findstr :5173

# Or specify different port
npm run dev -- --port 3000
```

### **Connection Refused Errors**
1. Verify backend is running on port 5000
2. Check `client/vite.config.js` proxy target is `http://localhost:5000`
3. Restart both servers

### **MongoDB Connection Error**
1. Ensure MongoDB is running
2. Check connection string in `server/.env`
3. Verify MongoDB service is started

---

## 📝 Environment Variables

### **Backend `.env`** (create in `server/` folder)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/vocalink
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:5173
```

### **Frontend `.env`** (create in `client/` folder)
```env
VITE_API_URL=/api
```

---

## 🎯 Common Commands

### **Backend**
```bash
npm run dev          # Start development server
npm start            # Start production server
npm test             # Run tests
npm run lint         # Run linter
```

### **Frontend**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
```

---

## 📚 Next Steps

1. ✅ Servers running
2. ✅ No connection errors
3. 📖 Read API documentation: http://localhost:5000/api-docs
4. 🔧 Configure environment variables
5. 🎨 Start developing!

---

**Happy Coding! 🚀**
