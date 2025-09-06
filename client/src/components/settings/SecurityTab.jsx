import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Activity, Shield, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import settingsService from '../../services/settingsService';

const SecurityTab = ({ 
  settings, 
  setSettings, 
  loading, 
  setLoading, 
  showToast,
  loadSettings 
}) => {
  const security = settings?.security || {};
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

  const confirmDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      await settingsService.deleteAccount({ confirmationText: deleteConfirmation });
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
                {security.activeSessions} devices
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
        <CardHeader>
          <CardTitle className="font-medium">Login History</CardTitle>
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
                      {session.location}
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
              onClick={() => {
                // TODO: Implement data export functionality
                showToast('Data export feature coming soon!', 'info');
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
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="text-error border-error hover:bg-error hover:text-white"
                    onClick={confirmDeleteAccount}
                    loading={deleteLoading}
                    disabled={deleteConfirmation !== 'DELETE'}
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
