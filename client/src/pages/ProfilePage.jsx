import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/userService";
import { settingsService } from "../services/settingsService";
import { imageService } from "../services/imageService";
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
  Upload
} from "lucide-react";
import { getCleanExcerpt } from "../utils/textUtils";

const ProfilePage = () => {
  const { username, id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [userBlogs, setUserBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  // File input refs
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Determine if this is the current user's profile or another user's profile
  const isOwnProfile = !id && !username;
  const targetUserId = id || (profile?._id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let profileData;
        if (isOwnProfile) {
          // Get current user's profile
          profileData = await userService.getMyProfile();
        } else if (id) {
          // Get user profile by ID
          profileData = await userService.getUserProfile(id);
        } else {
          // Get user profile by username (if username is actually an ID)
          profileData = await userService.getUserProfile(username);
        }
        
        setProfile(profileData);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, username, isOwnProfile]);

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

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (profile.isFollowing) {
        await userService.unfollowUser(targetUserId);
        setProfile(prev => ({ ...prev, isFollowing: false, followerCount: prev.followerCount - 1 }));
      } else {
        await userService.followUser(targetUserId);
        setProfile(prev => ({ ...prev, isFollowing: true, followerCount: prev.followerCount + 1 }));
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
    }
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
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

  // Calculate XP progress
  const xpProgress = profile.xp ? (profile.xp % 100) : 0;
  const nextLevelXP = profile.level ? (profile.level * 100) - profile.xp : 100;

  return (
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
              >
                <Bell className="w-4 h-4 mr-2" />
                {profile.isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
              <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm">
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
              <p className="text-text-secondary">@{profile.email?.split('@')[0] || 'user'}</p>
            </div>
            {profile.bio && (
              <p className="text-text-primary max-w-2xl">{profile.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
              {profile.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.address}
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <Link className="w-4 h-4" />
                  <a href={profile.website} className="text-primary-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    {profile.website.replace(/^https?:\/\//, '')}
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
              <Button variant="outline" onClick={handleEditProfile}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-500">{profile.followerCount?.toLocaleString() || 0}</div>
              <div className="text-sm text-text-secondary">Followers</div>
            </CardContent>
          </Card>
          <Card>
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
              Level {profile.level || 1} • {profile.xp?.toLocaleString() || 0} XP
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
              {nextLevelXP} XP until level {(profile.level || 1) + 1}
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
            { id: 'series', label: 'Series', count: profile.totalSeries || 0 },
            { id: 'likes', label: 'Likes', count: profile.totalLikes || 0 },
            { id: 'bookmarks', label: 'Bookmarks', count: profile.totalBookmarks || 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === tab.id
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
                  <Card key={post._id} className="hover:shadow-lg transition-shadow cursor-pointer">
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
                            {post.readTime || Math.ceil((post.content?.length || 0) / 200)} min read
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments?.length || 0}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.views?.toLocaleString() || 0} views
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

        {activeTab === "likes" && (
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

        {activeTab === "bookmarks" && (
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
    </div>
  );
};

export default ProfilePage;
