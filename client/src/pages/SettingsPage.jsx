 buttons-color/hover
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import CustomDropdown from "../components/ui/CustomDropdown";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Key,

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../components/context/ThemeContext';
import { useToast } from '../hooks/useToast';
import settingsService from '../services/settingsService';
import imageService from '../services/imageService';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Mail, 
  Key, 
master
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
  Monitor,
 buttons-color/hover
} from "lucide-react";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");

  Brain,
  Mic,
  Volume2,
  Languages
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
 master
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);

  useEffect(() => {
 buttons-color/hover
    // Simulate API call
    setTimeout(() => {
      setSettings({
        profile: {
          username: "johndoe",
          displayName: "John Doe",
          email: "john@example.com",
          bio: "Passionate writer and tech enthusiast. Creating content that inspires and educates.",
          avatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          location: "San Francisco, CA",
          website: "https://johndoe.dev",
          language: "en",
          timezone: "America/Los_Angeles",
        },
        account: {
          emailNotifications: true,
          marketingEmails: false,
          twoFactorAuth: false,
          accountVisibility: "public",
          showEmail: false,
          allowComments: true,
          allowMentions: true,
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
          monthlyReport: true,
        },
        privacy: {
          profileVisibility: "public",
          postVisibility: "public",
          allowSearch: true,
          showOnlineStatus: true,
          allowDirectMessages: true,
          dataSharing: false,
          analyticsSharing: true,
        },
        appearance: {
          theme: "system",
          fontSize: "medium",
          compactMode: false,
          showAnimations: true,
          colorScheme: "default",
        },
        security: {
          lastPasswordChange: "2023-12-01",
          lastLogin: "2024-01-15T10:30:00Z",
          activeSessions: 2,
          loginHistory: [
            {
              date: "2024-01-15T10:30:00Z",
              location: "San Francisco, CA",
              device: "Chrome on Mac",
            },
            {
              date: "2024-01-14T15:20:00Z",
              location: "San Francisco, CA",
              device: "Safari on iPhone",
            },
            {
              date: "2024-01-10T09:15:00Z",
              location: "New York, NY",
              device: "Chrome on Windows",
            },
          ],
        },
      });
    }, 1000);
  }, []);
  const accountVisibilityOptions = [
    { id: "public", name: "Public" },
    { id: "private", name: "Private" },
    { id: "friends", name: "Friends Only" },
  ];

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "account", name: "Account", icon: User },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "privacy", name: "Privacy & Security", icon: Shield },
    { id: "appearance", name: "Appearance", icon: Palette },
    { id: "security", name: "Security", icon: Key },
  ];
  const fontSizeOptions = [
    { id: "small", name: "Small" },
    { id: "medium", name: "Medium" },
    { id: "large", name: "Large" },

    const loadSettings = async () => {
      try {
        setLoading(true);
        const userSettings = await settingsService.getUserSettings();
        setSettings(userSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadSettings();
    }
  }, [user, showToast]);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'account', name: 'Account', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'ai', name: 'AI Preferences', icon: Brain },
    { id: 'gamification', name: 'Gamification', icon: Badge },
    { id: 'security', name: 'Security', icon: Key }
 master
  ];

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
  ];
  const languageOptions = languages.map((lang) => ({
    id: lang.code,
    name: `${lang.flag} ${lang.name}`,
  }));

 buttons-color/hover
  const timezones = [
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Australia/Sydney", label: "Sydney (AEDT)" },
  ];


 master

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  const privacyVisibilityOptions = [
    { id: "public", name: "Public" },
    { id: "private", name: "Private" },
    { id: "friends", name: "Friends Only" },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
 buttons-color/hover
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Settings saved:", settings);
    } catch (error) {
      console.error("Error saving settings:", error);

      // Transform frontend settings to backend format
      const backendData = settingsService.transformFrontendToBackend(settings);
      
      // Update profile settings
      await settingsService.updateProfileSettings(backendData);
      
      // Update gamification settings if changed
      if (settings.gamification) {
        await settingsService.updateGamificationSettings(settings.gamification);
      }
      
      // Update AI preferences if changed
      if (settings.ai) {
        await settingsService.updateAIPreferences(settings.ai);
      }
      
      showToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(error.message || 'Failed to save settings', 'error');
 master
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleToggle = (section, field) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field],
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
      
      showToast('Password changed successfully', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      await settingsService.deleteAccount(deleteConfirmation);
      showToast('Account deleted successfully', 'success');
      // Redirect to home page or logout
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast(error.message || 'Failed to delete account', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setProcessingImage(true);
      
      // Convert image to base64 with compression
      const base64Image = await imageService.convertImageToBase64WithCompression(file);
      
      // Update the profile with the base64 image
      handleInputChange('profile', 'avatar', base64Image);
      
      showToast('Profile photo updated successfully', 'success');
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Error processing profile photo:', error);
      showToast(error.message || 'Failed to process profile photo', 'error');
    } finally {
      setProcessingImage(false);
    }
  };

  const removeProfilePhoto = () => {
    handleInputChange('profile', 'avatar', null);
    showToast('Profile photo removed', 'info');
  };

  const handleCoverImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setProcessingImage(true);
      
      // Convert image to base64 with compression
      const base64Image = await imageService.convertImageToBase64WithCompression(file);
      
      // Update the profile with the base64 image
      handleInputChange('profile', 'coverImage', base64Image);
      
      showToast('Cover image updated successfully', 'success');
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Error processing cover image:', error);
      showToast(error.message || 'Failed to process cover image', 'error');
    } finally {
      setProcessingImage(false);
    }
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

  // Ensure all profile fields exist to prevent undefined errors
  const profile = settings.profile || {};
  const account = settings.account || {};
  const notifications = settings.notifications || {};
  const privacy = settings.privacy || {};
  const appearance = settings.appearance || {};
  const gamification = settings.gamification || {};
  const ai = settings.ai || {};
  const security = settings.security || {};

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary">
            Manage your account preferences and privacy
          </p>
        </div>
        <Button
          onClick={handleSave}
          loading={loading}
          className="flex items-center gap-2 bg-[var(--secondary-btn2)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover2)] "
        >
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
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-primary-50 text-primary-600 border border-primary-200"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface"
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
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="font-semibold text-[var(--light-text-color2)]">
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
 buttons-color/hover
                    <img
                      src={settings.profile.avatar}
                      alt="Profile"
                      className="w-20 h-20 rounded-full"

                    {profile.avatar ? (
                                          <img 
                      src={profile.avatar} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    ) : null}
                    <div 
                      className={`w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center ${profile.avatar ? 'hidden' : 'flex'}`}
                    >
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                      type="file"
                      id="profile-photo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoUpload}
 master
                    />
                    
                    <button 
                      className="absolute -bottom-1 -right-1 p-1 bg-primary-500 text-white rounded-full hover:bg-primary-600 cursor-pointer"
                      onClick={() => document.getElementById('profile-photo-upload').click()}
                      disabled={processingImage}
                    >
                      {processingImage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div>
 buttons-color/hover
                    <h3 className="font-semibold text-text-primary text-[var(--light-text-color2)]">
                      Profile Picture
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Upload a new profile picture
                    </p>

                    <h3 className="font-semibold text-text-primary">Profile Picture</h3>
                    <p className="text-sm text-text-secondary">
                      {processingImage ? 'Processing image...' : 'Click the camera icon to change your profile picture'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {profile.avatar && (
                        <button
                          type="button"
                          onClick={removeProfilePhoto}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          Remove Photo
                        </button>
                      )}
                      {profile.avatar && profile.avatar.startsWith('data:image/') && (
                        <span className="text-xs text-text-secondary self-center">
                          Base64 image stored
                        </span>
                      )}
                    </div>
 master
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Display Name
                    </label>
                    <Input
 buttons-color/hover
                      value={settings.profile.displayName}
                      className="border border-[var(--border-color)]"
                      onChange={(e) =>
                        handleInputChange(
                          "profile",
                          "displayName",
                          e.target.value
                        )
                      }

                      value={profile.displayName}
                      onChange={(e) => handleInputChange('profile', 'displayName', e.target.value)}
 master
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Username
                    </label>
                    <Input
buttons-color/hover
                      value={settings.profile.username}
                      className="border border-[var(--border-color)]"
                      onChange={(e) =>
                        handleInputChange("profile", "username", e.target.value)
                      }

                      value={profile.username}
                      onChange={(e) => handleInputChange('profile', 'username', e.target.value)}
 master
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
 buttons-color/hover
                      value={settings.profile.email}
                      className="border border-[var(--border-color)]"
                      onChange={(e) =>
                        handleInputChange("profile", "email", e.target.value)
                      }

                      value={profile.email}
                      onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
master
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Location
                    </label>
                    <Input
buttons-color/hover
                      value={settings.profile.location}
                      className="border border-[var(--border-color)]"
                      onChange={(e) =>
                        handleInputChange("profile", "location", e.target.value)
                      }

                      value={profile.location}
                      onChange={(e) => handleInputChange('profile', 'location', e.target.value)}
 master
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Website
                    </label>
                    <Input
 buttons-color/hover
                      value={settings.profile.website}
                      className="border border-[var(--border-color)]"
                      onChange={(e) =>
                        handleInputChange("profile", "website", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <CustomDropdown
                      label="Language"
                      value={settings.profile.language}
                      onChange={(val) =>
                        handleInputChange("profile", "language", val)
                      }
                      options={languageOptions}
                      optionLabelKey="name"
                      optionValueKey="id"
                      placeholder="Select a language"
                      className="w-full"
                    />

                      value={profile.website}
                      onChange={(e) => handleInputChange('profile', 'website', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Company
                    </label>
                    <Input
                      value={profile.company}
                      onChange={(e) => handleInputChange('profile', 'company', e.target.value)}
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Job Title
                    </label>
                    <Input
                      value={profile.jobTitle}
                      onChange={(e) => handleInputChange('profile', 'jobTitle', e.target.value)}
                      placeholder="Your job title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      LinkedIn
                    </label>
                    <Input
                      value={profile.linkedin}
                      onChange={(e) => handleInputChange('profile', 'linkedin', e.target.value)}
                      placeholder="LinkedIn profile URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Gender
                    </label>
                    <select
                      value={profile.gender || ''}
                      onChange={(e) => handleInputChange('profile', 'gender', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Occupation
                    </label>
                    <Input
                      value={profile.occupation}
                      onChange={(e) => handleInputChange('profile', 'occupation', e.target.value)}
                      placeholder="Your occupation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Nationality
                    </label>
                    <Input
                      value={profile.nationality}
                      onChange={(e) => handleInputChange('profile', 'nationality', e.target.value)}
                      placeholder="Your nationality"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Mobile
                    </label>
                    <Input
                      value={profile.mobile}
                      onChange={(e) => handleInputChange('profile', 'mobile', e.target.value)}
                      placeholder="Your mobile number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Date of Birth
                    </label>
                    <Input
                      type="date"
                      value={profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('profile', 'dob', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Language
                    </label>
                    <select
                      value={profile.language}
                      onChange={(e) => handleInputChange('profile', 'language', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
 master
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Bio
                  </label>
                  <textarea
 buttons-color/hover
                    value={settings.profile.bio}
                    onChange={(e) =>
                      handleInputChange("profile", "bio", e.target.value)
                    }

                    value={profile.bio}
                    onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
 master
                    rows={4}
                    className="w-full p-3 border border-[var(--border-color)] rounded-lg bg-background text-text-primary resize-none"
                  />
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Cover Image
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('cover-image-upload').click()}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                      disabled={processingImage}
                    >
                      {processingImage ? 'Processing...' : 'Choose Cover Image'}
                    </button>
                    {profile.coverImage && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('profile', 'coverImage', null)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {/* Hidden file input for cover image */}
                  <input
                    type="file"
                    id="cover-image-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverImageUpload}
                  />
                  
                  {profile.coverImage && (
                    <div className="mt-2 relative">
                      <img 
                        src={profile.coverImage} 
                        alt="Cover preview" 
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange('profile', 'coverImage', null)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {profile.coverImage.startsWith('data:image/') && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Base64 image stored
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Social Links
                  </label>
                  <div className="space-y-3">
                    {profile.socialLinks && profile.socialLinks.length > 0 ? (
                      profile.socialLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <select
                            value={link.platform}
                            onChange={(e) => {
                              const newLinks = [...profile.socialLinks];
                              newLinks[index].platform = e.target.value;
                              handleInputChange('profile', 'socialLinks', newLinks);
                            }}
                            className="w-32 p-2 border border-border rounded-lg bg-background text-text-primary"
                          >
                            <option value="twitter">Twitter</option>
                            <option value="github">GitHub</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="youtube">YouTube</option>
                            <option value="website">Website</option>
                          </select>
                          <Input
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...profile.socialLinks];
                              newLinks[index].url = e.target.value;
                              handleInputChange('profile', 'socialLinks', newLinks);
                            }}
                            placeholder="URL"
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newLinks = profile.socialLinks.filter((_, i) => i !== index);
                              handleInputChange('profile', 'socialLinks', newLinks);
                            }}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-text-secondary">No social links added yet.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newLinks = [...(profile.socialLinks || []), { platform: 'twitter', url: '' }];
                        handleInputChange('profile', 'socialLinks', newLinks);
                      }}
                      className="text-sm text-primary-500 hover:text-primary-700"
                    >
                      + Add Social Link
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-medium">
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
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
 buttons-color/hover
                          checked={settings.account.emailNotifications}
                          onChange={() =>
                            handleToggle("account", "emailNotifications")
                          }

                          checked={account.emailNotifications}
                          onChange={() => handleToggle('account', 'emailNotifications')}
master
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
 buttons-color/hover
                          checked={settings.account.marketingEmails}
                          onChange={() =>
                            handleToggle("account", "marketingEmails")
                          }

                          checked={account.marketingEmails}
                          onChange={() => handleToggle('account', 'marketingEmails')}
 master
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--secondary-btn2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-text-primary">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
 buttons-color/hover
                          checked={settings.account.twoFactorAuth}
                          onChange={() =>
                            handleToggle("account", "twoFactorAuth")
                          }

                          checked={account.twoFactorAuth}
                          onChange={() => handleToggle('account', 'twoFactorAuth')}
 master
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--secondary-btn2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>

                  <div>
 buttons-color/hover
                    <CustomDropdown
                      label="Account Visibility"
                      value={settings.account.accountVisibility}
                      onChange={(val) =>
                        handleInputChange("account", "accountVisibility", val)
                      }
                      options={accountVisibilityOptions}
                      optionLabelKey="name"
                      optionValueKey="id"
                      placeholder="Select visibility"
                      className="w-full"
                    />

                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Account Visibility
                    </label>
                    <select
                      value={account.accountVisibility}
                      onChange={(e) => handleInputChange('account', 'accountVisibility', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="friends">Friends Only</option>
                    </select>
 master
                  </div>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-medium">Change Password</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter current password"
 buttons-color/hover
                        className="border border-[var(--border-color)]"

                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
 master
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
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
                        placeholder="Enter new password"
 buttons-color/hover
                        className="border border-[var(--border-color)]"
                value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
 master
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
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
                        className="border border-[var(--border-color)]"
                        placeholder="Confirm new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handlePasswordChange}
                    loading={passwordLoading}
                    disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="font-medium">
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 buttons-color/hover
                  {Object.entries(settings.notifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <h3 className="font-medium text-text-primary capitalize">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {key === "newFollowers" &&
                              "When someone follows you"}
                            {key === "newLikes" &&
                              "When someone likes your post"}
                            {key === "newComments" &&
                              "When someone comments on your post"}
                            {key === "newMentions" &&
                              "When someone mentions you"}
                            {key === "badgeEarned" &&
                              "When you earn a new badge"}
                            {key === "levelUp" && "When you level up"}
                            {key === "seriesUpdates" &&
                              "When your series gets updated"}
                            {key === "aiGenerations" &&
                              "When AI generation completes"}
                            {key === "weeklyDigest" &&
                              "Weekly summary of your activity"}
                            {key === "monthlyReport" &&
                              "Monthly performance report"}
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
 master
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <Card>
              <CardHeader>
                <CardTitle className="font-medium">
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
 buttons-color/hover
                  {Object.entries(settings.privacy).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >

                  {Object.entries(privacy).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
 master
                      <div>
                        <h3 className="font-medium text-text-primary capitalize">
                          {key === "profileVisibility" && "Profile Visibility"}
                          {key === "postVisibility" && "Post Visibility"}
                          {key === "allowSearch" && "Allow Search"}
                          {key === "showOnlineStatus" && "Show Online Status"}
                          {key === "allowDirectMessages" &&
                            "Allow Direct Messages"}
                          {key === "dataSharing" && "Data Sharing"}
                          {key === "analyticsSharing" && "Analytics Sharing"}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {key === "profileVisibility" &&
                            "Control who can see your profile"}
                          {key === "postVisibility" &&
                            "Control who can see your posts"}
                          {key === "allowSearch" &&
                            "Allow others to find you in search"}
                          {key === "showOnlineStatus" &&
                            "Show when you are online"}
                          {key === "allowDirectMessages" &&
                            "Allow others to send you messages"}
                          {key === "dataSharing" &&
                            "Share data for research purposes"}
                          {key === "analyticsSharing" && "Share analytics data"}
                        </p>
                      </div>
                      {typeof value === "boolean" ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => handleToggle("privacy", key)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-[var(--secondary-btn2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                      ) : (
                        <CustomDropdown
                          value={value}
                          onChange={(val) =>
                            handleInputChange("privacy", key, val)
                          }
                          options={privacyVisibilityOptions}
                          optionLabelKey="name"
                          optionValueKey="id"
                          placeholder="Select visibility"
                          className="w-36"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <Card>
              <CardHeader>
                <CardTitle className="font-medium">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((themeOption) => {
                      const Icon = themeOption.icon;
                      return (
                        <button
 buttons-color/hover
                          key={theme.value}
                          onClick={() =>
                            handleInputChange(
                              "appearance",
                              "theme",
                              theme.value
                            )
                          }
                          className={`p-4 border-2 border-[var(--border-color)] rounded-lg transition-all duration-200 flex flex-col items-center gap-2 cursor-pointer ${
                            settings.appearance.theme === theme.value
                              ? "border-primary-500 bg-primary-50"
                              : "border-border hover:border-primary-200"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">
                            {theme.label}
                          </span>

                          key={themeOption.value}
                          onClick={() => {
                            if (themeOption.value === 'system') {
                              toggleTheme();
                            } else {
                              handleInputChange('appearance', 'theme', themeOption.value);
                            }
                          }}
                          className={`p-4 border-2 rounded-lg transition-all duration-200 flex flex-col items-center gap-2 cursor-pointer ${
                            theme === themeOption.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-border hover:border-primary-200'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{themeOption.label}</span>
 master
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
 buttons-color/hover
                  <CustomDropdown
                    label="Font Size"
                    value={settings.appearance.fontSize}
                    onChange={(val) =>
                      handleInputChange("appearance", "fontSize", val)
                    }
                    options={fontSizeOptions}
                    optionLabelKey="name"
                    optionValueKey="id"
                    placeholder="Select font size"
                    className="w-36"
                  />

                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Font Size
                  </label>
                                      <select
                      value={appearance.fontSize}
                      onChange={(e) => handleInputChange('appearance', 'fontSize', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
master
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">
                        Compact Mode
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Use less space for content
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
 buttons-color/hover
                      <input
                        type="checkbox"
                        checked={settings.appearance.compactMode}
                        onChange={() =>
                          handleToggle("appearance", "compactMode")
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[var(--secondary-btn2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>

                                              <input
                          type="checkbox"
                          checked={appearance.compactMode}
                          onChange={() => handleToggle('appearance', 'compactMode')}
                          className="sr-only peer"
                        />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
 master
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">
                        Show Animations
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Enable smooth animations
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
 buttons-color/hover
                      <input
                        type="checkbox"
                        checked={settings.appearance.showAnimations}
                        onChange={() =>
                          handleToggle("appearance", "showAnimations")
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[var(--secondary-btn2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>

                                              <input
                          type="checkbox"
                          checked={appearance.showAnimations}
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

          {/* AI Preferences Tab */}
          {activeTab === 'ai' && (
            <Card>
              <CardHeader>
                <CardTitle>AI Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Preferred Voice
                  </label>
                                      <select
                      value={ai?.preferredVoice || 'default'}
                      onChange={(e) => handleInputChange('ai', 'preferredVoice', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                    <option value="default">Default</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Language
                  </label>
                                      <select
                      value={ai?.language || 'en'}
                      onChange={(e) => handleInputChange('ai', 'language', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">Auto Summarize</h3>
                      <p className="text-sm text-text-secondary">Automatically generate summaries for your content</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                                              <input
                          type="checkbox"
                          checked={ai?.autoSummarize !== false}
                          onChange={() => handleToggle('ai', 'autoSummarize')}
                          className="sr-only peer"
                        />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">Speech to Text</h3>
                      <p className="text-sm text-text-secondary">Enable voice input for content creation</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                                              <input
                          type="checkbox"
                          checked={ai?.speechToText || false}
                          onChange={() => handleToggle('ai', 'speechToText')}
                          className="sr-only peer"
                        />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gamification Tab */}
          {activeTab === 'gamification' && (
            <Card>
              <CardHeader>
                <CardTitle>Gamification Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">Show XP</h3>
                      <p className="text-sm text-text-secondary">Display your experience points</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                                              <input
                          type="checkbox"
                          checked={gamification?.showXP !== false}
                          onChange={() => handleToggle('gamification', 'showXP')}
                          className="sr-only peer"
                        />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">Show Level</h3>
                      <p className="text-sm text-text-secondary">Display your current level</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                                              <input
                          type="checkbox"
                          checked={gamification?.showLevel !== false}
                          onChange={() => handleToggle('gamification', 'showLevel')}
                          className="sr-only peer"
                        />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">Show Badges</h3>
                      <p className="text-sm text-text-secondary">Display your earned badges</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                                              <input
                          type="checkbox"
                          checked={gamification?.showBadges !== false}
                          onChange={() => handleToggle('gamification', 'showBadges')}
                          className="sr-only peer"
                        />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">Show Leaderboard</h3>
                      <p className="text-sm text-text-secondary">Display leaderboard rankings</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                                              <input
                          type="checkbox"
                          checked={gamification?.showLeaderboard !== false}
                          onChange={() => handleToggle('gamification', 'showLeaderboard')}
                          className="sr-only peer"
                        />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">Gamification Notifications</h3>
                      <p className="text-sm text-text-secondary">Receive notifications for achievements</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                                              <input
                          type="checkbox"
                          checked={gamification?.notifications !== false}
                          onChange={() => handleToggle('gamification', 'notifications')}
                          className="sr-only peer"
                        />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
 master
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
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
 buttons-color/hover
                        {new Date(
                          settings.security.lastPasswordChange
                        ).toLocaleDateString()}

                        {new Date(security.lastPasswordChange).toLocaleDateString()}
 master
                      </div>
                    </div>
                    <div className="p-4 border border-[var(--border-color)] rounded-lg">
                      <div className="text-sm text-text-secondary mb-1">
                        Last Login
                      </div>
                      <div className="font-medium text-text-primary">
                        {new Date(security.lastLogin).toLocaleString()}
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

              <Card>
                <CardHeader>
                  <CardTitle className="font-medium">Login History</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
 buttons-color/hover
                    {settings.security.loginHistory.map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-[var(--border-color)] rounded-lg"
                      >

                    {security.loginHistory.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
 master
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
                    ))}
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
 buttons-color/hover
                    <Button
                      variant="outline"
                      className="text-error border-red-500 hover:bg-red-600 hover:text-white"

                    <Button 
                      variant="outline" 
                      className="text-error border-error hover:bg-error hover:text-white"
                      onClick={() => setShowDeleteConfirm(true)}
 master
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
                            onClick={handleDeleteAccount}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
