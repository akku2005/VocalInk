 buttons-color/hover
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
  User, 
  Calendar, 
  MapPin, 
  Link, 
  Users, 
  Star, 
  Trophy, 
  BookOpen, 
 master
  MessageCircle,
  Heart,
  Share,
  Edit,
  Settings,
  Bell,
 buttons-color/hover
} from "lucide-react";

  ArrowLeft
} from 'lucide-react';
 master

const ProfilePage = () => {
  const { username, id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
 buttons-color/hover
  const [activeTab, setActiveTab] = useState("posts");

  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [userBlogs, setUserBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);

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
          console.log('🔍 Fetching current user profile...');
          profileData = await userService.getMyProfile();
          console.log('📊 Profile data received:', profileData);
          console.log('🖼️ Avatar:', profileData.avatar);
          console.log('🖼️ Profile Picture:', profileData.profilePicture);
          console.log('🖼️ Cover Image:', profileData.coverImage);
        } else if (id) {
          // Get user profile by ID
          profileData = await userService.getUserProfile(id);
        } else {
          // Get user profile by username (if username is actually an ID)
          profileData = await userService.getUserProfile(username);
        }
        
        setProfile(profileData);
        console.log('🔍 Profile loaded successfully:', {
          name: profileData.name,
          avatar: profileData.avatar,
          profilePicture: profileData.profilePicture,
          coverImage: profileData.coverImage,
          hasAvatar: !!(profileData.avatar || profileData.profilePicture)
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, username, isOwnProfile]);
 master

  useEffect(() => {
 buttons-color/hover
    // Simulate API call
    setTimeout(() => {
      setProfile({
        username: username || "johndoe",
        displayName: "John Doe",
        email: "john@example.com",
        bio: "Passionate writer and tech enthusiast. Creating content that inspires and educates.",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        coverImage:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop",
        location: "San Francisco, CA",
        website: "https://johndoe.dev",
        joinedDate: "2023-01-15",
        followers: 1247,
        following: 892,
        totalPosts: 45,
        totalLikes: 15420,
        totalViews: 89234,
        xp: 15420,
        level: 8,
        badges: [
          {
            id: 1,
            name: "First Post",
            description: "Published your first blog post",
            icon: "🎉",
            rarity: "common",
          },
          {
            id: 2,
            name: "Engagement Master",
            description: "Received 100+ likes on a single post",
            icon: "🔥",
            rarity: "rare",
          },
          {
            id: 3,
            name: "Series Creator",
            description: "Created a blog series with 5+ posts",
            icon: "📚",
            rarity: "epic",
          },
          {
            id: 4,
            name: "AI Pioneer",
            description: "Used AI features 50+ times",
            icon: "🤖",
            rarity: "legendary",
          },
        ],
        recentPosts: [
          {
            id: 1,
            title: "The Future of AI in Content Creation",
            excerpt:
              "Exploring how artificial intelligence is revolutionizing...",
            publishedAt: "2024-01-15",
            readTime: 8,
            likes: 124,
            comments: 23,
            views: 1542,
          },
          {
            id: 2,
            title: "Building a Successful Blog Series",
            excerpt: "Learn the strategies and techniques needed...",
            publishedAt: "2024-01-12",
            readTime: 12,
            likes: 89,
            comments: 15,
            views: 892,
          },
        ],
      });
      setLoading(false);
    }, 1000);
  }, [username]);

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
 master

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
      {/* Cover Image and Avatar */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl overflow-hidden">
 buttons-color/hover
          <img
            src={profile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden">
            <img
              src={profile.avatar}
              alt={profile.displayName}

          {profile.coverImage ? (
            <img 
              src={profile.coverImage.startsWith('http') ? profile.coverImage : profile.coverImage} 
              alt="Cover" 
 master
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
              console.log('🔍 Fallback check:', {
                avatar: profile.avatar,
                profilePicture: profile.profilePicture,
                shouldShowFallback,
                name: profile.name
              });
              return shouldShowFallback ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-5xl profile-fallback border-2 border-blue-400 shadow-lg">
                  {profile.name && profile.name.length > 0 ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
              ) : null;
            })()}
            
            {/* Hidden fallback for when image fails */}
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-5xl profile-fallback border-2 border-blue-400 shadow-lg" style={{ display: 'none', position: 'absolute', top: 0, left: 0 }}>
              {profile.name && profile.name.length > 0 ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
 buttons-color/hover
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-100 text-black border border-gray-400 backdrop-blur-sm hover:bg-gray-200"
          >
            <Bell className="w-4 h-4 mr-2" />
            Follow
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-100 text-black border border-gray-400 hover:bg-gray-200 backdrop-blur-sm"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>

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
 master
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-16 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-4">
            <div>
 buttons-color/hover
              <h1 className="text-3xl font-bold text-text-primary">
                {profile.displayName}
              </h1>
              <p className="text-text-secondary">@{profile.username}</p>
            </div>
            <p className="text-text-primary max-w-2xl">{profile.bio}</p>


              <h1 className="text-3xl font-bold text-text-primary">{profile.name}</h1>
              <p className="text-text-secondary">@{profile.email?.split('@')[0] || 'user'}</p>
            </div>
            {profile.bio && (
              <p className="text-text-primary max-w-2xl">{profile.bio}</p>
            )}
            
 master
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
 buttons-color/hover
                  <a
                    href={profile.website}
                    className="text-primary-500 hover:underline"
                  >
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined{" "}
                {new Date(profile.joinedDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </div>

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
 master
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
 buttons-color/hover
              <div className="text-2xl font-bold text-primary-500">
                {profile.followers.toLocaleString()}
              </div>

              <div className="text-2xl font-bold text-primary-500">{profile.followerCount?.toLocaleString() || 0}</div>
 master
              <div className="text-sm text-text-secondary">Followers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
 buttons-color/hover
              <div className="text-2xl font-bold text-primary-500">
                {profile.following.toLocaleString()}
              </div>

              <div className="text-2xl font-bold text-primary-500">{profile.followingCount?.toLocaleString() || 0}</div>
 master
              <div className="text-sm text-text-secondary">Following</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
 buttons-color/hover
              <div className="text-2xl font-bold text-primary-500">
                {profile.totalPosts}
              </div>

              <div className="text-2xl font-bold text-primary-500">{profile.blogCount?.toLocaleString() || 0}</div>
 master
              <div className="text-sm text-text-secondary">Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
 buttons-color/hover
              <div className="text-2xl font-bold text-primary-500">
                {profile.totalViews.toLocaleString()}
              </div>

              <div className="text-2xl font-bold text-primary-500">{profile.totalViews?.toLocaleString() || 0}</div>
= master
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
 buttons-color/hover
      <Card>
        <CardHeader>
          <CardTitle className="font-bold text-[var(--light-text-color2)]">
            Badges ({profile.badges.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className="text-center p-4 rounded-lg border-2 border-[var(--border-color)] hover:border-primary-200 transition-colors"
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <h3 className="font-semibold text-[var(--light-text-color2)] mb-1">
                  {badge.name}
                </h3>
                <p className="text-sm text-text-secondary mb-2">
                  {badge.description}
                </p>
                <Badge
                  variant={badge.rarity === "legendary" ? "default" : "outline"}
                >
                  {badge.rarity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
 master

      {/* Tabs */}
      <div className="border-b-2 border-[var(--border-color)]">
        <nav className="flex space-x-8">
          {[
 buttons-color/hover
            { id: "posts", label: "Posts", count: profile.recentPosts.length },
            { id: "series", label: "Series", count: 3 },
            { id: "likes", label: "Likes", count: 156 },
            { id: "bookmarks", label: "Bookmarks", count: 42 },

            { id: 'posts', label: 'Posts', count: profile.blogCount || 0 },
            { id: 'series', label: 'Series', count: profile.totalSeries || 0 },
            { id: 'likes', label: 'Likes', count: profile.totalLikes || 0 },
            { id: 'bookmarks', label: 'Bookmarks', count: profile.totalBookmarks || 0 }
 master
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
 buttons-color/hover
        {activeTab === "posts" && (
          <div className="grid gap-6">
            {profile.recentPosts.map((post) => (
              <Card
                key={post.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--light-text-color2)] mb-2">
                        {post.title}
                      </h3>
                      <p className="text-text-secondary mb-3">{post.excerpt}</p>
                    </div>
                    <div className="text-sm text-text-secondary">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {post.readTime} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.views.toLocaleString()} views
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

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
                          <p className="text-text-secondary mb-3">{post.excerpt || post.content?.substring(0, 150) + '...'}</p>
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
 master
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
