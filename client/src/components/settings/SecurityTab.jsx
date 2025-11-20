import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Activity, Shield, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import settingsService from '../../services/settingsService';
import securityService from '../../services/securityService';
import locationService from '../../services/locationService';

const SecurityTab = ({ 
  settings, 
  setSettings, 
  loading, 
  setLoading, 
  loadSettings 
}) => {
  const security = settings?.security || {};
  const { showToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [pendingSignOutAll, setPendingSignOutAll] = useState(false);
  const [pendingRevokeSessionId, setPendingRevokeSessionId] = useState(null);
  const [pendingClearHistory, setPendingClearHistory] = useState(false);
  const revokeTimerRef = useRef(null);
  const signOutTimerRef = useRef(null);
  const clearHistoryTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      [revokeTimerRef, signOutTimerRef, clearHistoryTimerRef].forEach((ref) => {
        if (ref.current) {
          clearTimeout(ref.current);
        }
      });
    };
  }, []);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  const normalizedSessions = Array.isArray(activeSessions) ? activeSessions : [];
  const totalActiveSessions = normalizedSessions.length || security.activeSessions || 0;
  const otherSessionsCount = normalizedSessions.filter((session) => !session.isCurrent).length;

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [field]: value,
      },
    }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await settingsService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      showToast('Password changed successfully', 'success');
    } catch (error) {
      console.error('Error changing password:', error);
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSecuritySave = async () => {
    setLoading(true);
    try {
      await settingsService.updateSecurity({
        loginNotifications: security.loginNotifications,
        suspiciousActivityAlerts: security.suspiciousActivityAlerts,
        autoLogout: security.autoLogout
      });
      
      await loadSettings(true);
      showToast('Security settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving security settings:', error);
      showToast(error.message || 'Failed to save security settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isSameLocation = (a, b) => {
    if (!a || !b) return false;
    const normalize = (value) => (value ? value.toString().trim().toLowerCase() : '');
    const fields = ['city', 'region', 'country', 'countryCode'];
    return fields.every((field) => normalize(a[field]) === normalize(b[field]));
  };

  const loadActiveSessions = async () => {
    setSessionsLoading(true);
    try {
      await locationService.captureLocation();
      const sessions = await securityService.getActiveSessions();
      setActiveSessions(Array.isArray(sessions) ? sessions : sessions?.sessions || []);
    } catch (error) {
      console.error('Error loading active sessions:', error);
    showToast(error.message || 'Failed to load active sessions', 'error');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (session) => {
    if (session.isCurrent) {
      showToast('This is your current session.', 'info');
      return;
    }
    if (pendingRevokeSessionId !== session.id) {
      setPendingRevokeSessionId(session.id);
      showToast('Tap again to confirm sign out of this device', 'warning');
      clearTimeout(revokeTimerRef.current);
      revokeTimerRef.current = setTimeout(() => setPendingRevokeSessionId(null), 5000);
      return;
    }
    clearTimeout(revokeTimerRef.current);
    setPendingRevokeSessionId(null);
    setSessionsLoading(true);
    try {
      await securityService.revokeSession(session.id);
      showToast(`Signed out ${session.device}`, 'success');
      await loadActiveSessions();
    } catch (error) {
      console.error('Error revoking session:', error);
      showToast(error.message || 'Failed to sign out this device', 'error');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    const otherSessions = normalizedSessions.filter((session) => !session.isCurrent);
    if (otherSessions.length === 0) {
      showToast('No other devices found.', 'info');
      return;
    }
    const currentSession = normalizedSessions.find((session) => session.isCurrent) || {};
    const shareLocation = otherSessions.some((session) => isSameLocation(session.location, currentSession.location));
    const shareDevice = otherSessions.some((session) => session.device === currentSession.device && session.browser === currentSession.browser);
    if (!pendingSignOutAll) {
      setPendingSignOutAll(true);
      let message = 'Tap again to confirm signing out of all other devices.';
      if (shareDevice) {
        message = 'Another session matches this device—tap again to sign out everywhere.';
      } else if (shareLocation) {
        message = 'Other sessions share your location—tap again to sign out everywhere.';
      }
      showToast(message, 'warning');
      clearTimeout(signOutTimerRef.current);
      signOutTimerRef.current = setTimeout(() => setPendingSignOutAll(false), 5000);
      return;
    }
    clearTimeout(signOutTimerRef.current);
    setPendingSignOutAll(false);
    setSessionsLoading(true);
    try {
      await securityService.revokeAllSessions();
      showToast('Signed out of all other devices', 'success');
      await loadActiveSessions();
    } catch (error) {
      console.error('Error signing out of all devices:', error);
      showToast(error.message || 'Failed to sign out of all devices', 'error');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleClearLoginHistory = async () => {
    if (!security.loginHistory || security.loginHistory.length === 0) {
      showToast('No login history to clear', 'info');
      return;
    }

    if (!pendingClearHistory) {
      setPendingClearHistory(true);
      showToast('Tap again to confirm clearing login history', 'warning');
      clearTimeout(clearHistoryTimerRef.current);
      clearHistoryTimerRef.current = setTimeout(() => setPendingClearHistory(false), 5000);
      return;
    }

    clearTimeout(clearHistoryTimerRef.current);
    setPendingClearHistory(false);
    setClearingHistory(true);
    try {
      await settingsService.clearLoginHistory();
      showToast('Login history cleared', 'success');
      await loadSettings(true);
      await loadActiveSessions();
    } catch (error) {
      console.error('Error clearing login history:', error);
      showToast(error.message || 'Failed to clear login history', 'error');
    } finally {
      setClearingHistory(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      await settingsService.deleteAccount(passwordData.currentPassword, deleteConfirmation);
      showToast('Account deleted successfully', 'success');
      // Redirect to home or logout
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast(error.message || 'Failed to delete account', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatLocation = (location, fallbackIP) => {
    if (!location) return 'Unknown location';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location !== null) {
      const city = typeof location.city === 'string' ? location.city.trim() : '';
      const region = typeof location.region === 'string' ? location.region.trim() : '';
      const country = typeof location.country === 'string' ? location.country.trim() : '';
      const countryCode = typeof location.countryCode === 'string' ? location.countryCode.trim() : '';

      const parts = [];
      if (city) parts.push(city);
      if (region) parts.push(region);

      if (country) {
        const countryLabel = countryCode && countryCode !== country ? `${country} (${countryCode})` : country;
        parts.push(countryLabel);
      } else if (countryCode) {
        parts.push(countryCode);
      }

      return parts.length ? parts.join(', ') : (fallbackIP ? `IP: ${fallbackIP}` : 'Location details unavailable');
    }
    return fallbackIP ? `IP: ${fallbackIP}` : 'Invalid location data';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-medium">
            Security Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-[var(--border-color)] rounded-lg">
              <div className="text-sm text-text-secondary mb-1">
                Last Password Change
              </div>
              <div className="font-medium text-text-primary">
                {security.lastPasswordChange ? new Date(security.lastPasswordChange).toLocaleDateString() : 'Never'}
              </div>
            </div>
            <div className="p-4 border border-[var(--border-color)] rounded-lg">
              <div className="text-sm text-text-secondary mb-1">
                Last Login
              </div>
              <div className="font-medium text-text-primary">
                {security.lastLogin ? new Date(security.lastLogin).toLocaleString() : 'Never'}
              </div>
            </div>
            <div className="p-4 border border-[var(--border-color)] rounded-lg">
              <div className="text-sm text-text-secondary mb-1">
                Active Sessions
              </div>
              <div className="font-medium text-text-primary">
                {totalActiveSessions} devices
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Password Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">Change Password</h3>
                <p className="text-sm text-text-secondary">Update your account password</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordForm(true)}
              >
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({currentPassword: '', newPassword: '', confirmPassword: ''});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  loading={passwordLoading}
                  disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  Update Password
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">Login Notifications</h3>
                <p className="text-sm text-text-secondary">Get notified when someone logs into your account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.loginNotifications}
                  onChange={(e) => handleInputChange('loginNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">Suspicious Activity Alerts</h3>
                <p className="text-sm text-text-secondary">Get alerts for unusual account activity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.suspiciousActivityAlerts}
                  onChange={(e) => handleInputChange('suspiciousActivityAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">Auto Logout</h3>
                <p className="text-sm text-text-secondary">Automatically log out after period of inactivity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.autoLogout}
                  onChange={(e) => handleInputChange('autoLogout', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button
              onClick={handleSecuritySave}
              loading={loading}
              className="w-full"
            >
              Save Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-medium">
              Active Sessions
            </CardTitle>
            <p className="text-sm text-text-secondary">
              Manage devices that are currently signed into your account.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOutAll}
            loading={sessionsLoading}
            disabled={sessionsLoading || otherSessionsCount === 0}
            className="whitespace-nowrap"
          >
            Sign out all devices
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {sessionsLoading ? (
            <div className="text-sm text-text-secondary">Loading active sessions...</div>
          ) : normalizedSessions.length === 0 ? (
            <div className="text-sm text-text-secondary">No active sessions found.</div>
          ) : (
            normalizedSessions.map((session) => (
              <div
                key={session.id}
                className="border border-border rounded-lg p-4 bg-secondary-50"
              >
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <div className="font-medium text-text-primary">{session.device}</div>
                  {session.isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                      Current session
                    </span>
                  )}
                </div>
                <div className="text-sm text-text-secondary">{session.browser}</div>
                <div className="text-sm text-text-secondary">
                  {formatLocation(session.location, session.ip)}
                </div>
                <div className="text-xs text-text-secondary flex flex-wrap gap-4 mt-2">
                  <span>Last active: {session.lastActivity ? new Date(session.lastActivity).toLocaleString() : 'Unknown'}</span>
                  <span>IP: {session.ip || 'Unknown IP'}</span>
                </div>
                {!session.isCurrent && (
                  <div className="flex justify-end mt-3">
                    <Button
                      variant="outline"
                      onClick={() => handleRevokeSession(session)}
                      disabled={sessionsLoading}
                      className="text-xs px-3 py-1"
                    >
                      Sign out
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-medium">Login History</CardTitle>
            <p className="text-sm text-text-secondary">View and manage your previous sign-in attempts.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearLoginHistory}
            loading={clearingHistory}
            disabled={clearingHistory || !(security.loginHistory?.length)}
          >
            Clear history
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {security.loginHistory && security.loginHistory.length > 0 ? (
              security.loginHistory.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium text-text-primary">
                      {session.device}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {formatLocation(session.location, session.ip)}
                    </div>
                  </div>
                  <div className="text-sm text-text-secondary">
                    {new Date(session.date).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No login history available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium">Data Export</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-medium text-text-primary mb-2">Export Your Data</h3>
            <p className="text-sm text-text-secondary mb-4">
              Download a copy of your personal data including profile information, posts, and activity history.
            </p>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={async () => {
                try {
                  await settingsService.exportUserData();
                  showToast('Data export started. Check your downloads.', 'success');
                } catch (error) {
                  showToast(error.message || 'Failed to export data', 'error');
                }
              }}
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-error font-medium">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">
                Delete Account
              </h3>
              <p className="text-sm text-text-secondary">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button 
              variant="outline" 
              className="text-error border-error hover:bg-error hover:text-white"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>

          {showDeleteConfirm && (
            <div className="p-4 border border-error rounded-lg bg-error-50">
              <h4 className="font-medium text-error mb-2">Confirm Account Deletion</h4>
              <p className="text-sm text-error mb-3">
                This action cannot be undone. All your data, including blogs, comments, and achievements will be permanently deleted.
              </p>
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({...prev, currentPassword: e.target.value}))}
                />
                <Input
                  placeholder="Type 'DELETE' to confirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmation('');
                      setPasswordData(prev => ({...prev, currentPassword: ''}));
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="text-error border-error hover:bg-error hover:text-white"
                    onClick={confirmDeleteAccount}
                    loading={deleteLoading}
                    disabled={deleteConfirmation !== 'DELETE' || !passwordData.currentPassword}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Permanently Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTab;
