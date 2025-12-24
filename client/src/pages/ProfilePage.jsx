import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { userService } from "../services/userService";
import settingsService from "../services/settingsService";
import { imageService } from "../services/imageService";
import { getProfileHandle, getProfilePath } from "../utils/profileUrl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import {
  User,
  Calendar,
  MapPin,
  Link,
  Users,
  Star,
  Trophy,
  BookOpen,
  MessageCircle,
  Heart,
  Share,
  Edit,
  Settings,
  Bell,
  ArrowLeft,
  Camera,
  Upload,
  Eye,
  Building,
  Briefcase,
  Mail,
  Phone,
  Globe2,
  Languages,
  Clock3
} from "lucide-react";
import { getCleanExcerpt, calculateReadTime } from "../utils/textUtils";
import ProfilePageSkeleton from "../components/skeletons/ProfilePageSkeleton";
import FollowingFollowersModal from "../components/profile/FollowingFollowersModal";
import PrivateProfileView from "../components/profile/PrivateProfileView";

const ProfilePage = () => {
  const { username, id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [userBlogs, setUserBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [userSeries, setUserSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [modalType, setModalType] = useState('following'); // 'following' or 'followers'
  const [modalUsers, setModalUsers] = useState([]);
  const lastFetchedKey = useRef(null);

  // File input refs
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Determine if this is the current user's profile or another user's profile
  const isOwnProfile = profile
    ? user && (user._id === profile._id || user.id === profile._id)
    : username === 'me' || (!id && !username);
  const targetUserId = id || (profile?._id);

  const profileKey = useMemo(
    () => (username || id || 'me').replace(/^@/, ''),
    [username, id]
  );

  useEffect(() => {
    // Always start in loading state for new route
    setLoading(true);
    setError(null);

    const fetchProfile = async () => {
      try {
        // Don't refetch the same profileKey twice
        if (lastFetchedKey.current === profileKey && profile) {
          setLoading(false);
          return;
        }

        let profileData;

        // Check if we have a URL parameter (could be username or ID)
        const urlParam = username || id;
        const lookup = (urlParam || '').replace(/^@/, '');

        // If no URL parameter, fetch current user's profile
        if (!urlParam) {
          profileData = await userService.getMyProfile();
        } else {
          // Reject legacy pseudo-handles we previously generated
          if (/^user-[a-f\d]{6}$/i.test(lookup)) {
            throw new Error('Invalid profile link');
          }

          // Allow backend to resolve by username or id
          profileData = await userService.getUserProfile(lookup);
        }

        setProfile(profileData);
        lastFetchedKey.current = profileKey;

        // Redirect to canonical id path if needed
        const currentSegment = (username || id || '').replace(/^@/, '');
        const canonicalHandle = getProfileHandle(profileData);
        const canonicalPath = getProfilePath(profileData);

        if (canonicalHandle && currentSegment && currentSegment !== canonicalHandle) {
          navigate(canonicalPath, { replace: true });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileKey]);

  useEffect(() => {
    const fetchUserBlogs = async () => {
      if (!targetUserId || activeTab !== 'posts') return;

      try {
        setBlogsLoading(true);
        const blogs = await userService.getUserBlogs(targetUserId);
        setUserBlogs(blogs.blogs || []);
      } catch (err) {
        console.error('Error fetching user blogs:', err);
        setUserBlogs([]);
      } finally {
        setBlogsLoading(false);
      }
    };

    fetchUserBlogs();
  }, [targetUserId, activeTab]);

  useEffect(() => {
    const fetchUserSeries = async () => {
      if (!targetUserId || activeTab !== 'series') return;

      try {
        setSeriesLoading(true);
        const series = await userService.getUserSeries(targetUserId);
        setUserSeries(series || []);
      } catch (err) {
        console.error('Error fetching user series:', err);
        setUserSeries([]);
      } finally {
        setSeriesLoading(false);
      }
    };

    fetchUserSeries();

    const fetchLikedPosts = async () => {
      if (!targetUserId || activeTab !== 'likes') return;
      try {
        setLikedLoading(true);
        const response = await userService.getUserLikedBlogs(targetUserId);
        setLikedPosts(response.data?.blogs || []);
      } catch (err) {
        console.error('Failed to fetch liked posts:', err);
        setLikedPosts([]);
      } finally {
        setLikedLoading(false);
      }
    };

    const fetchBookmarkedPosts = async () => {
      if (!targetUserId || activeTab !== 'bookmarks') return;
      try {
        setBookmarksLoading(true);
        const response = await userService.getUserBookmarkedBlogs(targetUserId);
        setBookmarkedPosts(response.data?.blogs || []);
      } catch (err) {
        console.error('Failed to fetch bookmarked posts:', err);
        setBookmarkedPosts([]);
      } finally {
        setBookmarksLoading(false);
      }
    };

    fetchLikedPosts();
    fetchBookmarkedPosts();
  }, [targetUserId, activeTab]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isOwnProfile) {
      showError('You cannot follow yourself');
      return;
    }

    try {
      setFollowLoading(true);
      if (profile.isFollowing) {
        const response = await userService.unfollowUser(targetUserId);
        // Use backend response data to ensure consistency
        setProfile(prev => ({
          ...prev,
          isFollowing: response?.isFollowing ?? false,
          followerCount: response?.followerCount ?? Math.max(0, (prev.followerCount || 0) - 1)
        }));
      } else {
        const response = await userService.followUser(targetUserId);
        // Use backend response data to ensure consistency
        setProfile(prev => ({
          ...prev,
          isFollowing: response?.isFollowing ?? true,
          followerCount: response?.followerCount ?? (prev.followerCount || 0) + 1
        }));
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
      showError(err.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShowFollowing = async () => {
    try {
      setModalType('following');
      // Use populated following array from profile
      setModalUsers(profile.following || []);
      setShowFollowModal(true);
    } catch (error) {
      console.error('Error loading following:', error);
      showError('Failed to load following list');
    }
  };

  const handleShowFollowers = async () => {
    try {
      setModalType('followers');
      // Use populated followers array from profile
      setModalUsers(profile.followers || []);
      setShowFollowModal(true);
    } catch (error) {
      console.error('Error loading followers:', error);
      showError('Failed to load followers list');
    }
  };

  const handleUnfollowFromModal = (userId) => {
    // Update the profile state
    setProfile(prev => ({
      ...prev,
      following: prev.following.filter(u => (u._id || u.id) !== userId),
      followingCount: Math.max(0, (prev.followingCount || 0) - 1)
    }));
    // Update modal users
    setModalUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
  };

  const handleRemoveFollowerFromModal = (userId) => {
    setProfile(prev => ({
      ...prev,
      followers: prev.followers.filter(u => (u._id || u.id) !== userId),
      followerCount: Math.max(0, (prev.followerCount || 0) - 1)
    }));
    setModalUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
  };

  const handleMessage = () => {
    showError('Messaging is not implemented yet');
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // Helper function to get initials from name
  const getInitials = (firstName, lastName, displayName, name) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }
    if (displayName) {
      const names = displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return displayName.charAt(0).toUpperCase();
    }
    if (name) {
      const names = name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return name.charAt(0).toUpperCase();
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

  const getViews = (post = {}) =>
    post.views ?? post.viewCount ?? post.analytics?.totalViews ?? 0;

  const openBlog = (post) => {
    if (!post) return;
    const slug = post.slug || post._id || post.id;
    if (slug) {
      navigate(`/article/${slug}`);
    }
  };

  const openSeries = (series) => {
    if (!series) return;
    const seriesId = series.slug || series._id || series.id;
    if (seriesId) {
      navigate(`/series/${seriesId}`);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      setError(null);

      // Convert image to base64 with compression (same as settings page)
      const base64Image = await imageService.convertImageToBase64WithCompression(file);

      // Update profile with new avatar (direct API call)
      const updatedProfile = await settingsService.updateProfileSettings({
        avatar: base64Image
      });

      // Update local state
      setProfile(prev => ({
        ...prev,
        avatar: base64Image,
        profilePicture: base64Image
      }));
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      setError(`Failed to upload avatar: ${error.message}`);
    } finally {
      setUploadingAvatar(false);
      // Clear the input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Handle cover image upload
  const handleCoverUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      setError(null);

      // Convert image to base64 with compression (same as settings page)
      const base64Image = await imageService.convertImageToBase64WithCompression(file);

      // Update profile with new cover image (direct API call)
      const updatedProfile = await settingsService.updateProfileSettings({
        coverImage: base64Image
      });

      // Update local state
      setProfile(prev => ({
        ...prev,
        coverImage: base64Image
      }));
    } catch (error) {
      console.error('❌ Error uploading cover image:', error);
      console.error('❌ Cover image error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      setError(`Failed to upload cover image: ${error.message}`);
    } finally {
      setUploadingCover(false);
      // Clear the input
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ProfilePageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <div className="mb-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Profile not found</h2>
        <p className="text-text-secondary">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Profile not found
        </h2>
        <p className="text-text-secondary">
          The user you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const normalizeUrl = (link = '') => {
    if (!link) return '';
    return /^https?:\/\//i.test(link) ? link : `https://${link}`;
  };

  const formatDisplayUrl = (link = '') => `${link}`.trim().replace(/^https?:\/\//i, '');

  const languageLabelMap = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    hi: 'Hindi'
  };

  const displayHandle = profile.username || profile.handle || profile.email?.split('@')[0] || 'user';
  const displayLocation = profile.location || profile.address;
  const timezoneDisplay = profile.timezone || profile.timeZone;
  const formattedDob = profile.dob ? formatDate(profile.dob) : null;
  const languageDisplay = languageLabelMap[(profile.language || '').toLowerCase()] || profile.language || null;
  const showEmail = profile?.privacySettings?.showEmail !== false;

  const aboutDetails = [
    { label: 'Company', value: profile.company, icon: Building },
    { label: 'Job Title', value: profile.jobTitle, icon: Briefcase },
    { label: 'Occupation', value: profile.occupation, icon: Briefcase },
    { label: 'Gender', value: profile.gender, icon: User },
    { label: 'Nationality', value: profile.nationality, icon: Globe2 },
    { label: 'Language', value: languageDisplay, icon: Languages },
    { label: 'Timezone', value: timezoneDisplay, icon: Clock3 },
    { label: 'Date of Birth', value: formattedDob, icon: Calendar }
  ].filter(detail => detail.value);

  const contactDetails = [
    { label: 'Email', value: profile.email, icon: Mail, href: `mailto:${profile.email}`, visible: showEmail },
    { label: 'Mobile', value: profile.mobile, icon: Phone },
    { label: 'Website', value: profile.website, icon: Link, href: normalizeUrl(profile.website), display: formatDisplayUrl(profile.website || '') },
    { label: 'Location', value: displayLocation, icon: MapPin }
  ].filter(detail => detail.value && detail.visible !== false);

  const socialLinks = Array.isArray(profile.socialLinks)
    ? profile.socialLinks.filter(link => link?.url)
    : [];

  const hasExtendedDetails = aboutDetails.length > 0 || contactDetails.length > 0 || socialLinks.length > 0;

  // Calculate XP progress - use server-calculated values from profile
  const gamification = profile.gamificationSettings || profile.gamification || {};
  const level = profile.level || gamification.level || 1;
  const totalXP = profile.xp ?? gamification.totalXP ?? 0;

  // Use server-calculated XP progress (accurate for complex leveling formula)
  const currentLevelXP = profile.currentLevelXP ?? 0;
  const remainingXP = profile.nextLevelXP ?? 0;
  const xpRequiredForLevel = profile.xpRequiredForLevel ?? 100;

  const xpProgress = xpRequiredForLevel > 0
    ? Math.min(100, Math.max(0, (currentLevelXP / xpRequiredForLevel) * 100))
    : 0;

  // ========== PRIVACY CHECK ==========
  // Show restricted view for private/followers-only profiles
  if (profile.canViewProfile === false) {
    return (
      <PrivateProfileView
        profile={profile}
        onFollowClick={handleFollow}
        isFollowing={profile.isFollowing || false}
        followLoading={followLoading}
      />
    );
  }
  // ========== END PRIVACY CHECK ==========

  return (
    <>
      {/* Following/Followers Modal */}
      <FollowingFollowersModal
        isOpen={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        users={modalUsers}
        type={modalType}
        onUnfollow={handleUnfollowFromModal}
        onRemoveFollower={handleRemoveFollowerFromModal}
        currentUserId={user?._id || user?.id}
        isOwnProfile={isOwnProfile}
      />

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 text-sm">
                <strong>Upload Error:</strong> {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Cover Image and Avatar */}
        <div className="relative">
          <div className="h-64 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl overflow-hidden relative">
            {profile.coverImage ? (
              <img
                src={profile.coverImage.startsWith('http') ? profile.coverImage : profile.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Failed to load cover image:', profile.coverImage);
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=300&fit=crop&crop=center&auto=format&q=80"
                  alt="Default cover"
                  className="w-full h-full object-cover opacity-50"
                  onError={(e) => {
                    // If the internet image fails, show a solid gray background
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Cover Image Upload Button - Only show for own profile */}
            {isOwnProfile && (
              <div className="absolute top-4 right-4">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm hover:bg-white"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  {uploadingCover ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {uploadingCover ? 'Uploading...' : 'Edit Cover'}
                </Button>
              </div>
            )}
          </div>
          <div className="absolute -bottom-16 left-8">
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden relative">
              {profile.avatar || profile.profilePicture ? (
                <img
                  src={profile.avatar || profile.profilePicture}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load profile image:', profile.avatar || profile.profilePicture);
                    e.target.style.display = 'none';
                    // Show fallback after image fails
                    const parent = e.target.parentElement;
                    const fallback = parent.querySelector('.profile-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}

              {/* Always show fallback when no image or image fails */}
              {(() => {
                const shouldShowFallback = (!profile.avatar && !profile.profilePicture) ||
                  (profile.avatar === '' && profile.profilePicture === '');
                return shouldShowFallback ? (
                  <div className={`w-full h-full flex items-center justify-center text-white font-bold text-5xl profile-fallback border-2 shadow-lg ${getAvatarBgColor(profile.firstName || profile.lastName || profile.displayName || profile.name || 'U')}`}>
                    {getInitials(profile.firstName, profile.lastName, profile.displayName, profile.name)}
                  </div>
                ) : null;
              })()}

              {/* Hidden fallback for when image fails */}
              <div className={`w-full h-full flex items-center justify-center text-white font-bold text-5xl profile-fallback border-2 shadow-lg ${getAvatarBgColor(profile.firstName || profile.lastName || profile.displayName || profile.name || 'U')}`} style={{ display: 'none', position: 'absolute', top: 0, left: 0 }}>
                {getInitials(profile.firstName, profile.lastName, profile.displayName, profile.name)}
              </div>

              {/* Avatar Upload Button - Only show for own profile */}
              {isOwnProfile && (
                <div className="absolute -bottom-2 -right-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-full p-2"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            {isOwnProfile ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-sm"
                onClick={handleEditProfile}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm"
                  onClick={handleFollow}
                  loading={followLoading}
                >
                  {!followLoading && <Bell className="w-4 h-4 mr-2" />}
                  {profile.isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm"
                  onClick={handleMessage}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  {profile.firstName && profile.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile.firstName || profile.lastName || profile.displayName || profile.name || 'User'
                  }
                </h1>
                <p className="text-text-secondary">@{displayHandle}</p>
                {(profile.jobTitle || profile.company) && (
                  <p className="text-text-secondary">
                    {[profile.jobTitle, profile.company].filter(Boolean).join(' at ')}
                  </p>
                )}
              </div>
              {profile.bio && (
                <p className="text-text-primary max-w-2xl">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                {displayLocation && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {displayLocation}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <Link className="w-4 h-4" />
                    <a href={normalizeUrl(profile.website)} className="text-primary-500 hover:underline" target="_blank" rel="noopener noreferrer">
                      {formatDisplayUrl(profile.website)}
                    </a>
                  </div>
                )}
                {profile.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDate(profile.createdAt)}
                  </div>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEditProfile} aria-label="Edit profile">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={handleSettings} aria-label="Open settings">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {hasExtendedDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--light-text-color2)]">
                    <User className="w-5 h-5" />
                    About & Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aboutDetails.length > 0 ? (
                    aboutDetails.map((detail) => {
                      const Icon = detail.icon;
                      return (
                        <div key={detail.label} className="p-3 rounded-lg border border-border bg-secondary-50 dark:bg-secondary-900">
                          <div className="flex items-center gap-2 text-xs uppercase text-text-secondary tracking-wide">
                            <Icon className="w-4 h-4" />
                            <span>{detail.label}</span>
                          </div>
                          <div className="mt-1 text-sm font-medium text-text-primary break-words">
                            {detail.value}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-text-secondary">No profile details added yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[var(--light-text-color2)]">
                    <Mail className="w-5 h-5" />
                    Contact & Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactDetails.length > 0 ? (
                    <div className="space-y-3">
                      {contactDetails.map((detail) => {
                        const Icon = detail.icon;
                        const displayValue = detail.display || detail.value;
                        return (
                          <div key={detail.label} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary-50 dark:bg-secondary-900">
                            <Icon className="w-4 h-4 text-text-secondary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs uppercase text-text-secondary tracking-wide">{detail.label}</p>
                              {detail.href ? (
                                <a
                                  href={detail.href}
                                  className="text-sm text-primary-500 hover:underline break-words"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {displayValue}
                                </a>
                              ) : (
                                <p className="text-sm text-text-primary break-words">{displayValue}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">No contact details shared yet.</p>
                  )}

                  {socialLinks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase text-text-secondary tracking-wide">Social</p>
                      <div className="flex flex-wrap gap-2">
                        {socialLinks.map((link, index) => (
                          <a
                            key={`${link.platform}-${index}`}
                            href={normalizeUrl(link.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary-200 text-sm text-text-primary transition-colors"
                          >
                            <Link className="w-4 h-4 text-text-secondary" />
                            <span className="capitalize">{link.platform}</span>
                            <span className="text-text-secondary">{formatDisplayUrl(link.url)}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={handleShowFollowers}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-500">{profile.followerCount?.toLocaleString() || 0}</div>
                <div className="text-sm text-text-secondary">Followers</div>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={handleShowFollowing}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-500">{profile.followingCount?.toLocaleString() || 0}</div>
                <div className="text-sm text-text-secondary">Following</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-500">{profile.blogCount?.toLocaleString() || 0}</div>
                <div className="text-sm text-text-secondary">Posts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-500">{profile.totalViews?.toLocaleString() || 0}</div>
                <div className="text-sm text-text-secondary">Total Views</div>
              </CardContent>
            </Card>
          </div>

          {/* Level and XP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[var(--light-text-color2)]">
                <Trophy className="w-5 h-5 text-warning" />
                Level {level} • {totalXP.toLocaleString()} XP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-secondary-100 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-warning to-warning/80 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-text-secondary">
                {Math.max(0, remainingXP)} XP until level {level + 1}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Badges ({profile.badges.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.badges.map((badge) => (
                  <div key={badge._id || badge.id} className="text-center p-4 rounded-lg border border-border hover:border-primary-200 transition-colors">
                    <div className="text-3xl mb-2">{badge.icon || '🏆'}</div>
                    <h3 className="font-semibold text-text-primary mb-1">{badge.name}</h3>
                    <p className="text-sm text-text-secondary mb-2">{badge.description}</p>
                    <Badge variant="outline">
                      {badge.rarity || 'common'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="border-b-2 border-[var(--border-color)]">
          <nav className="flex space-x-8">
            {[
              { id: 'posts', label: 'Posts', count: profile.blogCount || 0 },
              { id: 'series', label: 'Series', count: profile.totalSeries || profile.seriesCount || userSeries.length || 0 },
              { id: 'likes', label: 'Likes', count: profile.totalLikes || likedPosts.length || 0 },
              { id: 'bookmarks', label: 'Bookmarks', count: profile.totalBookmarks || bookmarkedPosts.length || 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {blogsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-text-secondary">Loading posts...</p>
                </div>
              ) : userBlogs.length > 0 ? (
                <div className="grid gap-6">
                  {userBlogs.map((post) => (
                    <Card key={post._id || post.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openBlog(post)}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">{post.title}</h3>
                            <p className="text-text-secondary mb-3">{getCleanExcerpt(post, 150)}</p>
                          </div>
                          <div className="text-sm text-text-secondary">
                            {formatDate(post.publishedAt || post.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-text-secondary">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {calculateReadTime(post.content)} min read
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {post.likes || post.likedBy?.length || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {post.commentCount || post.comments?.length || 0}
                            </span>
                          </div>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {getViews(post).toLocaleString()} views
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No posts yet</h3>
                  <p className="text-text-secondary">Start writing your first blog post!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "series" && (
            <div className="space-y-6">
              {seriesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-text-secondary">Loading series...</p>
                </div>
              ) : userSeries.length > 0 ? (
                <div className="grid gap-6">
                  {userSeries.map((series) => (
                    <Card key={series._id || series.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openSeries(series)}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">{series.title}</h3>
                            <p className="text-text-secondary mb-3">{series.description?.substring(0, 150)}...</p>
                          </div>
                          <div className="text-sm text-text-secondary">
                            {series.episodes?.length || 0} episodes
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-text-secondary">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {series.analytics?.totalViews?.toLocaleString() || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {series.analytics?.likes?.toLocaleString() || 0}
                            </span>
                          </div>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(series.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    No series yet
                  </h3>
                  <p className="text-text-secondary">
                    Start creating your first blog series!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "likes" && (
            <div className="space-y-6">
              {likedLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-text-secondary">Loading liked posts...</p>
                </div>
              ) : likedPosts.length > 0 ? (
                <div className="grid gap-6">
                  {likedPosts.map((post) => (
                    <Card key={post._id || post.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openBlog(post)}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">{post.title}</h3>
                            <p className="text-text-secondary mb-3">{getCleanExcerpt(post, 150)}</p>
                          </div>
                          <div className="text-sm text-text-secondary">
                            {formatDate(post.publishedAt || post.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-text-secondary">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {calculateReadTime(post.content)} min read
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {post.likes || post.likedBy?.length || 0}
                            </span>
                          </div>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {getViews(post).toLocaleString()} views
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    No liked posts
                  </h3>
                  <p className="text-text-secondary">
                    Posts you like will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "bookmarks" && (
            <div className="space-y-6">
              {bookmarksLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-text-secondary">Loading bookmarked posts...</p>
                </div>
              ) : bookmarkedPosts.length > 0 ? (
                <div className="grid gap-6">
                  {bookmarkedPosts.map((post) => (
                    <Card key={post._id || post.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openBlog(post)}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">{post.title}</h3>
                            <p className="text-text-secondary mb-3">{getCleanExcerpt(post, 150)}</p>
                          </div>
                          <div className="text-sm text-text-secondary">
                            {formatDate(post.publishedAt || post.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-text-secondary">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {calculateReadTime(post.content)} min read
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {post.likes || post.likedBy?.length || 0}
                            </span>
                          </div>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {getViews(post).toLocaleString()} views
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    No bookmarks
                  </h3>
                  <p className="text-text-secondary">
                    Posts you bookmark will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
