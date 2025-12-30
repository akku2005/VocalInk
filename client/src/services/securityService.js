import api from './api';

class SecurityService {
  constructor() {
    this.baseURL = '/settings';
  }

  // Two-Factor Authentication
  async generate2FASecret() {
    try {
      const response = await api.post(`${this.baseURL}/2fa/enable`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to generate 2FA secret');
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw error;
    }
  }

  async enable2FA(token) {
    try {
      const response = await api.post(`${this.baseURL}/2fa/verify`, { token });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to enable 2FA');
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  async disable2FA(password) {
    try {
      const response = await api.post(`${this.baseURL}/2fa/disable`, { 
        password
      });
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to disable 2FA');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  // 2FA Recovery endpoints
  async request2FARecovery(email) {
    try {
      const response = await api.post(`${this.baseURL}/2fa/recovery/request`, { email });
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to request 2FA recovery');
    } catch (error) {
      console.error('Error requesting 2FA recovery:', error);
      throw error;
    }
  }

  async verify2FARecovery(email, recoveryCode, backupCode) {
    try {
      const response = await api.post(`${this.baseURL}/2fa/recovery/verify`, { 
        email, 
        recoveryCode, 
        backupCode 
      });
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to verify 2FA recovery');
    } catch (error) {
      console.error('Error verifying 2FA recovery:', error);
      throw error;
    }
  }

  async regenerateBackupCodes() {
    try {
      const response = await api.post(`${this.baseURL}/2fa/backup-codes/regenerate`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to regenerate backup codes');
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      throw error;
    }
  }

  async getBackupCodesStatus() {
    try {
      const response = await api.get(`${this.baseURL}/2fa/backup-codes/status`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to get backup codes status');
    } catch (error) {
      console.error('Error getting backup codes status:', error);
      throw error;
    }
  }

  // Session Management
  async getActiveSessions() {
    try {
      const response = await api.get(`${this.baseURL}/sessions`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to get active sessions');
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }

  async revokeSession(sessionId) {
    try {
      const response = await api.delete(`${this.baseURL}/sessions/${sessionId}`);
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to revoke session');
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  }

  async revokeAllSessions() {
    try {
      const response = await api.delete(`${this.baseURL}/sessions`);
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to revoke all sessions');
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      throw error;
    }
  }

  async clearLoginHistory() {
    try {
      const response = await api.delete(`${this.baseURL}/sessions/history`);
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to clear login history');
    } catch (error) {
      console.error('Error clearing login history:', error);
      throw error;
    }
  }

  // Data Export and Account Management
  async exportUserData() {
    try {
      const response = await api.get(`${this.baseURL}/export`);
      if (response.data.success) {
        // Create and download file
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `vocalink-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to export data');
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async deleteAccount(password, confirmText) {
    try {
      const response = await api.delete(`${this.baseURL}/account`, {
        data: { password, confirmationText: confirmText }
      });
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Failed to delete account');
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
}

export default new SecurityService();
