import api from './api';

class BadgeService {
  async getBadges(params = {}) {
    const response = await api.get('/badges', { params });
    return response.data?.data || { badges: [], pagination: null };
  }

  async getBadgeStats() {
    const response = await api.get('/badges/stats');
    return response.data?.data || null;
  }

  async getUserBadgeProgress(userId) {
    const url = userId ? `/badges/user/progress/${userId}` : '/badges/user/progress';
    const response = await api.get(url);
    return response.data?.data || null;
  }
}

const badgeService = new BadgeService();
export default badgeService;
