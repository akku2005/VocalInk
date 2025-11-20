const UAParser = require('ua-parser-js');
const axios = require('axios');
const { validateLocation } = require('../utils/secureParser');

class SessionManager {
  /**
   * Parse user agent string to extract device, browser, and OS information
   */
  static parseUserAgent(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    return {
      device: this.getDeviceType(result),
      browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
      os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
      deviceModel: result.device.model || null,
      deviceVendor: result.device.vendor || null
    };
  }

  /**
   * Determine device type from parsed user agent
   */
  static getDeviceType(parsedUA) {
    if (parsedUA.device.type === 'mobile') return 'Mobile Phone';
    if (parsedUA.device.type === 'tablet') return 'Tablet';
    if (parsedUA.device.type === 'smarttv') return 'Smart TV';
    if (parsedUA.device.type === 'wearable') return 'Wearable';
    if (parsedUA.device.type === 'console') return 'Gaming Console';
    
    // Desktop/laptop detection
    if (parsedUA.os.name) {
      if (parsedUA.os.name.includes('Windows')) return 'Windows PC';
      if (parsedUA.os.name.includes('Mac')) return 'Mac';
      if (parsedUA.os.name.includes('Linux')) return 'Linux PC';
      if (parsedUA.os.name.includes('Chrome')) return 'Chromebook';
    }
    
    return 'Desktop Computer';
  }

  /**
   * Get geolocation data from IP address
   */
  static async getLocationFromIP(ip) {
    try {
      // Skip geolocation for local/private IPs
      if (this.isLocalIP(ip)) {
        return {
          city: 'Local Network',
          region: 'Development',
          country: 'Local',
          countryCode: 'LC',
          latitude: null,
          longitude: null
        };
      }

      // Use ipapi.co for geolocation (free tier: 1000 requests/day)
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'VocalInk-SessionManager/1.0'
        }
      });

      const data = response.data;
      
      if (data.error) {
        throw new Error(data.reason || 'Geolocation API error');
      }

      return {
        city: data.city || 'Unknown City',
        region: data.region || 'Unknown Region',
        country: data.country_name || 'Unknown Country',
        countryCode: data.country_code || 'UN',
        latitude: data.latitude || null,
        longitude: data.longitude || null
      };
    } catch (error) {
      console.warn('Geolocation lookup failed:', error.message);
      
      // Fallback location data
      return {
        city: 'Unknown Location',
        region: 'Unknown Region',
        country: 'Unknown Country',
        countryCode: 'UN',
        latitude: null,
        longitude: null
      };
    }
  }

  /**
   * Check if IP is local/private
   */
  static isLocalIP(ip) {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
      return true;
    }
    
    // Check for private IP ranges
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^fc00:/,
      /^fe80:/
    ];
    
    return privateRanges.some(range => range.test(ip));
  }

  static getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const first = forwarded.split(',')[0].trim();
      if (first) {
        return first;
      }
    }
    return req.headers['x-real-ip'] || req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
  }

  static async reverseGeocodeCoordinates(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return {};
    }

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          format: 'jsonv2',
          lat: latitude,
          lon: longitude,
          zoom: 10,
          addressdetails: 1
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'VocalInk-SessionManager/1.0'
        }
      });

      const address = response.data?.address || {};
      return {
        city: address.city || address.town || address.village || address.hamlet || '',
        region: address.state || address.region || address.county || '',
        country: address.country || '',
        countryCode: address.country_code ? address.country_code.toUpperCase() : ''
      };
    } catch (error) {
      console.warn('Reverse geocoding failed:', error.message);
      return {};
    }
  }

  static async buildLocationFromCoords(coords) {
    const base = {
      city: coords.city || '',
      region: coords.region || '',
      country: coords.country || '',
      countryCode: coords.countryCode || '',
      latitude: coords.latitude ?? null,
      longitude: coords.longitude ?? null
    };

    if ((!base.city || !base.country) && base.latitude !== null && base.longitude !== null) {
      const geo = await this.reverseGeocodeCoordinates(base.latitude, base.longitude);
      return {
        ...base,
        ...geo,
        latitude: base.latitude,
        longitude: base.longitude
      };
    }

    return base;
  }

  static async resolveLocation(req) {
    const headerPayload = validateLocation(req.headers['x-user-location']);

    if (headerPayload) {
      const normalized = await this.buildLocationFromCoords(headerPayload);
      if (normalized.city || normalized.region || normalized.country) {
        return normalized;
      }
      if (normalized.latitude && normalized.longitude) {
        return normalized;
      }
    }

    const ip = this.getClientIP(req);
    return this.getLocationFromIP(ip);
  }

  /**
   * Generate unique session ID
   */
  static generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `sess_${timestamp}_${randomStr}`;
  }

  /**
   * Create session data object
   */
  static async createSessionData(req) {
    const userAgent = req.headers['user-agent'] || '';
    const ip = this.getClientIP(req);
    
    // Parse user agent
    const deviceInfo = this.parseUserAgent(userAgent);
    
    // Get location data
    const location = await this.resolveLocation(req);
    
    // Generate session ID
    const sessionId = this.generateSessionId();
    
    return {
      sessionId,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ip: ip,
      userAgent: userAgent,
      location: location,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };
  }

  /**
   * Add session to user's active sessions
   */
  static async addSession(user, sessionData) {
    try {
      // Remove any existing sessions with the same IP/device (optional)
      user.activeSessions = user.activeSessions.filter(session => 
        !(session.ip === sessionData.ip && session.device === sessionData.device)
      );
      
      // Add new session
      user.activeSessions.push(sessionData);
      
      // Keep only last 10 sessions to prevent bloat
      if (user.activeSessions.length > 10) {
        user.activeSessions = user.activeSessions
          .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
          .slice(0, 10);
      }
      
      // Add to login history
      user.loginHistory.push({
        device: sessionData.device,
        browser: sessionData.browser,
        os: sessionData.os,
        location: sessionData.location,
        date: new Date(),
        ip: sessionData.ip,
        userAgent: sessionData.userAgent,
        success: true
      });
      
      // Keep only last 50 login history entries
      if (user.loginHistory.length > 50) {
        user.loginHistory = user.loginHistory
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 50);
      }
      
      // Update last login
      user.lastLoginAt = new Date();
      
      await user.save();
      
      return sessionData.sessionId;
    } catch (error) {
      console.error('Error adding session:', error);
      throw error;
    }
  }

  /**
   * Update session activity
   */
  static async updateSessionActivity(user, sessionId) {
    try {
      const session = user.activeSessions.find(s => s.sessionId === sessionId);
      if (session) {
        session.lastActivity = new Date();
        user.lastActiveAt = new Date();
        await user.save();
      }
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Remove session
   */
  static async removeSession(user, sessionId) {
    try {
      user.activeSessions = user.activeSessions.filter(s => s.sessionId !== sessionId);
      await user.save();
      return true;
    } catch (error) {
      console.error('Error removing session:', error);
      return false;
    }
  }

  /**
   * Remove all sessions except current
   */
  static async removeAllSessions(user, currentSessionId = null) {
    try {
      if (currentSessionId) {
        user.activeSessions = user.activeSessions.filter(s => s.sessionId === currentSessionId);
      } else {
        user.activeSessions = [];
      }
      await user.save();
      return true;
    } catch (error) {
      console.error('Error removing all sessions:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions (older than 30 days)
   */
  static async cleanupExpiredSessions(user) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      user.activeSessions = user.activeSessions.filter(session => 
        new Date(session.lastActivity) > thirtyDaysAgo
      );
      
      await user.save();
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}

module.exports = SessionManager;
