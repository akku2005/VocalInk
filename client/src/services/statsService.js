import api from './api';

/**
 * Stats Service
 * Handles all statistics-related API calls
 */
const statsService = {
  /**
   * Get platform-wide statistics
   * @returns {Promise<Object>} Platform statistics
   */
  async getPlatformStats() {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      throw error;
    }
  },

  /**
   * Get detailed analytics
   * @param {string} timeframe - Timeframe for analytics (7d, 30d, 90d, 1y)
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(timeframe = '30d') {
    try {
      const response = await api.get(`/stats/analytics?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },
};

export default statsService;
