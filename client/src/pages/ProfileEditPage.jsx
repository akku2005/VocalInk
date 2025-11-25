import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import {
  User,
  MapPin,
  Link,
  Building,
  Briefcase,
  Globe,
  ArrowLeft,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { storage } from '../utils/storage';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    dob: '',
    nationality: '',
    mobile: '',
    occupation: '',
    gender: '',
    address: '',
    company: '',
    jobTitle: '',
    website: '',
    linkedin: '',
    socialLinks: [],
    avatar: '',
    profilePicture: '',
    coverImage: '',
    role: ''
  });

  const [imagePreview, setImagePreview] = useState({
    avatar: '',
    coverImage: ''
  });

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profile = await userService.getMyProfile();

        // Format date for input field
        const formattedDob = profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '';

        setFormData({
          name: profile.name || '',
          bio: profile.bio || '',
          dob: formattedDob,
          nationality: profile.nationality || '',
          mobile: profile.mobile || '',
          occupation: profile.occupation || '',
          gender: profile.gender || '',
          address: profile.address || '',
          company: profile.company || '',
          jobTitle: profile.jobTitle || '',
          website: profile.website || '',
          linkedin: profile.linkedin || '',
          socialLinks: profile.socialLinks || [],
          avatar: profile.avatar || '',
          profilePicture: profile.profilePicture || '',
          coverImage: profile.coverImage || '',
          role: profile.role || 'reader'
        });

        // Set image previews
        setImagePreview({
          avatar: profile.avatar || profile.profilePicture || '',
          coverImage: profile.coverImage || ''
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinkChange = (index, field, value) => {
    const newSocialLinks = [...formData.socialLinks];
    newSocialLinks[index] = {
      ...newSocialLinks[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      socialLinks: newSocialLinks
    }));
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: 'twitter', url: '' }]
    }));
  };

  const removeSocialLink = (index) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const uploadImage = async (file, type) => {
    try {
      setUploadingImage(true);

      const formData = new FormData();
      let url = '/api/images/upload';
      if (type === 'avatar') {
        url = '/api/images/avatar';
        formData.append('avatar', file);
      } else if (type === 'coverImage') {
        url = '/api/images/cover';
        formData.append('coverImage', file);
      } else {
        formData.append('file', file);
      }

      // Upload image
      const headers = {};
      if (storage.available) {
        const token = storage.getItem('accessToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      const imageUrl = result.data?.avatar || result.data?.coverImage || result.url || result.data?.url;
      setFormData(prev => ({
        ...prev,
        [type]: imageUrl
      }));

      setImagePreview(prev => ({
        ...prev,
        [type]: imageUrl
      }));

      return imageUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw new Error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB');
      return;
    }

    try {
      await uploadImage(file, type);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, type) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      try {
        await uploadImage(file, type);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const removeImage = (type) => {
    setFormData(prev => ({
      ...prev,
      [type]: ''
    }));

    setImagePreview(prev => ({
      ...prev,
      [type]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      // Filter out empty fields
      const updateData = Object.fromEntries(
        Object.entries(formData).filter(([_key, value]) =>
          value !== '' && value !== null && value !== undefined
        )
      );

      // Convert date string to Date object if present
      if (updateData.dob) {
        updateData.dob = new Date(updateData.dob);
      }

      await userService.updateProfile(updateData);
      setSuccess(true);

      // Redirect to profile page after a short delay
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Edit Profile</h1>
            <p className="text-text-secondary">Update your personal information and preferences</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Save className="w-5 h-5" />
            <span className="font-medium">Profile updated successfully!</span>
          </div>
          <p className="text-green-700 mt-1">Redirecting to your profile...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <X className="w-5 h-5" />
            <span className="font-medium">Error updating profile</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Profile Images
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Cover Image
              </label>
              <div
                className={`relative w-full h-48 border-2 border-dashed rounded-lg overflow-hidden ${imagePreview.coverImage ? 'border-primary' : 'border-border'
                  }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'coverImage')}
              >
                {imagePreview.coverImage ? (
                  <>
                    <img
                      src={imagePreview.coverImage}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => coverInputRef.current?.click()}
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeImage('coverImage')}
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1557683316-973673baf926?w=600&h=300&fit=crop&crop=center&auto=format&q=80"
                      alt="Default cover"
                      className="w-full h-full object-cover opacity-50"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                      <Upload className="w-12 h-12 text-white mb-2" />
                      <p className="text-white mb-2 font-medium">
                        Drag and drop an image here, or click to browse
                      </p>
                      <p className="text-xs text-white opacity-80">
                        Recommended: 1200x300 pixels, max 5MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => coverInputRef.current?.click()}
                        className="mt-2 bg-white text-gray-800 hover:bg-gray-100"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Choose Image
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'coverImage')}
                  className="hidden"
                />
              </div>
            </div>

            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div
                  className={`relative w-24 h-24 border-2 border-dashed rounded-full overflow-hidden ${imagePreview.avatar ? 'border-primary' : 'border-border'
                    }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'avatar')}
                >
                  {imagePreview.avatar ? (
                    <>
                      <img
                        src={imagePreview.avatar}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => avatarInputRef.current?.click()}
                          className="bg-white text-black hover:bg-gray-100 w-8 h-8 p-0"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-text-secondary mb-2">
                    Upload a profile picture to personalize your account
                  </p>
                  <p className="text-xs text-text-secondary">
                    Recommended: 200x200 pixels, max 5MB
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Choose Image
                    </Button>
                    {imagePreview.avatar && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage('avatar')}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {uploadingImage && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-text-secondary">Uploading image...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Full Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Account Type
              </label>
              <Select
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
              >
                <option value="reader">Reader - Browse and read blogs</option>
                <option value="writer">Writer - Create and publish content</option>
              </Select>
              <p className="text-xs text-text-secondary mt-1">
                Writers can create blogs and series. Readers can only view content.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Bio
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={500}
              />
              <p className="text-sm text-text-secondary mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nationality
                </label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  placeholder="Enter your nationality"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Gender
                </label>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Mobile Number
                </label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder="+91-9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Address
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Occupation
                </label>
                <Input
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder="e.g., Software Engineer, Writer, Student"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Company
                </label>
                <Input
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Enter your company name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Job Title
              </label>
              <Input
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="e.g., Senior Developer, Content Creator"
              />
            </div>
          </CardContent>
        </Card>

        {/* Online Presence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Online Presence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Website
                </label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  LinkedIn
                </label>
                <Input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            </div>

            {/* Social Links */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-text-primary">
                  Social Media Links
                </label>
                <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
                  Add Link
                </Button>
              </div>

              <div className="space-y-3">
                {formData.socialLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={link.platform}
                      onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                      className="w-32"
                    >
                      <option value="twitter">Twitter</option>
                      <option value="github">GitHub</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="youtube">YouTube</option>
                    </Select>
                    <Input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSocialLink(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/profile')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || uploadingImage}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditPage;
