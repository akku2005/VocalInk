# Deployment Guide

This guide explains how to deploy the VocalInk application to a production environment (e.g., AWS).

## 1. Environment Configuration

### Backend (`/server`)

Create a `.env` file in the `server` directory based on `.env.example`.

**Crucial for Deployment:**
- **`CORS_ORIGIN`**: Set this to the URL of your deployed frontend. You can specify multiple origins separated by commas.
  - Example: `CORS_ORIGIN=http://your-frontend-ip,http://your-domain.com`
- **`PORT`**: The port the server will listen on (default: 5000 or 3000).
- **`MONGODB_URI`**: Your production MongoDB connection string.

### Frontend (`/client`)

Create a `.env` file in the `client` directory.

**Crucial for Deployment:**
- **`VITE_API_URL`**: Set this to the URL of your deployed backend API.
  - Example: `VITE_API_URL=http://your-backend-ip:5000/api` (or `https://api.your-domain.com/api`)

## 2. Build and Run

### Backend

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    (Or use a process manager like PM2: `pm2 start server.js`)

### Frontend

1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the project:
    ```bash
    npm run build
    ```
    This will create a `dist` directory containing the static files.

4.  Serve the `dist` directory using a web server (e.g., Nginx, Apache, or `serve`).
    - Example using `serve`:
      ```bash
      npx serve -s dist
      ```

## 3. AWS Deployment Tips

- **Security Groups**: Ensure your AWS Security Groups allow traffic on the ports you are using (e.g., 80/443 for frontend, 5000 for backend).
- **Elastic IP**: Assign Elastic IPs to your instances if you need static IP addresses.
- **Nginx**: It is recommended to use Nginx as a reverse proxy for both the frontend (serving static files) and the backend (proxying API requests).

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
