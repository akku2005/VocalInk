import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Bell, Mail, Smartphone, Save } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import settingsService from '../../services/settingsService';

const NotificationsTab = ({ 
  settings, 
  setSettings, 
  loading, 
  setLoading, 
  loadSettings 
}) => {
  const { showToast } = useToast();
  const notifications = settings?.notifications || {};

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
      console.log('Saving Notification settings:', settings.notifications);
      
      await settingsService.updateNotificationsSection(settings.notifications);
      
      // Force refresh to get updated data
      await loadSettings(true);
      
      showToast('Notification settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showToast(error.message || 'Failed to save notification settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-medium">Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-text-primary capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h3>
                <p className="text-sm text-text-secondary">
                  {key === 'newFollowers' && 'When someone follows you'}
                  {key === 'newLikes' && 'When someone likes your post'}
                  {key === 'newComments' && 'When someone comments on your post'}
                  {key === 'newMentions' && 'When someone mentions you'}
                  {key === 'badgeEarned' && 'When you earn a new badge'}
                  {key === 'levelUp' && 'When you level up'}
                  {key === 'seriesUpdates' && 'When your series gets updated'}
                  {key === 'aiGenerations' && 'When AI generation completes'}
                  {key === 'weeklyDigest' && 'Weekly summary of your activity'}
                  {key === 'monthlyReport' && 'Monthly performance report'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleToggle("notifications", key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--secondary-btn2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          ))}
        </div>

        {/* Notification Frequency */}
        <div className="border-t pt-6">
          <h3 className="font-medium text-text-primary mb-4">Notification Frequency</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Digest Frequency
              </label>
              <select
                value={notifications.emailDigestFrequency || 'weekly'}
                onChange={(e) => handleInputChange('notifications', 'emailDigestFrequency', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Push Notification Time
              </label>
              <select
                value={notifications.pushNotificationTime || 'immediate'}
                onChange={(e) => handleInputChange('notifications', 'pushNotificationTime', e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            loading={loading}
            className="flex items-center gap-2 bg-primary-500 text-white hover:bg-primary-600"
          >
            <Save className="w-4 h-4" />
            Save Notification Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;
