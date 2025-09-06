import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import BadgeComponent from '../components/ui/Badge';
import CustomDropdown from '../components/ui/CustomDropdown';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../components/context/ThemeContext';
import { useToast } from '../hooks/useToast';
import imageService from '../services/imageService';
import imageUploadService from '../services/imageUploadService';
import settingsService from '../services/settingsService';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Globe, 
  Palette, 
  Brain, 
  Award as Badge, 
  Shield, 
  Camera, 
  X, 
  Eye, 
  EyeOff, 
  Save, 
  Upload, 
  Monitor, 
  Download, 
  AlertTriangle, 
  Moon, 
  Sun, 
  Mic, 
  Volume2, 
  Languages, 
  Settings, 
  Activity,
  Key,
  Trash2
} from 'lucide-react';

const SettingsPage = () => {
  const { user, userProfile, fetchUserProfile, setup2FA, verify2FASetup, disable2FA, getCurrentUser, revokeSession, revokeAllSessions, getActiveSessions, deleteAccount, exportUserData, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
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
  const [avatarBlobUrl, setAvatarBlobUrl] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAToken, setTwoFAToken] = useState('');
  const [twoFAStep, setTwoFAStep] = useState('setup'); // 'setup' or 'verify'
  const [twoFASetupData, setTwoFASetupData] = useState(null);

  useEffect(() => {
    if (user && !settings) {
      // Only load settings if we don't have them yet
      loadSettings();
    }
  }, [user, settings]);

  // Ensure all profile fields exist to prevent undefined errors
  const profile = settings?.profile || {};
  const account = settings?.account || {};
  const notifications = settings?.notifications || {};
  const privacy = settings?.privacy || {};
  const appearance = settings?.appearance || {};
  const ai = settings?.ai || {};
  const gamification = settings?.gamification || {};

  // Sync privacy settings with account settings
  useEffect(() => {
    if (settings && account.accountVisibility) {
      // Sync account visibility with privacy settings
      if (privacy.profileVisibility !== account.accountVisibility) {
        handleInputChange('privacy', 'profileVisibility', account.accountVisibility);
      }
      if (privacy.postVisibility !== account.accountVisibility) {
        handleInputChange('privacy', 'postVisibility', account.accountVisibility);
      }
    }
  }, [account.accountVisibility, settings]);

  // Handle avatar URL for display (both Cloudinary URLs and base64)
  useEffect(() => {
    if (profile?.avatar) {
      if (profile.avatar.startsWith('data:')) {
        // Handle base64 images (legacy)
        try {
          const base64Data = profile.avatar.split(',')[1];
          const mimeType = profile.avatar.split(';')[0].split(':')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);
          setAvatarBlobUrl(blobUrl);
          
          // Cleanup previous blob URL
          return () => {
            if (avatarBlobUrl) {
              URL.revokeObjectURL(avatarBlobUrl);
            }
          };
        } catch (error) {
          console.error('Error creating blob URL:', error);
          setAvatarBlobUrl(null);
        }
      } else if (profile.avatar.startsWith('http')) {
        // Handle Cloudinary URLs - use directly
        setAvatarBlobUrl(profile.avatar);
      } else {
        setAvatarBlobUrl(null);
      }
    } else {
      setAvatarBlobUrl(null);
    }
  }, [profile?.avatar]);

  const loadSettings = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Use cached data first, only fetch fresh if forced or no cache
      console.log('🚀 Loading user settings...', { forceRefresh });
      const userSettings = await settingsService.getUserSettings(forceRefresh);
      console.log('📸 Loaded settings with images:', {
        avatar: userSettings?.profile?.avatar ? 'Present' : 'Missing',
        coverImage: userSettings?.profile?.coverImage ? 'Present' : 'Missing'
      });
      setSettings(userSettings);
      
      // Only refresh user profile if forced
      if (forceRefresh) {
        await fetchUserProfile(true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'account', name: 'Account', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy & Security', icon: Globe },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'ai', name: 'AI Preferences', icon: Brain },
    { id: 'gamification', name: 'Gamification', icon: Badge },
    { id: 'security', name: 'Security', icon: Key }
  ];

  const accountVisibilityOptions = [
    { id: "public", name: "Public" },
    { id: "private", name: "Private" },
    { id: "friends", name: "Friends Only" },
  ];

  const fontSizeOptions = [
    { id: "small", name: "Small" },
    { id: "medium", name: "Medium" },
    { id: "large", name: "Large" },
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
      console.log('Current settings before save:', settings);
      
      // Transform frontend settings to backend format
      const backendData = settingsService.transformFrontendToBackend(settings);
      console.log('Backend data to be sent:', backendData);
      
      // Exclude image data from the main save to prevent "Suspicious request" error
      // Images are already saved individually via upload functions
      const { avatar, coverImage, ...profileDataWithoutImages } = backendData;
      const saveData = {
        ...profileDataWithoutImages
      };
      
      console.log('Saving data without images:', saveData);
      
      // Update profile settings (excluding images)
      await settingsService.updateProfileSettings(saveData);
      
      // Update gamification settings if changed
      if (settings.gamification) {
        await settingsService.updateGamificationSettings(settings.gamification);
      }
      
      // Update AI preferences if changed
      if (settings.ai) {
        await settingsService.updateAIPreferences(settings.ai);
      }
      
      // Update notification preferences if changed
      if (settings.notifications) {
        await settingsService.updateNotificationPreferences(settings.notifications);
      }
      
      // Update privacy settings if changed
      if (settings.privacy) {
        await settingsService.updatePrivacySettings(settings.privacy);
      }
      
      // Refresh cached user profile after successful save
      await fetchUserProfile(true); // Force refresh to get updated data
      
      showToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(error.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    console.log(`Updating ${section}.${field} with:`, value);
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
      
      // Sync visibility settings between Account and Privacy tabs
      if (section === 'privacy' && (field === 'profileVisibility' || field === 'postVisibility')) {
        newSettings.account = {
          ...newSettings.account,
          accountVisibility: value
        };
      }
      if (section === 'account' && field === 'accountVisibility') {
        newSettings.privacy = {
          ...newSettings.privacy,
          profileVisibility: value,
          postVisibility: value
        };
      }
      
      console.log('New settings state:', newSettings);
      return newSettings;
    });
  };

  const handleToggle = (section, field) => {
    console.log(`Toggling ${section}.${field} from:`, settings[section]?.[field], 'to:', !settings[section]?.[field]);
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: !prev[section][field],
        },
      };
      console.log('New settings after toggle:', newSettings);
      return newSettings;
    });
  };

  const handlePasswordChange = async () => {
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

  // 2FA Functions
  const initiate2FASetup = async () => {
    setTwoFALoading(true);
    try {
      const result = await setup2FA();
      if (result.success) {
        setTwoFASetupData(result.data);
        showToast('2FA setup initiated. Please scan the QR code and enter the verification code.', 'info');
      } else {
        showToast(result.error || 'Failed to setup 2FA', 'error');
        setShow2FAModal(false);
      }
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      showToast(error.message || 'Failed to setup 2FA', 'error');
      setShow2FAModal(false);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFAToken || twoFAToken.length !== 6) {
      showToast('Please enter a valid 6-digit verification code', 'error');
      return;
    }

    setTwoFALoading(true);
    try {
      const result = await verify2FASetup(twoFAToken);
      if (result.success) {
        showToast('2FA enabled successfully!', 'success');
        setShow2FAModal(false);
        setTwoFAStep('setup');
        setTwoFAToken('');
        setTwoFASetupData(null);
        // Refresh user data to update 2FA status
        await getCurrentUser();
      } else {
        showToast(result.error || 'Failed to verify 2FA', 'error');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      showToast(error.message || 'Failed to verify 2FA', 'error');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!twoFAToken || twoFAToken.length !== 6) {
      showToast('Please enter a valid 6-digit verification code', 'error');
      return;
    }

    setTwoFALoading(true);
    try {
      const result = await disable2FA(twoFAToken);
      if (result.success) {
        showToast('2FA disabled successfully!', 'success');
        setShow2FAModal(false);
        setTwoFAStep('setup');
        setTwoFAToken('');
        setTwoFASetupData(null);
        // Refresh user data to update 2FA status
        await getCurrentUser();
      } else {
        showToast(result.error || 'Failed to disable 2FA', 'error');
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      showToast(error.message || 'Failed to disable 2FA', 'error');
    } finally {
      setTwoFALoading(false);
    }
  };

  const close2FAModal = () => {
    setShow2FAModal(false);
    setTwoFAStep('setup');
  };

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('🔄 Starting profile photo upload...', { fileName: file.name, fileSize: file.size });

    // Validate image file
    const validation = imageUploadService.validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return;
    }

    try {
      setProcessingImage(true);
      
      console.log('☁️ Uploading image to Cloudinary...');
      // Upload to Cloudinary
      const uploadResult = await imageUploadService.uploadAvatar(file);
      
      if (uploadResult.success) {
        console.log('✅ Image uploaded successfully:', uploadResult.data);
        
        // Update the profile with the Cloudinary URL
        handleInputChange('profile', 'avatar', uploadResult.data.avatar);
        
        // Set the Cloudinary URL directly for display
        setAvatarBlobUrl(uploadResult.data.avatar);
        
        showToast('Profile photo updated successfully!', 'success');
      } else {
        throw new Error('Upload failed');
      }
      
      // Refresh cached user profile after successful save
      await fetchUserProfile(true);
      
      // Reload settings to get updated data
      await loadSettings(true);
      
      showToast('Profile photo uploaded and saved successfully', 'success');
      console.log('✅ Profile photo saved to database');
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('❌ Error processing profile photo:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      showToast(error.message || 'Failed to upload profile photo', 'error');
    } finally {
      setProcessingImage(false);
    }
  };

  const removeProfilePhoto = async () => {
    try {
      setProcessingImage(true);
      
      console.log('🗑️ Removing profile photo from Cloudinary...');
      // Remove from Cloudinary
      const removeResult = await imageUploadService.removeAvatar();
      
      if (removeResult.success) {
        console.log('✅ Profile photo removed successfully');
        
        // Update the profile to remove avatar
        handleInputChange('profile', 'avatar', null);
        
        // Clear blob URL if it exists
        if (avatarBlobUrl) {
          imageUploadService.revokePreviewUrl(avatarBlobUrl);
          setAvatarBlobUrl(null);
        }
        
        showToast('Profile photo removed successfully!', 'success');
      } else {
        throw new Error('Failed to remove profile photo');
      }
    } catch (error) {
      console.error('❌ Error removing profile photo:', error);
      showToast(error.message || 'Failed to remove profile photo', 'error');
    } finally {
      setProcessingImage(false);
    }
  };

  // Helper function to get initials from name
  const getInitials = (firstName, lastName, displayName, userFirstName, userLastName) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (userFirstName && userLastName) {
      return `${userFirstName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase();
    }
    if (userFirstName) {
      return userFirstName.charAt(0).toUpperCase();
    }
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return displayName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Helper function to get consistent avatar background color based on name
  const getAvatarBgColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500'
    ];
    
    if (!name) return 'bg-gray-500';
    
    // Use first character's char code to consistently pick a color
    const charCode = name.charAt(0).toUpperCase().charCodeAt(0);
    const colorIndex = charCode % colors.length;
    return colors[colorIndex];
  };

  const handleCoverImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('🔄 Starting cover image upload...', { fileName: file.name, fileSize: file.size });

    // Validate image file
    const validation = imageUploadService.validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return;
    }

    try {
      setProcessingImage(true);
      
      console.log('☁️ Uploading cover image to Cloudinary...');
      // Upload to Cloudinary
      const uploadResult = await imageUploadService.uploadCoverImage(file);
      
      if (uploadResult.success) {
        console.log('✅ Cover image uploaded successfully:', uploadResult.data);
        
        // Update the profile with the Cloudinary URL
        handleInputChange('profile', 'coverImage', uploadResult.data.coverImage);
        
        showToast('Cover image updated successfully!', 'success');
      } else {
        throw new Error('Upload failed');
      }
      
      // Refresh cached user profile after successful save
      await fetchUserProfile(true);
      
      // Reload settings to get updated data
      await loadSettings(true);
      
      showToast('Cover image uploaded and saved successfully', 'success');
      console.log('✅ Cover image saved to database');
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('❌ Error processing cover image:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      showToast(error.message || 'Failed to upload cover image', 'error');
    } finally {
      setProcessingImage(false);
    }
  };

  // Privacy & Security Handler Functions
  const handle2FASetup = async () => {
    setTwoFAStep('setup');
    setTwoFASetupData(null); // Reset data
    setTwoFAToken(''); // Reset token
    setShow2FAModal(true);
    initiate2FASetup();
  };

  const handle2FADisable = async () => {
    setTwoFAStep('disable');
    setShow2FAModal(true);
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const result = await revokeSession(sessionId);
      if (result.success) {
        showToast('Session revoked successfully', 'success');
        await loadActiveSessions(); // Refresh sessions list
      } else {
        showToast(result.error || 'Failed to revoke session', 'error');
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      showToast(error.message || 'Failed to revoke session', 'error');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      const result = await revokeAllSessions();
      if (result.success) {
        showToast('All sessions revoked successfully', 'success');
        await loadActiveSessions(); // Refresh sessions list
      } else {
        showToast(result.error || 'Failed to revoke all sessions', 'error');
      }
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      showToast(error.message || 'Failed to revoke all sessions', 'error');
    }
  };

  const handleExportData = async () => {
    try {
      const result = await exportUserData();
      if (result.success) {
        showToast('Data export started successfully', 'success');
      } else {
        showToast(result.error || 'Failed to export data', 'error');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast(error.message || 'Failed to export data', 'error');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      showToast('Please type "DELETE" to confirm', 'error');
      return;
    }

    setDeleteLoading(true);
    try {
      const result = await deleteAccount(passwordData.currentPassword, deleteConfirmation);
      if (result.success) {
        showToast('Account deleted successfully', 'success');
        
        // Clear all local storage and session data
        localStorage.clear();
        sessionStorage.clear();
        
        // Log out the user to clear authentication state
        await logout();
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        showToast(result.error || 'Failed to delete account', 'error');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast(error.message || 'Failed to delete account', 'error');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmation('');
      setPasswordData(prev => ({ ...prev, currentPassword: '' }));
    }
  };

  // Load active sessions
  const loadActiveSessions = async () => {
    try {
      const result = await getActiveSessions();
      if (result.success) {
        setActiveSessions(result.data.sessions || []);
      } else {
        console.error('Failed to load sessions:', result.error);
        setActiveSessions([]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setActiveSessions([]);
    }
  };

  // Load sessions when privacy tab is active
  useEffect(() => {
    if (activeTab === 'privacy' && user) {
      loadActiveSessions();
    }
  }, [activeTab, user]);

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
                    {avatarBlobUrl ? (
                      <img 
                        src={avatarBlobUrl} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover"
                        onError={(e) => {
                          console.error('Error loading avatar image:', e);
                          setAvatarBlobUrl(null);
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-xl ${
                        avatarBlobUrl ? 'hidden' : 'flex'
                      } ${getAvatarBgColor(profile.firstName || profile.displayName || userProfile?.firstName || 'U')}`}
                    >
                      {getInitials(profile.firstName, profile.lastName, profile.displayName, userProfile?.firstName, userProfile?.lastName)}
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                      type="file"
                      id="profile-photo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoUpload}
                    />
                    
                    <button 
                      className="absolute -bottom-1 -right-1 p-1 bg-primary-500 text-white rounded-full hover:bg-primary-600 cursor-pointer"
                      onClick={() => {
                        console.log('🎯 Camera button clicked!');
                        const fileInput = document.getElementById('profile-photo-upload');
                        console.log('📁 File input element:', fileInput);
                        if (fileInput) {
                          fileInput.click();
                          console.log('✅ File input clicked');
                        } else {
                          console.error('❌ File input not found');
                        }
                      }}
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
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      First Name
                    </label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Last Name
                    </label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) => handleInputChange('profile', 'lastName', e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Display Name
                    </label>
                    <Input
                      value={profile.displayName}
                      onChange={(e) => handleInputChange('profile', 'displayName', e.target.value)}
                      placeholder="Enter display name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Username
                    </label>
                    <Input
                      value={profile.username}
                      onChange={(e) => handleInputChange('profile', 'username', e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Location
                    </label>
                    <Input
                      value={profile.location}
                      onChange={(e) => handleInputChange('profile', 'location', e.target.value)}
                      placeholder="Enter location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Website
                    </label>
                    <Input
                      value={profile.website}
                      onChange={(e) => handleInputChange('profile', 'website', e.target.value)}
                      placeholder="https://example.com"
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
                      {languageOptions.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Timezone
                    </label>
                    <select
                      value={profile.timezone || 'America/Los_Angeles'}
                      onChange={(e) => handleInputChange('profile', 'timezone', e.target.value)}
                      className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Social Links Display */}
                {profile.socialLinks && profile.socialLinks.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-text-primary mb-3">Current Social Links</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {profile.socialLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg border">
                          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                              {link.platform.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-text-primary capitalize">{link.platform}</div>
                            <div className="text-xs text-text-secondary truncate">{link.url}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-[var(--border-color)] rounded-lg bg-background text-text-primary resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Cover Image
                  </label>
                  
                  {/* URL Input for Cover Image */}
                  <div className="mb-3">
                    <Input
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                      className="mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (coverImageUrl) {
                          console.log('Loading cover image from URL:', coverImageUrl);
                          handleInputChange('profile', 'coverImage', coverImageUrl);
                          setCoverImageUrl('');
                          showToast('Cover image loaded from URL. Click "Save Changes" to save it.', 'info');
                        }
                      }}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                      disabled={!coverImageUrl}
                    >
                      Load from URL
                    </button>
                  </div>
                  
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
                      {profile.coverImage.startsWith('http') && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          URL image
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
                          <Badge variant="outline" className="capitalize">
                            {user?.role || 'user'}
                          </Badge>
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
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
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
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
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
          )}

          {/* Privacy & Security Tab */}
          {activeTab === "privacy" && (
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
                    {Object.entries(privacy).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
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
                            value={
                              (key === "profileVisibility" || key === "postVisibility") 
                                ? (account.accountVisibility || value || 'public')
                                : value
                            }
                            onChange={(val) => {
                              if (key === "profileVisibility" || key === "postVisibility") {
                                handleInputChange("privacy", key, val);
                                handleInputChange("account", "accountVisibility", val);
                              } else {
                                handleInputChange("privacy", key, val);
                              }
                            }}
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
                        {account.twoFactorAuth ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-green-700">Active</span>
                            </div>
                            <Shield className="bg-green-100 text-green-800  hover:bg-green-100">
                              <Shield className="w-3 h-3 mr-1" />
                              Secured
                            </Shield>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span className="text-xs font-medium text-amber-700">Inactive</span>
                            </div>
                            <Badge variant="outline" className="text-amber-600 border-amber-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Recommended
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {account.twoFactorAuth ? (
                        <div className="space-y-2">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ Your account is protected with 2FA
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
                            ⚠ Enable 2FA for enhanced security
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
                        variant={account.twoFactorAuth ? "outline" : "default"}
                        size="sm"
                        onClick={() => account.twoFactorAuth ? handle2FADisable() : handle2FASetup()}
                        className={account.twoFactorAuth ? 
                          "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" : 
                          "bg-green-600 hover:bg-green-700 text-white"
                        }
                      >
                        {account.twoFactorAuth ? (
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
                      {account.twoFactorAuth && (
                        <span className="text-xs text-text-secondary">
                          Backup codes available
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                  
                  {activeSessions.length > 0 ? (
                    <div className="space-y-3">
                      {activeSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Monitor className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {session.device} - {session.browser}
                              </p>
                              <p className="text-xs text-text-secondary">
                                {typeof session.location === 'object' 
                                  ? `${session.location.city || 'Unknown'}, ${session.location.region || 'Unknown'}, ${session.location.country || 'Unknown'}`
                                  : session.location || 'Unknown Location'
                                } • Last active: {new Date(session.lastActivity).toLocaleDateString()}
                                {session.isCurrent && ' • Current session'}
                              </p>
                            </div>
                          </div>
                          {!session.isCurrent && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeSession(session.id)}
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
            </div>
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
                              ? "border-primary-500 bg-primary-50"
                              : "border-border hover:border-primary-200"
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{themeOption.label}</span>
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
                    value={appearance.fontSize}
                    onChange={(e) => handleInputChange('appearance', 'fontSize', e.target.value)}
                    className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                  >
                    {fontSizeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
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
                      <input
                        type="checkbox"
                        checked={appearance.compactMode}
                        onChange={() => handleToggle('appearance', 'compactMode')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
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
                      <input
                        type="checkbox"
                        checked={appearance.showAnimations}
                        onChange={() => handleToggle('appearance', 'showAnimations')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">
                        Color Scheme
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Choose your preferred color scheme
                      </p>
                    </div>
                    <select
                      value={appearance.colorScheme || 'default'}
                      onChange={(e) => handleInputChange('appearance', 'colorScheme', e.target.value)}
                      className="w-32 p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                      <option value="default">Default</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="red">Red</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">
                        Sidebar Position
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Choose sidebar position
                      </p>
                    </div>
                    <select
                      value={appearance.sidebarPosition || 'left'}
                      onChange={(e) => handleInputChange('appearance', 'sidebarPosition', e.target.value)}
                      className="w-32 p-2 border border-border rounded-lg bg-background text-text-primary"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="top">Top</option>
                    </select>
                  </div>
                </div>

                {/* Save Button for Appearance */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleSave}
                    loading={loading}
                    className="flex items-center gap-2 bg-primary-500 text-white hover:bg-primary-600"
                  >
                    <Save className="w-4 h-4" />
                    Save Appearance Settings
                  </Button>
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
                        {new Date(security.lastPasswordChange).toLocaleDateString()}
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

              {/* Account Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-medium flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Account Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-primary-500" />
                        <span className="font-medium text-text-primary">Last Active</span>
                      </div>
                      <div className="text-sm text-text-secondary">
                        {security.lastActive ? new Date(security.lastActive).toLocaleString() : 'Never'}
                      </div>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldIcon className="w-4 h-4 text-primary-500" />
                        <span className="font-medium text-text-primary">Account Status</span>
                      </div>
                      <div className="text-sm text-text-secondary">
                        {security.isVerified ? 'Verified' : 'Unverified'}
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
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                Delete Account
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Enter your current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
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
                  Type "DELETE" to confirm
                </label>
                <Input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmation('');
                    setPasswordData(prev => ({ ...prev, currentPassword: '' }));
                  }}
                  className="flex-1"
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
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {twoFAStep === 'setup' ? 'Setup Two-Factor Authentication' : 
                 twoFAStep === 'verify' ? 'Verify 2FA Setup' : 'Disable Two-Factor Authentication'}
              </h3>
              <button
                onClick={close2FAModal}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {twoFAStep === 'setup' && twoFASetupData && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-text-secondary mb-4">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="flex justify-center mb-4">
                    <img 
                      src={twoFASetupData.qrCode} 
                      alt="2FA QR Code" 
                      className="w-48 h-48 border rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mb-4">
                    Or enter this key manually: <code className="bg-gray-100 px-2 py-1 rounded">{twoFASetupData.manualEntryKey}</code>
                  </p>
                </div>
                <Button
                  onClick={() => setTwoFAStep('verify')}
                  className="w-full"
                >
                  I've Added the Account
                </Button>
              </div>
            )}

            {twoFAStep === 'verify' && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  Enter the 6-digit code from your authenticator app:
                </p>
                <Input
                  type="text"
                  placeholder="000000"
                  value={twoFAToken}
                  onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setTwoFAStep('setup')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleVerify2FA}
                    loading={twoFALoading}
                    disabled={twoFAToken.length !== 6}
                    className="flex-1"
                  >
                    Verify & Enable
                  </Button>
                </div>
              </div>
            )}

            {twoFAStep === 'disable' && (
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                  Enter your current password and a 2FA code to disable two-factor authentication:
                </p>
                <Input
                  type="password"
                  placeholder="Current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
                <Input
                  type="text"
                  placeholder="2FA Code (000000)"
                  value={twoFAToken}
                  onChange={(e) => setTwoFAToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={close2FAModal}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDisable2FA}
                    loading={twoFALoading}
                    disabled={!passwordData.currentPassword || twoFAToken.length !== 6}
                    variant="destructive"
                    className="flex-1"
                  >
                    Disable 2FA
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;