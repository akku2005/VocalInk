const WebSocket = require('ws');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> WebSocket connection
    this.rooms = new Map(); // roomId -> Set of WebSocket connections
    this.heartbeatInterval = null;
  }

  /**
   * 
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Start heartbeat
    this.startHeartbeat();

    logger.info('WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    try {
      // Extract token from query string or headers
      const token = this.extractToken(req);
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Store connection with user ID
      this.clients.set(userId, ws);
      ws.userId = userId;
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Send connection confirmation
      this.sendToUser(userId, {
        type: 'connection_established',
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString()
      });

      // Handle incoming messages
      ws.on('message', (data) => {
        // Simple backpressure control
        if (ws.bufferedAmount > 5 * 1024 * 1024) {
          logger.warn('WebSocket backpressure threshold exceeded; dropping message', { userId });
          return;
        }
        this.handleMessage(userId, data);
      });

      // Handle connection close
      ws.on('close', () => {
        this.handleDisconnection(userId);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.handleDisconnection(userId);
      });

      logger.info('WebSocket client connected', { userId });

    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  /**
   * Extract JWT token from request
   */
  extractToken(req) {
    // Try query parameter first
    const url = new URL(req.url, `http://${req.headers.host}`);
    let token = url.searchParams.get('token');

    // Try Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    return token;
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(userId, data) {
    try {
      const { secureJSONParse } = require('../utils/secureParser');
      const message = secureJSONParse(data, {
        maxLength: 1000,
        validateSchema: (data) => {
          return typeof data === 'object' && 
                 data !== null && 
                 typeof data.type === 'string' &&
                 ['join_room', 'leave_room', 'ping'].includes(data.type);
        }
      });
      
      if (!message) {
        logger.warn('Invalid WebSocket message received:', { userId, data: data.substring(0, 100) });
        return;
      }
      
      switch (message.type) {
        case 'join_room':
          this.joinRoom(userId, message.roomId);
          break;
        case 'leave_room':
          this.leaveRoom(userId, message.roomId);
          break;
        case 'ping':
          this.sendToUser(userId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        default:
          logger.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(userId) {
    this.clients.delete(userId);
    
    // Remove from all rooms
    for (const [roomId, connections] of this.rooms.entries()) {
      connections.delete(userId);
      if (connections.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    logger.info('WebSocket client disconnected', { userId });
  }

  /**
   * Join a room
   */
  joinRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);
    
    this.sendToUser(userId, {
      type: 'room_joined',
      roomId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Leave a room
   */
  leaveRoom(userId, roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
    
    this.sendToUser(userId, {
      type: 'room_left',
      roomId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId, message) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Error sending message to user:', error);
        this.handleDisconnection(userId);
      }
    }
  }

  /**
   * Send message to all users in a room
   */
  sendToRoom(roomId, message) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.forEach(userId => {
        this.sendToUser(userId, message);
      });
    }
  }

  /**
   * Send message to all connected clients
   */
  broadcast(message) {
    this.clients.forEach((ws, userId) => {
      this.sendToUser(userId, message);
    });
  }

  /**
   * Send notification to user
   */
  sendNotification(userId, notification) {
    this.sendToUser(userId, {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send real-time blog update
   */
  sendBlogUpdate(blogId, update) {
    this.sendToRoom(`blog:${blogId}`, {
      type: 'blog_update',
      blogId,
      data: update,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send real-time comment
   */
  sendCommentUpdate(blogId, comment) {
    this.sendToRoom(`blog:${blogId}`, {
      type: 'comment_update',
      blogId,
      data: comment,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send badge earned notification
   */
  sendBadgeEarned(userId, badge) {
    this.sendToUser(userId, {
      type: 'badge_earned',
      data: badge,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send level up notification
   */
  sendLevelUp(userId, levelData) {
    this.sendToUser(userId, {
      type: 'level_up',
      data: levelData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.entries()).map(([roomId, connections]) => ({
        roomId,
        connections: connections.size
      }))
    };
  }

  /**
   * Health check
   */
  healthCheck() {
    return {
      status: this.wss ? 'healthy' : 'unhealthy',
      connections: this.clients.size,
      rooms: this.rooms.size
    };
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

module.exports = webSocketService; 