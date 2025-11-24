import api from './api';

class SeriesService {
  /**
   * Fetch all series with filtering, sorting, and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.category - Filter by category
   * @param {string} params.tags - Comma-separated tags
   * @param {string} params.author - Filter by author ID
   * @param {string} params.status - Filter by status (active, completed, draft)
   * @param {string} params.visibility - Filter by visibility (public, private, premium)
   * @param {string} params.template - Filter by template type
   * @param {string} params.difficulty - Filter by difficulty (beginner, intermediate, advanced)
   * @param {string} params.sortBy - Sort field (default: createdAt)
   * @param {string} params.sortOrder - Sort order (asc, desc)
   * @param {string} params.search - Search query
   * @returns {Promise<Array>} Array of series
   */
  async getSeries(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.category) queryParams.append('category', params.category);
      if (params.tags) queryParams.append('tags', params.tags);
      if (params.author) queryParams.append('author', params.author);
      if (params.status) queryParams.append('status', params.status);
      if (params.visibility) queryParams.append('visibility', params.visibility);
      if (params.template) queryParams.append('template', params.template);
      if (params.difficulty) queryParams.append('difficulty', params.difficulty);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.search) queryParams.append('search', params.search);

      const response = await api.get(`/series?${queryParams.toString()}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch series');
      }

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching series:', error);
      throw error;
    }
  }

  /**
   * Get trending series
   * @returns {Promise<Array>} Array of trending series
   */
  async getTrendingSeries() {
    try {
      const response = await api.get('/series/trending');

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch trending series');
      }

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching trending series:', error);
      throw error;
    }
  }

  /**
   * Get series recommendations
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Array of recommended series
   */
  async getRecommendations(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.limit) queryParams.append('limit', params.limit);
      if (params.category) queryParams.append('category', params.category);
      if (params.difficulty) queryParams.append('difficulty', params.difficulty);

      const response = await api.get(`/series/recommendations?${queryParams.toString()}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch recommendations');
      }

      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  /**
   * Get a single series by ID
   * @param {string} id - Series ID
   * @returns {Promise<Object>} Series data
   */
  async getSeriesById(id) {
    try {
      const response = await api.get(`/series/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch series');
      }

      // Backend returns { series, userProgress, analytics }
      // Extract just the series data
      return response.data.data.series;
    } catch (error) {
      console.error('Error fetching series by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new series
   * @param {Object} seriesData - Series data
   * @returns {Promise<Object>} Created series
   */
  async createSeries(seriesData) {
    try {
      const response = await api.post('/series', seriesData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create series');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error creating series:', error);
      throw error;
    }
  }

  /**
   * Update a series
   * @param {string} id - Series ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated series
   */
  async updateSeries(id, updateData) {
    try {
      const response = await api.put(`/series/${id}`, updateData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update series');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error updating series:', error);
      throw error;
    }
  }

  /**
   * Delete a series
   * @param {string} id - Series ID
   * @returns {Promise<Object>} Response data
   */
  async deleteSeries(id) {
    try {
      const response = await api.delete(`/series/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete series');
      }

      return response.data;
    } catch (error) {
      console.error('Error deleting series:', error);
      throw error;
    }
  }

  /**
   * Add an episode to a series
   * @param {string} seriesId - Series ID
   * @param {Object} episodeData - Episode data
   * @returns {Promise<Object>} Created episode
   */
  async addEpisode(seriesId, episodeData) {
    try {
      const response = await api.post(`/series/${seriesId}/episodes`, episodeData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add episode');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error adding episode:', error);
      throw error;
    }
  }

  /**
   * Update an episode
   * @param {string} seriesId - Series ID
   * @param {string} episodeId - Episode ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated episode
   */
  async updateEpisode(seriesId, episodeId, updateData) {
    try {
      const response = await api.put(
        `/series/${seriesId}/episodes/${episodeId}`,
        updateData
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update episode');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error updating episode:', error);
      throw error;
    }
  }

  /**
   * Remove an episode from a series
   * @param {string} seriesId - Series ID
   * @param {string} episodeId - Episode ID
   * @returns {Promise<Object>} Response data
   */
  async removeEpisode(seriesId, episodeId) {
    try {
      const response = await api.delete(`/series/${seriesId}/episodes/${episodeId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to remove episode');
      }

      return response.data;
    } catch (error) {
      console.error('Error removing episode:', error);
      throw error;
    }
  }

  /**
   * Get user progress for a series
   * @param {string} seriesId - Series ID
   * @returns {Promise<Object>} User progress data
   */
  async getUserProgress(seriesId) {
    try {
      const response = await api.get(`/series/${seriesId}/progress`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch progress');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }

  /**
   * Update user progress for a series
   * @param {string} seriesId - Series ID
   * @param {Object} progressData - Progress data
   * @returns {Promise<Object>} Updated progress
   */
  async updateProgress(seriesId, progressData) {
    try {
      const response = await api.post(`/series/${seriesId}/progress`, progressData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update progress');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  /**
   * Get series analytics
   * @param {string} seriesId - Series ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Analytics data
   */
  async getSeriesAnalytics(seriesId, params = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.metric) queryParams.append('metric', params.metric);

      const response = await api.get(
        `/series/${seriesId}/analytics?${queryParams.toString()}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch analytics');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  /**
   * Upload series cover image to Cloudinary
   * @param {string} seriesId - Series ID
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadCoverImage(seriesId, file) {
    try {
      const formData = new FormData();
      formData.append('coverImage', file);

      console.log('🔄 Uploading series cover image to Cloudinary...', {
        seriesId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await api.post(`/series/${seriesId}/images/cover`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload cover image');
      }

      console.log('✅ Series cover image uploaded successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Series cover image upload failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload cover image');
    }
  }

  /**
   * Upload series banner image to Cloudinary
   * @param {string} seriesId - Series ID
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadBannerImage(seriesId, file) {
    try {
      const formData = new FormData();
      formData.append('bannerImage', file);

      console.log('🔄 Uploading series banner image to Cloudinary...', {
        seriesId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await api.post(`/series/${seriesId}/images/banner`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload banner image');
      }

      console.log('✅ Series banner image uploaded successfully:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Series banner image upload failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload banner image');
    }
  }

  /**
   * Delete series cover image
   * @param {string} seriesId - Series ID
   * @returns {Promise<Object>} Response data
   */
  async deleteCoverImage(seriesId) {
    try {
      console.log('🗑️ Deleting series cover image from Cloudinary...');

      const response = await api.delete(`/series/${seriesId}/images/cover`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete cover image');
      }

      console.log('✅ Series cover image deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Series cover image deletion failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete cover image');
    }
  }
  /**
   * Add a collaborator to a series
   * @param {string} seriesId - Series ID
   * @param {Object} collaboratorData - Collaborator data (userId, role, permissions)
   * @returns {Promise<Object>} Updated series
   */
  async addCollaborator(seriesId, collaboratorData) {
    try {
      const response = await api.post(`/series/${seriesId}/collaborators`, collaboratorData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add collaborator');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  }

  /**
   * Remove a collaborator from a series
   * @param {string} seriesId - Series ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<Object>} Response data
   */
  async removeCollaborator(seriesId, userId) {
    try {
      const response = await api.delete(`/series/${seriesId}/collaborators/${userId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to remove collaborator');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }
  /**
   * Invite a user to collaborate via email
   * @param {string} seriesId - Series ID
   * @param {Object} data - { email, role, permissions }
   * @returns {Promise<Object>} Response data
   */
  async inviteCollaborator(seriesId, data) {
    try {
      const response = await api.post(`/collaborations/series/${seriesId}/invite`, data);
      return response.data;
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      throw error;
    }
  }

  /**
   * Get pending invitations for a series
   * @param {string} seriesId - Series ID
   * @returns {Promise<Array>} List of invites
   */
  async getPendingInvites(seriesId) {
    try {
      const response = await api.get(`/collaborations/series/${seriesId}/invites`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      throw error;
    }
  }

  /**
   * Accept a collaboration invitation
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Response data
   */
  async acceptInvite(token) {
    try {
      const response = await api.post(`/collaborations/invites/${token}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  }

  /**
   * Reject a collaboration invitation
   * @param {string} token - Invitation token
   * @returns {Promise<Object>} Response data
   */
  async rejectInvite(token) {
    try {
      const response = await api.post(`/collaborations/invites/${token}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting invite:', error);
      throw error;
    }
  }
}

export default new SeriesService();
