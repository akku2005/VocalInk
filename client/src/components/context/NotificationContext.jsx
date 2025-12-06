import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { sessionStorageHelper } from '../../utils/storage';
import API_CONFIG from '../../constants/apiConfig';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const hasUnread = unreadCount > 0;

  // Update unread count
  const updateUnreadCount = useCallback((count) => {
    setUnreadCount(Math.max(0, count));
  }, []);

  // Decrement unread count
  const decrementUnreadCount = useCallback((amount = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount));
  }, []);

  // Reset unread count to 0
  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Lightweight WebSocket client to receive live notification events
  const resolveWsBase = () => {
    try {
      // Prefer explicit WS URL
      if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL.replace(/\/+$/, '');
      }
      // Derive from API URL if absolute
      const apiUrl = import.meta.env.VITE_API_URL || API_CONFIG.BASE_URL;
      if (apiUrl && apiUrl.startsWith('http')) {
        const parsed = new URL(apiUrl);
        const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${wsProtocol}//${parsed.host}`;
      }
      // Fallback to current origin (same host/port as frontend)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}`;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    const token = sessionStorageHelper.getItem('accessToken');
    if (!token || typeof window === 'undefined') return;

    const base = resolveWsBase();
    if (!base) return;

    const ws = new WebSocket(`${base}/ws?token=${encodeURIComponent(token)}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          setUnreadCount((prev) => Math.max(0, prev + 1));
        }
      } catch (err) {
        // Ignore malformed messages
        console.debug('WS notification parse error', err);
      }
    };

    ws.onerror = () => {
      // Non-blocking; close quietly to avoid console spam
      try { ws.close(); } catch (_) { }
    };

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, []);

  const value = {
    unreadCount,
    hasUnread,
    updateUnreadCount,
    decrementUnreadCount,
    resetUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
