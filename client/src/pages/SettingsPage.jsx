import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Mail, 
  Key, 
  Trash2,
  Save,
  Eye,
  EyeOff,
  Camera,
  X,
  Check,
  AlertTriangle,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSettings({
        profile: {
          username: 'johndoe',
          displayName: 'John Doe',
          email: 'john@example.com',
          bio: 'Passionate writer and tech enthusiast. Creating content that inspires and educates.',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          location: 'San Francisco, CA',
          website: 'https://johndoe.dev',
          language: 'en',
          timezone: 'America/Los_Angeles'
        },
        account: {
          emailNotifications: true,
          marketingEmails: false,
          twoFactorAuth: false,
          accountVisibility: 'public',
          showEmail: false,
          allowComments: true,
          allowMentions: true
        },
        notifications: {
          newFollowers: true,
          newLikes: true,
          newComments: true,
          newMentions: true,
          badgeEarned: true,
          levelUp: true,
          seriesUpdates: true,
          aiGenerations: false,
          weeklyDigest: true,
          monthlyReport: true
        },
        privacy: {
          profileVisibility: 'public',
          postVisibility: 'public',
          allowSearch: true,
          showOnlineStatus: true,
          allowDirectMessages: true,
          dataSharing: false,
          analyticsSharing: true
        },
        appearance: {
          theme: 'system',
          fontSize: 'medium',
          compactMode: false,
          showAnimations: true,
          colorScheme: 'default'
        },
        security: {
          lastPasswordChange: '2023-12-01',
          lastLogin: '2024-01-15T10:30:00Z',
          activeSessions: 2,
          loginHistory: [
            { date: '2024-01-15T10:30:00Z', location: 'San Francisco, CA', device: 'Chrome on Mac' },
            { date: '2024-01-14T15:20:00Z', location: 'San Francisco, CA', device: 'Safari on iPhone' },
            { date: '2024-01-10T09:15:00Z', location: 'New York, NY', device: 'Chrome on Windows' }
          ]
        }
      });
    }, 1000);
  }, []);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'account', name: 'Account', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'security', name: 'Security', icon: Key }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
  ];

  const timezones = [
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' }
  ];

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleToggle = (section, field) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field]
      }
    }));
  };

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="md:col-span-3 h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary">Manage your account preferences and privacy</p>
        </div>
        <Button onClick={handleSave} loading={loading} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-600 border border-primary-200'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img 
                      src={settings.profile.avatar} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full"
                    />
                    <button className="absolute -bottom-1 -right-1 p-1 bg-primary-500 text-white rounded-full hover:bg-primary-600 cursor-pointer">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Profile Picture</h3>
                    <p className="text-sm text-text-secondary">Upload a new profile picture</p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Display Name
                    </label>
                    <Input
                      value={settings.profile.displayName}
                      onChange={(e) => handleInputChange('profile', 'displayName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Username
                    </label>
                    <Input
                      value={settings.profile.username}
                      onChange={(e) => handleInputChange('profile', 'username', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Location
                    </label>
                    <Input
                      value={settings.profile.location}
                      onChange={(e) => handleInputChange('profile', 'location', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Website
                    </label>
                    <Input
                      value={settings.profile.website}
                      onChange={(e) => handleInputChange('profile', 'website', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Language
                    </label>
                    <select
                      value={settings.profile.language}
                      onChange={(e) => handleInputChange('profile', 'language', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Bio
                  </label>
                  <textarea
                    value={settings.profile.bio}
                    onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-border rounded-lg bg-background text-text-primary resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-text-primary">Email Notifications</h3>
                        <p className="text-sm text-text-secondary">Receive email notifications for important updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.account.emailNotifications}
                          onChange={() => handleToggle('account', 'emailNotifications')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-text-primary">Marketing Emails</h3>
                        <p className="text-sm text-text-secondary">Receive promotional emails and updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.account.marketingEmails}
                          onChange={() => handleToggle('account', 'marketingEmails')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-text-primary">Two-Factor Authentication</h3>
                        <p className="text-sm text-text-secondary">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.account.twoFactorAuth}
                          onChange={() => handleToggle('account', 'twoFactorAuth')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Account Visibility
                    </label>
                    <select
                      value={settings.account.accountVisibility}
                      onChange={(e) => handleInputChange('account', 'accountVisibility', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="friends">Friends Only</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button variant="outline">Update Password</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(settings.notifications).map(([key, value]) => (
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
                          onChange={() => handleToggle('notifications', key)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  {Object.entries(settings.privacy).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-text-primary capitalize">
                          {key === 'profileVisibility' && 'Profile Visibility'}
                          {key === 'postVisibility' && 'Post Visibility'}
                          {key === 'allowSearch' && 'Allow Search'}
                          {key === 'showOnlineStatus' && 'Show Online Status'}
                          {key === 'allowDirectMessages' && 'Allow Direct Messages'}
                          {key === 'dataSharing' && 'Data Sharing'}
                          {key === 'analyticsSharing' && 'Analytics Sharing'}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {key === 'profileVisibility' && 'Control who can see your profile'}
                          {key === 'postVisibility' && 'Control who can see your posts'}
                          {key === 'allowSearch' && 'Allow others to find you in search'}
                          {key === 'showOnlineStatus' && 'Show when you are online'}
                          {key === 'allowDirectMessages' && 'Allow others to send you messages'}
                          {key === 'dataSharing' && 'Share data for research purposes'}
                          {key === 'analyticsSharing' && 'Share analytics data'}
                        </p>
                      </div>
                      {typeof value === 'boolean' ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => handleToggle('privacy', key)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                      ) : (
                        <select
                          value={value}
                          onChange={(e) => handleInputChange('privacy', key, e.target.value)}
                          className="p-2 border border-border rounded-lg bg-background text-text-primary"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="friends">Friends Only</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => handleInputChange('appearance', 'theme', theme.value)}
                          className={`p-4 border-2 rounded-lg transition-all duration-200 flex flex-col items-center gap-2 cursor-pointer ${
                            settings.appearance.theme === theme.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-border hover:border-primary-200'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Font Size
                  </label>
                  <select
                    value={settings.appearance.fontSize}
                    onChange={(e) => handleInputChange('appearance', 'fontSize', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">Compact Mode</h3>
                      <p className="text-sm text-text-secondary">Use less space for content</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.appearance.compactMode}
                        onChange={() => handleToggle('appearance', 'compactMode')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">Show Animations</h3>
                      <p className="text-sm text-text-secondary">Enable smooth animations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.appearance.showAnimations}
                        onChange={() => handleToggle('appearance', 'showAnimations')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">Last Password Change</div>
                      <div className="font-medium text-text-primary">
                        {new Date(settings.security.lastPasswordChange).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">Last Login</div>
                      <div className="font-medium text-text-primary">
                        {new Date(settings.security.lastLogin).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">Active Sessions</div>
                      <div className="font-medium text-text-primary">
                        {settings.security.activeSessions} devices
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Login History</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {settings.security.loginHistory.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <div className="font-medium text-text-primary">{session.device}</div>
                          <div className="text-sm text-text-secondary">{session.location}</div>
                        </div>
                        <div className="text-sm text-text-secondary">
                          {new Date(session.date).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-error">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-error">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">Delete Account</h3>
                      <p className="text-sm text-text-secondary">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button variant="outline" className="text-error border-error hover:bg-error hover:text-white">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 