import api from './api';

class UserService {
  constructor() {
    this.baseURL = '/users';
  }

  // Get current user's detailed profile
  async getMyProfile() {
    try {
      const response = await api.get(`${this.baseURL}/me`);
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to get profile');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to get profile');
        throw customError;
      }
      
      throw error;
    }
  }

  // Get user profile by ID
  async getUserProfile(userId) {
    try {
      const response = await api.get(`${this.baseURL}/${userId}`);
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to get user profile');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to get user profile');
        throw customError;
      }
      
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.patch(`${this.baseURL}/me`, profileData);
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to update profile');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to update profile');
        throw customError;
      }
      
      throw error;
    }
  }

  // Get user blogs
  async getUserBlogs(userId) {
    try {
      const response = await api.get(`${this.baseURL}/${userId}/blogs`);
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to get user blogs');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to get user blogs');
        throw customError;
      }
      
      throw error;
    }
  }

  // Get user badges
  async getUserBadges(userId) {
    try {
      const response = await api.get(`${this.baseURL}/${userId}/badges`);
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to get user badges');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to get user badges');
        throw customError;
      }
      
      throw error;
    }
  }

  // Follow user
  async followUser(targetUserId) {
    try {
      const response = await api.post(`${this.baseURL}/${targetUserId}/follow`);
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to follow user');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to follow user');
        throw customError;
      }
      
      throw error;
    }
  }

  // Unfollow user
  async unfollowUser(targetUserId) {
    try {
      const response = await api.delete(`${this.baseURL}/${targetUserId}/follow`);
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to unfollow user');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to unfollow user');
        throw customError;
      }
      
      throw error;
    }
  }

  // Search users
  async searchUsers(query) {
    try {
      const response = await api.get(`${this.baseURL}/search`, {
        params: { q: query }
      });
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to search users');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to search users');
        throw customError;
      }
      
      throw error;
    }
  }

  // Get liked blogs for user
  async getUserLikedBlogs(userId, options = {}) {
    try {
      const response = await api.get(`${this.baseURL}/${userId}/likes`, {
        params: options,
      });

      if (response.data.success) {
        return response.data;
      }

      throw new Error(response.data.message || 'Failed to get liked posts');
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const customError = new Error(error.response.data.message || 'Failed to get liked posts');
        throw customError;
      }
      throw error;
    }
  }

  // Get bookmarked blogs for user
  async getUserBookmarkedBlogs(userId, options = {}) {
    try {
      const response = await api.get(`${this.baseURL}/${userId}/bookmarks`, {
        params: options,
      });

      if (response.data.success) {
        return response.data;
      }

      throw new Error(response.data.message || 'Failed to get bookmarked posts');
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const customError = new Error(error.response.data.message || 'Failed to get bookmarked posts');
        throw customError;
      }
      throw error;
    }
  }

  async checkUsernameAvailability(username) {
    try {
      const response = await api.get(`${this.baseURL}/username/availability`, {
        params: { username }
      });

      if (response.data.success) {
        return response.data;
      }

      throw new Error(response.data.message || 'Failed to check username availability');
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to check username availability');
        throw customError;
      }

      throw error;
    }
  }

  // Get leaderboard
  async getLeaderboard() {
    try {
      const response = await api.get(`${this.baseURL}/leaderboard`);
      
      // Check if the response indicates success or failure
      if (response.data.success) {
        return response.data.data;
      } else {
        // Backend returned success: false in the response body
        const error = new Error(response.data.message || 'Failed to get leaderboard');
        throw error;
      }
    } catch (error) {
      // If it's an HTTP error with specific error data, handle it
      if (error.response && error.response.data && !error.response.data.success) {
        const errorData = error.response.data;
        const customError = new Error(errorData.message || 'Failed to get leaderboard');
        throw customError;
      }
      
      throw error;
    }
  }

  // Get user series
  async getUserSeries(userId) {
    try {
      const response = await api.get(`${this.baseURL}/${userId}/series`);
      
      if (response.data.success) {
        return response.data.data.series;  // Extract series array
      } else {
        throw new Error(response.data.message || 'Failed to get user series');
      }
    } catch (error) {
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;
