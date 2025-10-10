import api from './api';

/**
 * Notification Service
 * Handles all notification-related API calls
 */
const notificationService = {
  /**
   * Get user notifications with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.type - Notification type filter
   * @param {boolean} params.unreadOnly - Show only unread notifications
   * @returns {Promise<Object>} Notifications with pagination data
   */
  async getNotifications(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.type) queryParams.append('type', params.type);
      if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);

      const queryString = queryParams.toString();
      const url = queryString ? `/notifications?${queryString}` : '/notifications';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Get notification by ID
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Notification object
   */
  async getNotificationById(notificationId) {
    try {
      const response = await api.get(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification:', error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Success response
   */
  async markAsRead(notificationId) {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Success response
   */
  async markAllAsRead() {
    try {
      const response = await api.patch('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Mark notification as unread
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Success response
   */
  async markAsUnread(notificationId) {
    try {
      const response = await api.patch(`/notifications/${notificationId}/unread`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      throw error;
    }
  },

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Success response
   */
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Delete multiple notifications
   * @param {Array<string>} notificationIds - Array of notification IDs
   * @returns {Promise<Object>} Success response
   */
  async deleteMultiple(notificationIds) {
    try {
      const response = await api.post('/notifications/delete-multiple', {
        notificationIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  },

  /**
   * Get notification statistics
   * @returns {Promise<Object>} Notification stats
   */
  async getStats() {
    try {
      const response = await api.get('/notifications/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  },

  /**
   * Get unread count
   * @returns {Promise<number>} Unread notification count
   */
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  /**
   * Mark multiple notifications as read
   * @param {Array<string>} notificationIds - Array of notification IDs
   * @returns {Promise<Object>} Success response
   */
  async markMultipleAsRead(notificationIds) {
    try {
      const response = await api.post('/notifications/mark-multiple-read', {
        notificationIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  },
};

export default notificationService;
