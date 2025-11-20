import api from './api';

/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */
const dashboardService = {
  /**
   * Get user dashboard data
   * @returns {Promise<Object>} Dashboard data including stats, recent activity, and analytics
   */
  async getDashboardData() {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  /**
   * Get user's recent blogs
   * @param {number} limit - Number of blogs to fetch
   * @returns {Promise<Array>} Array of recent blog objects
   */
  async getRecentBlogs(limit = 5) {
    try {
      const response = await api.get(`/dashboard/recent-blogs?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent blogs:', error);
      throw error;
    }
  },

  /**
   * Get user's analytics over time
   * @param {string} period - Time period ('7d', '30d', '90d', '1y')
   * @returns {Promise<Object>} Analytics data with time series
   */
  async getAnalytics(period = '30d') {
    try {
      const response = await api.get(`/dashboard/analytics?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  /**
   * Get user's recent activity feed
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise<Array>} Array of activity objects
   */
  async getRecentActivity(limit = 10) {
    try {
      const response = await api.get(`/dashboard/activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  },

  /**
   * Get user's top performing blogs
   * @param {number} limit - Number of blogs to fetch
   * @returns {Promise<Array>} Array of top blog objects
   */
  async getTopBlogs(limit = 5) {
    try {
      const response = await api.get(`/dashboard/top-blogs?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top blogs:', error);
      throw error;
    }
  },

  /**
   * Get user's engagement metrics
   * @returns {Promise<Object>} Engagement metrics
   */
  async getEngagementMetrics() {
    try {
      const response = await api.get('/dashboard/engagement');
      return response.data;
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
      throw error;
    }
  },

  /**
   * Get user's growth statistics
   * @param {string} period - Time period ('7d', '30d', '90d')
   * @returns {Promise<Object>} Growth statistics
   */
  async getGrowthStats(period = '30d') {
    try {
      const response = await api.get(`/dashboard/growth?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching growth stats:', error);
      throw error;
    }
  },

  async getPersonalAnalytics(period = '30d') {
    try {
      const response = await api.get(`/dashboard/personal-analytics?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching personalized analytics:', error);
      throw error;
    }
  },
};

export default dashboardService;
