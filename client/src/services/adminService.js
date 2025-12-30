import api from './api';

/**
 * Admin Service - API calls for admin dashboard
 */
const adminService = {
  /**
   * Get complete dashboard overview
   */
  getDashboardOverview: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  /**
   * Get user statistics
   */
  getUserStats: async () => {
    const response = await api.get('/admin/stats/users');
    return response.data;
  },

  /**
   * Get content statistics
   */
  getContentStats: async () => {
    const response = await api.get('/admin/stats/content');
    return response.data;
  },

  /**
   * Get engagement statistics
   */
  getEngagementStats: async () => {
    const response = await api.get('/admin/stats/engagement');
    return response.data;
  },

  /**
   * Get TTS usage statistics
   */
  getTTSStats: async () => {
    const response = await api.get('/admin/stats/tts');
    return response.data;
  },

  /**
   * Get system health metrics
   */
  getSystemHealth: async () => {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  /**
   * Get recent activity feed
   */
  getRecentActivity: async (limit = 20) => {
    const response = await api.get('/admin/activity', { params: { limit } });
    return response.data;
  },

  /**
   * Get users with pagination and filtering
   */
  getUsers: async (options = {}) => {
    const response = await api.get('/admin/users', { params: options });
    return response.data;
  },

  /**
   * Get all blogs with pagination and filtering
   */
  getBlogs: async (options = {}) => {
    const response = await api.get('/admin/blogs', { params: options });
    return response.data;
  },

  /**
   * Update user status
   */
  updateUserStatus: async (userId, updates) => {
    const response = await api.put(`/admin/users/${userId}/status`, updates);
    return response.data;
  },

  /**
   * Get moderation queue
   */
  getModerationQueue: async (options = {}) => {
    const response = await api.get('/admin/moderation', { params: options });
    return response.data;
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async (options = {}) => {
    const response = await api.get('/admin/audit-logs', { params: options });
    return response.data;
  },

  /**
   * Get analytics trends
   */
  getAnalyticsTrends: async (days = 30) => {
    const response = await api.get('/admin/analytics/trends', { params: { days } });
    return response.data;
  },

  /**
   * Delete content
   */
  deleteContent: async (type, id, reason) => {
    const response = await api.delete(`/admin/content/${type}/${id}`, {
      data: { reason }
    });
    return response.data;
  },

  /**
   * Send marketing campaign
   */
  sendMarketingCampaign: async (data) => {
    const response = await api.post('/admin/marketing/send', data);
    return response.data;
  },

  /**
   * Estimate campaign audience size
   */
  estimateCampaignAudience: async (filters) => {
    const response = await api.post('/admin/marketing/estimate', filters);
    return response.data;
  }
};

export default adminService;
