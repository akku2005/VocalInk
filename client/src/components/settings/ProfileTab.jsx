import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { User, Camera, Upload, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import imageUploadService from '../../services/imageUploadService';
import settingsService from '../../services/settingsService';

// Language options matching reference
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

const ProfileTab = ({ 
  settings, 
  setSettings, 
  loading, 
  setLoading, 
  showToast,
  fetchUserProfile,
  loadSettings
}) => {
  const profile = settings?.profile || {};
  const userProfile = settings?.profile || {};
  const coverImageInputRef = useRef(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [avatarBlobUrl, setAvatarBlobUrl] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const handleInputChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };
  
  // For backward compatibility with existing code
  const handleProfileInputChange = (field, value) => {
    handleInputChange('profile', field, value);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      console.log('Saving Profile settings:', settings.profile);
      
      // Use the new profile section update method
      await settingsService.updateProfileSection(settings.profile);
      
      // Force refresh to get updated data
      await fetchUserProfile(true);
      await loadSettings(true);
      
      showToast('Profile settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving profile settings:', error);
      showToast(error.message || 'Failed to save profile settings', 'error');
    } finally {
      setLoading(false);
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

  const handleAvatarUpload = async (event) => {
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
        
        // Refresh cached user profile after successful save
        await fetchUserProfile(true);
        
        // Reload settings to get updated data
        await loadSettings(true);
        
        showToast('Profile photo uploaded and saved successfully', 'success');
        console.log('✅ Profile photo saved to database');
        
        // Clear the file input
        event.target.value = '';
      } else {
        throw new Error(uploadResult.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('❌ Avatar upload error:', error);
      showToast(error.message || 'Failed to upload profile photo', 'error');
    } finally {
      setProcessingImage(false);
    }
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
        
        // Refresh cached user profile after successful save
        await fetchUserProfile(true);
        
        // Reload settings to get updated data
        await loadSettings(true);
        
        showToast('Cover image uploaded and saved successfully', 'success');
        console.log('✅ Cover image saved to database');
        
        // Clear the file input
        event.target.value = '';
      } else {
        throw new Error(uploadResult.message || 'Failed to upload cover image');
      }
    } catch (error) {
      console.error('❌ Cover image upload error:', error);
      showToast(error.message || 'Failed to upload cover image', 'error');
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

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden">
                {(avatarBlobUrl || profile.avatar) ? (
                  <img
                    src={avatarBlobUrl || profile.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Error loading avatar image:', e);
                      setAvatarBlobUrl(null);
                    }}
                  />
                ) : (
                  <div 
                    className={`w-full h-full flex items-center justify-center text-white font-semibold text-xl ${getAvatarBgColor(profile.firstName || profile.displayName || userProfile?.firstName || 'U')}`}
                  >
                    {getInitials(profile.firstName, profile.lastName, profile.displayName, userProfile?.firstName, userProfile?.lastName)}
                  </div>
                )}
              </div>
              {processingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
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
            <div className="flex-1">
              <h3 className="font-medium text-text-primary mb-1">Upload new photo</h3>
              <p className="text-sm text-text-secondary mb-3">
                JPG, PNG or GIF. Max size 5MB. Recommended 400x400px.
              </p>
              <div className="flex gap-3">
                <input
                  type="file"
                  id="profile-photo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                {profile.avatar && (
                  <button
                    type="button"
                    onClick={removeProfilePhoto}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="font-semibold text-[var(--light-text-color2)]">
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                First Name
              </label>
              <Input
                value={profile.firstName || ''}
                onChange={(e) => handleInputChange('profile', 'firstName', e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Last Name
              </label>
              <Input
                value={profile.lastName || ''}
                onChange={(e) => handleInputChange('profile', 'lastName', e.target.value)}
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Display Name
              </label>
              <Input
                value={profile.displayName || ''}
                onChange={(e) => handleInputChange('profile', 'displayName', e.target.value)}
                placeholder="Enter display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Username
              </label>
              <Input
                value={profile.username || ''}
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
                value={profile.email || ''}
                onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Location
              </label>
              <Input
                value={profile.location || ''}
                onChange={(e) => handleInputChange('profile', 'location', e.target.value)}
                placeholder="Enter location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Website
              </label>
              <Input
                value={profile.website || ''}
                onChange={(e) => handleInputChange('profile', 'website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Company
              </label>
              <Input
                value={profile.company || ''}
                onChange={(e) => handleInputChange('profile', 'company', e.target.value)}
                placeholder="Your company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Job Title
              </label>
              <Input
                value={profile.jobTitle || ''}
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
                value={profile.occupation || ''}
                onChange={(e) => handleInputChange('profile', 'occupation', e.target.value)}
                placeholder="Your occupation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nationality
              </label>
              <Input
                value={profile.nationality || ''}
                onChange={(e) => handleInputChange('profile', 'nationality', e.target.value)}
                placeholder="Your nationality"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Mobile
              </label>
              <Input
                value={profile.mobile || ''}
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
                value={profile.language || ''}
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
              value={profile.bio || ''}
              onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
              rows={4}
              className="w-full p-3 border border-[var(--border-color)] rounded-lg bg-background text-text-primary resize-none"
              placeholder="Tell us about yourself..."
            />
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

      {/* Cover Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Cover Image
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
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
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSaveProfile}
          disabled={loading}
          className="flex items-center gap-2 bg-primary-500 text-white hover:bg-primary-600"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <User className="w-4 h-4" />
              Save Profile Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProfileTab;
