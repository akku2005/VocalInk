import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import BadgeComponent from '../ui/Badge';
import { Shield, Eye, EyeOff, Globe, Lock, Save, Monitor, Download, AlertTriangle, X, Copy, Check, Key, RefreshCw } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import settingsService from '../../services/settingsService';
import logger from '../../utils/logger';

const PrivacyTab = ({ 
  settings, 
  setSettings, 
  loading, 
  setLoading, 
  loadSettings 
}) => {
  const { showToast } = useToast();

  const privacy = settings?.privacy || {};
  const account = settings?.account || {};
  
  // 2FA Setup State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // Active Sessions State
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Backup Codes State
  const [backupCodesStatus, setBackupCodesStatus] = useState(null);
  const [backupCodesLoading, setBackupCodesLoading] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Load active sessions on component mount
  useEffect(() => {
    loadActiveSessions();
  }, []);

  // Load backup codes status when 2FA is enabled
  useEffect(() => {
    if (account?.twoFactorEnabled) {
      loadBackupCodesStatus();
    }
  }, [account?.twoFactorEnabled]);

  const loadBackupCodesStatus = async () => {
    try {
      const status = await settingsService.getBackupCodesStatus();
      // Map backend response to expected format
      setBackupCodesStatus({
        remaining: status.unusedBackupCodes ?? status.remaining ?? 0,
        total: status.totalBackupCodes ?? status.total ?? 0,
        twoFactorEnabled: status.twoFactorEnabled
      });
    } catch (error) {
      logger.error('Error loading backup codes status:', error);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const password = prompt('Please enter your password to regenerate backup codes:');
    if (!password) return;

    setBackupCodesLoading(true);
    try {
      const result = await settingsService.regenerateBackupCodes(password);
      setNewBackupCodes(result.backupCodes || []);
      setShowBackupCodesModal(true);
      await loadBackupCodesStatus();
      showToast('Backup codes regenerated successfully', 'success');
    } catch (error) {
      logger.error('Error regenerating backup codes:', error);
      showToast(error.message || 'Failed to regenerate backup codes', 'error');
    } finally {
      setBackupCodesLoading(false);
    }
  };

  const copyBackupCodesToClipboard = async () => {
    const codesText = newBackupCodes.join('\n');
    try {
      await navigator.clipboard.writeText(codesText);
      setCopiedCodes(true);
      showToast('Backup codes copied to clipboard', 'success');
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch (error) {
      showToast('Failed to copy codes', 'error');
    }
  };

  const downloadBackupCodes = () => {
    const codesText = `VocalInk Backup Codes\n${'='.repeat(40)}\n\nStore these codes in a safe place. Each code can only be used once.\n\n${newBackupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocalink-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup codes downloaded', 'success');
  };

  const loadActiveSessions = async () => {
    setSessionsLoading(true);
    try {
      const sessions = await settingsService.getActiveSessions();
      setActiveSessions(sessions || []);
    } catch (error) {
      logger.error('Error loading active sessions:', error);
      showToast('Failed to load active sessions', 'error');
    } finally {
      setSessionsLoading(false);
    }
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

  const handleInputChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      logger.log('Saving Privacy settings:', settings.privacy);
      
      await settingsService.updatePrivacySettings(settings.privacy);
      
      // Force refresh to get updated data
      await loadSettings(true);
      
      showToast('Privacy settings saved successfully', 'success');
    } catch (error) {
      logger.error('Error saving privacy settings:', error);
      showToast(error.message || 'Failed to save privacy settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASetup = async () => {
    setLoading(true);
    try {
      const result = await settingsService.enable2FA();
      setQrCodeData(result);
      setShow2FAModal(true);
      showToast('2FA setup initiated. Please scan the QR code with your authenticator app.', 'success');
      logger.log('2FA Setup Data:', result);
    } catch (error) {
      logger.error('Error setting up 2FA:', error);
      showToast(error.message || 'Failed to setup 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showToast('Please enter a valid 6-digit verification code', 'error');
      return;
    }

    setVerifying(true);
    try {
      await settingsService.verify2FA(verificationCode);
      setShow2FAModal(false);
      setVerificationCode('');
      
      // Show backup codes if they were provided during setup
      if (qrCodeData?.backupCodes && qrCodeData.backupCodes.length > 0) {
        setNewBackupCodes(qrCodeData.backupCodes);
        setShowBackupCodesModal(true);
      }
      
      setQrCodeData(null);
      await loadSettings(true); // Refresh settings to show 2FA as enabled
      await loadBackupCodesStatus(); // Load backup codes status
      showToast('2FA enabled successfully!', 'success');
    } catch (error) {
      logger.error('Error verifying 2FA:', error);
      showToast(error.message || 'Failed to verify 2FA code', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleClose2FAModal = () => {
    setShow2FAModal(false);
    setVerificationCode('');
    setQrCodeData(null);
  };

  const handle2FADisable = async () => {
    const password = prompt('Please enter your password to disable 2FA:');
    if (!password) return;

    setLoading(true);
    try {
      await settingsService.disable2FA(password);
      await loadSettings(true); // Refresh settings
      showToast('2FA disabled successfully', 'success');
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      showToast(error.message || 'Failed to disable 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setSessionsLoading(true);
    try {
      await settingsService.revokeSession(sessionId);
      showToast(`Session revoked successfully`, 'success');
      await loadActiveSessions(); // Refresh the sessions list
    } catch (error) {
      logger.error('Error revoking session:', error);
      showToast(error.message || 'Failed to revoke session', 'error');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to sign out of all devices? You will need to sign in again.')) {
      return;
    }

    setSessionsLoading(true);
    try {
      await settingsService.revokeAllSessions();
      showToast('All sessions revoked successfully', 'success');
      await loadActiveSessions(); // Refresh the sessions list
    } catch (error) {
      logger.error('Error revoking all sessions:', error);
      showToast(error.message || 'Failed to revoke all sessions', 'error');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      await settingsService.exportUserData();
      showToast('Data export completed successfully', 'success');
    } catch (error) {
      logger.error('Error exporting data:', error);
      showToast(error.message || 'Failed to export data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText !== 'DELETE') {
      showToast('Account deletion cancelled', 'info');
      return;
    }

    const password = prompt('Please enter your password to confirm:');
    if (!password) return;

    setLoading(true);
    try {
      await settingsService.deleteAccount(password, confirmText);
      showToast('Account deleted successfully', 'success');
      // In a real implementation, you'd redirect to login or home page
    } catch (error) {
      logger.error('Error deleting account:', error);
      showToast(error.message || 'Failed to delete account', 'error');
    } finally {
      setLoading(false);
    }
  };

  const privacyVisibilityOptions = [
    { id: "public", name: "Public" },
    { id: "private", name: "Private" },
    { id: "friends", name: "Friends Only" },
  ];

  const privacyFields = [
    {
      key: 'profileVisibility',
      label: 'Profile Visibility',
      description: 'Control who can see your profile',
      type: 'select',
    },
    {
      key: 'postVisibility',
      label: 'Post Visibility',
      description: 'Control who can see your posts',
      type: 'select',
    },
    {
      key: 'allowSearch',
      label: 'Allow Search',
      description: 'Allow others to find you in search',
      type: 'toggle',
    },
    {
      key: 'showOnlineStatus',
      label: 'Show Online Status',
      description: 'Show when you are online',
      type: 'toggle',
    },
    {
      key: 'allowDirectMessages',
      label: 'Allow Direct Messages',
      description: 'Allow others to send you messages',
      type: 'toggle',
    },
    {
      key: 'dataSharing',
      label: 'Data Sharing',
      description: 'Share data for research purposes',
      type: 'toggle',
    },
    {
      key: 'analyticsSharing',
      label: 'Analytics Sharing',
      description: 'Share analytics data',
      type: 'toggle',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium">
            Privacy Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            {privacyFields.map((field) => (
              <div key={field.key} className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-text-primary capitalize">
                    {field.label}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {field.description}
                  </p>
                </div>
                {field.type === 'toggle' ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacy[field.key]}
                      onChange={() => handleToggle('privacy', field.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--secondary-btn2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                ) : (
                  <select
                    value={
                      (field.key === 'profileVisibility' || field.key === 'postVisibility')
                        ? (account?.accountVisibility || privacy[field.key] || 'public')
                        : privacy[field.key]
                    }
                    onChange={(e) => {
                      if (field.key === 'profileVisibility' || field.key === 'postVisibility') {
                        handleInputChange('privacy', field.key, e.target.value);
                        handleInputChange('account', 'accountVisibility', e.target.value);
                      } else {
                        handleInputChange('privacy', field.key, e.target.value);
                      }
                    }}
                    className="w-36 p-2 border border-border rounded-lg bg-background text-text-primary"
                  >
                    {privacyVisibilityOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium text-text-primary">
                  Two-Factor Authentication
                </h3>
                {account?.twoFactorEnabled ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-700">Active</span>
                    </div>
                    <BadgeComponent className="bg-green-100 text-green-800 hover:bg-green-100">
                      <Shield className="w-3 h-3 mr-1" />
                      Secured
                    </BadgeComponent>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-xs font-medium text-amber-700">Inactive</span>
                    </div>
                    <BadgeComponent variant="outline" className="text-amber-600 border-amber-200">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Recommended
                    </BadgeComponent>
                  </div>
                )}
              </div>
              
              {account?.twoFactorEnabled ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-700 font-medium">
                    Your account is protected with 2FA
                  </p>
                  <p className="text-xs text-text-secondary">
                    Enhanced security is active. You'll need your authenticator app to sign in.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Security Level: High</span>
                    </div>
                    <span>•</span>
                    <span>Last verified: Active session</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-amber-700 font-medium">
                    Enable 2FA for enhanced security
                  </p>
                  <p className="text-xs text-text-secondary">
                    Add an extra layer of protection to prevent unauthorized access to your account.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                      <span>Security Level: Standard</span>
                    </div>
                    <span>•</span>
                    <span>Recommended for all users</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                variant={account?.twoFactorEnabled ? "outline" : "default"}
                size="sm"
                onClick={() => account?.twoFactorEnabled ? handle2FADisable() : handle2FASetup()}
                className={account?.twoFactorEnabled ? 
                  "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" : 
                  "bg-green-600 hover:bg-green-700 text-white"
                }
              >
                {account?.twoFactorEnabled ? (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Disable
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-1" />
                    Enable 2FA
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Backup Codes Section - Only show when 2FA is enabled */}
          {account?.twoFactorEnabled && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-text-secondary" />
                    <h3 className="font-medium text-text-primary">
                      Backup Codes
                    </h3>
                    {backupCodesStatus && (
                      <BadgeComponent 
                        className={backupCodesStatus.remaining > 3 
                          ? "bg-green-100 text-green-800" 
                          : backupCodesStatus.remaining > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                        }
                      >
                        {backupCodesStatus.remaining}/{backupCodesStatus.total} remaining
                      </BadgeComponent>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">
                    Use backup codes to access your account if you lose your authenticator device.
                    Each code can only be used once.
                  </p>
                  {backupCodesStatus?.remaining === 0 && (
                    <p className="text-sm text-error mt-2">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      All backup codes have been used. Generate new codes now.
                    </p>
                  )}
                  {backupCodesStatus?.remaining > 0 && backupCodesStatus?.remaining <= 3 && (
                    <p className="text-sm text-amber-600 mt-2">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      You're running low on backup codes. Consider regenerating them.
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateBackupCodes}
                  disabled={backupCodesLoading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${backupCodesLoading ? 'animate-spin' : ''}`} />
                  {backupCodesLoading ? 'Regenerating...' : 'Regenerate Codes'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Codes Modal */}
      {showBackupCodesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-text-primary">Your New Backup Codes</h2>
                </div>
                <button
                  onClick={() => setShowBackupCodesModal(false)}
                  className="p-1 hover:bg-secondary-btn-hover rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Save these codes now
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      These codes will not be shown again. Store them in a safe place.
                      Each code can only be used once.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {newBackupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-2 bg-secondary rounded-lg text-center font-mono text-sm text-text-primary border border-border"
                  >
                    {code}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={copyBackupCodesToClipboard}
                >
                  {copiedCodes ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy All
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={downloadBackupCodes}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
              
              <Button
                className="w-full mt-4"
                onClick={() => setShowBackupCodesModal(false)}
              >
                I've saved my codes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">
              Manage devices that are currently signed in to your account
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAllSessions}
            >
              Sign out all devices
            </Button>
          </div>
          
          {sessionsLoading ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                <span className="text-sm text-text-secondary">Loading sessions...</span>
              </div>
            </div>
          ) : activeSessions.length > 0 ? (
            <div className="space-y-3">
              {activeSessions.map((session, index) => (
                <div key={session.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {session.device || 'Unknown Device'} - {session.browser || 'Unknown Browser'}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {typeof session.location === 'object' 
                          ? `${session.location.city || 'Unknown'}, ${session.location.region || 'Unknown'}, ${session.location.country || 'Unknown'}`
                          : session.location || 'Unknown Location'
                        } • Last active: {session.lastActivity ? new Date(session.lastActivity).toLocaleDateString() : 'Unknown'}
                        {session.isCurrent && ' • Current session'}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={sessionsLoading}
                    >
                      Sign out
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">
              No active sessions found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Data & Account Management */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader className="pb-4">
          <CardTitle className="font-semibold flex items-center gap-3 text-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            Data & Account Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <div className="space-y-6">
            {/* Export Data Section */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 rounded-xl hover:border-blue-200 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center border border-blue-200">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary text-base mb-1">
                    Export Your Data
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Download a copy of all your data including blogs, comments, profile information, and activity history in JSON format.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-blue-600 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Includes all personal data</span>
                    </div>
                    <span className="text-blue-300">•</span>
                    <span>GDPR compliant</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <Button
                  variant="default"
                  onClick={handleExportData}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 min-w-[120px]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
            
            {/* Separator */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
            </div>

            {/* Delete Account Section */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50/80 to-rose-50/80 border border-red-100 rounded-xl hover:border-red-200 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-200 rounded-xl flex items-center justify-center border border-red-200">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-600 text-base mb-1">
                    Delete Account
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Permanently delete your account and all associated data. This action cannot be undone and will remove all your content.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-red-600 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span>Irreversible action</span>
                    </div>
                    <span className="text-red-300">•</span>
                    <span>All data will be lost</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all duration-200 min-w-[120px]"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSave}
          loading={loading}
          className="flex items-center gap-2 bg-primary-500 text-white hover:bg-primary-600"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && qrCodeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Setup Two-Factor Authentication</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose2FAModal}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-text-secondary mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center mb-4">
                  <img 
                    src={qrCodeData.qrCode} 
                    alt="2FA QR Code" 
                    className="border rounded-lg"
                  />
                </div>
                <p className="text-xs text-text-secondary mb-4">
                  Can't scan? Enter this code manually: <br />
                  <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                    {qrCodeData.secret}
                  </code>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Enter verification code from your authenticator app:
                </label>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose2FAModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerify2FA}
                  loading={verifying}
                  disabled={verificationCode.length !== 6}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Verify & Enable
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyTab;
