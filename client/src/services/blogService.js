import api from './api';

/**
 * Blog Service
 * Handles all blog-related API calls
 */

// Store AbortControllers for ongoing TTS requests
const ttsAbortControllers = new Map();

const blogService = {
  /**
   * Get all blogs with optional filters
   * @param {Object} params - Query parameters (page, limit, status, mood, tags, author, seriesId, sort, order)
   * @returns {Promise<Array>} Array of blog objects
   */
  async getBlogs(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add all parameters to query string
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = queryString ? `/blogs/getBlogs?${queryString}` : '/blogs/getBlogs';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw error;
    }
  },

  /**
   * Get blogs with filters (alternative endpoint)
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Array of blog objects
   */
  async getBlogsWithFilters(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });
      
      const queryString = queryParams.toString();
      const url = queryString ? `/blogs/tag?${queryString}` : '/blogs/tag';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching blogs with filters:', error);
      throw error;
    }
  },

  /**
   * Get a single blog by ID
   * @param {string} id - Blog ID
   * @returns {Promise<Object>} Blog object
   */
  async getBlogById(id) {
    try {
      const response = await api.get(`/blogs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching blog by ID:', error);
      throw error;
    }
  },

  /**
   * Get a single blog by slug
   * @param {string} slug - Blog slug
   * @returns {Promise<Object>} Blog object
   */
  async getBlogBySlug(slug) {
    try {
      const response = await api.get(`/blogs/slug/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching blog by slug:', error);
      throw error;
    }
  },

  /**
   * Create a new blog
   * @param {Object} blogData - Blog data
   * @returns {Promise<Object>} Created blog object
   */
  async createBlog(blogData) {
    try {
      const response = await api.post('/blogs/addBlog', blogData);
      return response.data;
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  },

  /**
   * Update a blog
   * @param {string} id - Blog ID
   * @param {Object} blogData - Updated blog data
   * @returns {Promise<Object>} Updated blog object
   */
  async updateBlog(id, blogData) {
    try {
      const response = await api.put(`/blogs/${id}`, blogData);
      return response.data;
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  },

  /**
   * Delete a blog
   * @param {string} id - Blog ID
   * @returns {Promise<Object>} Success message
   */
  async deleteBlog(id) {
    try {
      const response = await api.delete(`/blogs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting blog:', error);
      throw error;
    }
  },

  /**
   * Publish a blog
   * @param {string} id - Blog ID
   * @returns {Promise<Object>} Success message
   */
  async publishBlog(id) {
    try {
      const response = await api.put(`/blogs/${id}/publish`);
      return response.data;
    } catch (error) {
      console.error('Error publishing blog:', error);
      throw error;
    }
  },

  /**
   * Like/Unlike a blog
   * @param {string} id - Blog ID
   * @returns {Promise<Object>} Updated like status
   */
  async likeBlog(id) {
    try {
      const response = await api.post(`/blogs/${id}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking blog:', error);
      throw error;
    }
  },

  /**
   * Bookmark/Unbookmark a blog
   * @param {string} id - Blog ID
   * @returns {Promise<Object>} Updated bookmark status
   */
  async bookmarkBlog(id) {
    try {
      const response = await api.post(`/blogs/${id}/bookmark`);
      return response.data;
    } catch (error) {
      console.error('Error bookmarking blog:', error);
      throw error;
    }
  },

  /**
   * Get blog comments
   * @param {string} id - Blog ID
   * @returns {Promise<Array>} Array of comment objects
   */
  async getBlogComments(id) {
    try {
      const response = await api.get(`/blogs/${id}/comments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching blog comments:', error);
      throw error;
    }
  },

  /**
   * Add a comment to a blog
   * @param {string} id - Blog ID
   * @param {Object} commentData - Comment data (content, parentId)
   * @returns {Promise<Object>} Created comment object
   */
  async addBlogComment(id, commentData) {
    try {
      const response = await api.post(`/blogs/${id}/comments`, commentData);
      return response.data;
    } catch (error) {
      console.error('Error adding blog comment:', error);
      throw error;
    }
  },

  /**
   * Like/Unlike a comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} Updated comment object
   */
  async likeComment(commentId) {
    try {
      const response = await api.post(`/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  },

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} Success message
   */
  async deleteComment(commentId) {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  /**
   * Generate TTS for a blog
   * @param {string} id - Blog ID
   * @param {Object} ttsOptions - TTS options
   * @returns {Promise<Object>} TTS result with URL and jobId for cancellation
   */
  async generateTTS(id, ttsOptions = {}) {
    try {
      // Create an AbortController for this request
      const controller = new AbortController();
      ttsAbortControllers.set(id, controller);

      const response = await api.post(`/blogs/${id}/tts`, ttsOptions, {
        signal: controller.signal
      });
      
      // Store jobId for potential cancellation
      const jobId = response.data?.jobId || response.data?.result?.jobId;
      if (jobId) {
        ttsAbortControllers.set(`${id}-job-${jobId}`, controller);
      }

      return response.data;
    } catch (error) {
      // Remove controller on error
      ttsAbortControllers.delete(id);
      
      // Check if error was due to abort
      if (error.name === 'AbortError') {
        console.log('TTS generation cancelled');
        throw new Error('TTS generation was cancelled');
      }
      
      console.error('Error generating TTS:', error);
      throw error;
    } finally {
      // Clean up after a delay to allow UI updates
      setTimeout(() => {
        ttsAbortControllers.delete(id);
      }, 500);
    }
  },

  /**
   * Cancel ongoing TTS generation
   * @param {string} id - Blog ID
   * @param {string} jobId - Optional job ID for server-side cancellation
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelTTSGeneration(id, jobId = null) {
    try {
      // Abort the client-side request
      const controller = ttsAbortControllers.get(id);
      if (controller) {
        controller.abort();
        ttsAbortControllers.delete(id);
      }

      // Also cancel on server if jobId is available
      if (jobId) {
        try {
          const response = await api.post(`/blogs/${id}/tts/cancel/${jobId}`);
          return response.data;
        } catch (error) {
          console.error('Error cancelling job on server:', error);
          // Don't throw - client-side abort is still valid
        }
      }

      return { success: true, message: 'TTS generation cancelled' };
    } catch (error) {
      console.error('Error cancelling TTS:', error);
      throw error;
    }
  },

  /**
   * Get TTS job status
   * @param {string} id - Blog ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job status
   */
  async getTTSJobStatus(id, jobId) {
    try {
      const response = await api.get(`/blogs/${id}/tts/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting TTS job status:', error);
      throw error;
    }
  },

  /**
   * Translate a blog
   * @param {string} id - Blog ID
   * @param {string} targetLang - Target language code
   * @returns {Promise<Object>} Translation result
   */
  async translateBlog(id, targetLang) {
    try {
      const response = await api.post(`/blogs/${id}/translate`, { targetLang });
      return response.data;
    } catch (error) {
      console.error('Error translating blog:', error);
      throw error;
    }
  },

  /**
   * Regenerate blog summary
   * @param {string} id - Blog ID
   * @param {Object} options - Summary options (maxLength, style)
   * @returns {Promise<Object>} New summary
   */
  async regenerateSummary(id, options = {}) {
    try {
      const response = await api.post(`/blogs/${id}/summary`, options);
      return response.data;
    } catch (error) {
      console.error('Error regenerating summary:', error);
      throw error;
    }
  },
};

export default blogService;
