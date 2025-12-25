import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import BadgeComponent from '../ui/Badge';
import { User, Globe, Bell, Eye, EyeOff, Shield } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import settingsService from '../../services/settingsService';
import logger from '../../utils/logger';

const AccountTab = ({ 
  settings, 
  setSettings, 
  loading, 
  setLoading, 
  user,
  fetchUserProfile,
  loadSettings 
}) => {
  const { showToast } = useToast();
  const account = settings?.account || {};
  const privacy = settings?.privacy || {};
  
  // Password change state
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleInputChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleToggle = (section, field) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: !prev[section]?.[field],
      },
    }));
  };

  const handleSaveAccount = async () => {
    setLoading(true);
    try {
      logger.log('Saving Account settings:', settings.account);
      
      const accountData = {
        accountVisibility: settings.account.accountVisibility,
        emailNotifications: settings.account.emailNotifications,
        pushNotifications: settings.account.pushNotifications,
        marketingEmails: settings.account.marketingEmails
      };
      
      await settingsService.updateAccountSettings(accountData);
      
      // Force refresh to get updated data
      await fetchUserProfile(true);
      await loadSettings(true);
      
      showToast('Account settings saved successfully', 'success');
    } catch (error) {
      logger.error('Error saving account settings:', error);
      showToast(error.message || 'Failed to save account settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast('New password must be at least 8 characters long', 'error');
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
      
      showToast('Password updated successfully', 'success');
    } catch (error) {
      logger.error('Error changing password:', error);
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const accountVisibilityOptions = [
    { id: "public", name: "Public" },
    { id: "private", name: "Private" },
    { id: "friends", name: "Friends Only" },
  ];

  return (
    <div className="space-y-6">
      {/* Account Status & Information */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Status & Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
              <div>
                <span className="text-sm font-medium text-text-primary">Account Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${user?.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-sm text-text-secondary">
                    {user?.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
              {!user?.isVerified && (
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/email-verification'}>
                  Verify Email
                </Button>
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
              <div>
                <span className="text-sm font-medium text-text-primary">Account Role</span>
                <div className="mt-1">
                  <BadgeComponent variant="outline" className="capitalize">
                    {user?.role || 'user'}
                  </BadgeComponent>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
              <div>
                <span className="text-sm font-medium text-text-primary">Member Since</span>
                <div className="mt-1">
                  <span className="text-sm text-text-secondary">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
              <div>
                <span className="text-sm font-medium text-text-primary">Last Login</span>
                <div className="mt-1">
                  <span className="text-sm text-text-secondary">
                    {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email & Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Email & Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">
                  Email Notifications
                </h3>
                <p className="text-sm text-text-secondary">
                  Receive email notifications for important updates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={account.emailNotifications}
                  onChange={() => handleToggle('account', 'emailNotifications')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--secondary-btn2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">
                  Push Notifications
                </h3>
                <p className="text-sm text-text-secondary">
                  Receive push notifications on your device
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={account.pushNotifications}
                  onChange={() => handleToggle('account', 'pushNotifications')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--secondary-btn2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary">
                  Marketing Emails
                </h3>
                <p className="text-sm text-text-secondary">
                  Receive promotional emails and updates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={account.marketingEmails}
                  onChange={() => handleToggle('account', 'marketingEmails')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--secondary-btn2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Visibility & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Account Visibility & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Account Visibility
            </label>
            <select
              value={privacy.profileVisibility || account.accountVisibility}
              onChange={(e) => {
                // Update both account and privacy settings to keep them in sync
                handleInputChange('account', 'accountVisibility', e.target.value);
                handleInputChange('privacy', 'profileVisibility', e.target.value);
              }}
              className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
            >
              {accountVisibilityOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-secondary mt-1">
              Control who can see your profile and posts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Password Change
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-text-secondary" />
                  ) : (
                    <Eye className="h-4 w-4 text-text-secondary" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-text-secondary" />
                  ) : (
                    <Eye className="h-4 w-4 text-text-secondary" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-text-secondary" />
                  ) : (
                    <Eye className="h-4 w-4 text-text-secondary" />
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={handlePasswordChange}
              loading={passwordLoading}
              disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full"
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSaveAccount}
          loading={loading}
          className="flex items-center gap-2 bg-primary-500 text-white hover:bg-primary-600"
        >
          <Shield className="w-4 h-4" />
          Save Account Settings
        </Button>
      </div>
    </div>
  );
};

export default AccountTab;
