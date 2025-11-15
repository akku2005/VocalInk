import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

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

  const value = {
    unreadCount,
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
