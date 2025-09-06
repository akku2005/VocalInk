import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import {
  TrendingUp,
  Users,
  BookOpen,
  Zap,
  Activity,
  Calendar,
  Clock,
  Star,
  Award,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Trophy,
  Target,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, fetchUserProfile, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (isAuthenticated && user && !userProfile) {
        try {
          setLoading(true);
          const result = await fetchUserProfile();
          if (!result.success) {
            setError(result.error);
          }
        } catch (err) {
          setError('Failed to load user profile');
        } finally {
          setLoading(false);
        }
      } else if (!isAuthenticated || !user) {
        setLoading(false);
      } else if (userProfile) {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [isAuthenticated, user, userProfile]);

  // Debug logging
  useEffect(() => {
    console.log('Dashboard - Auth state:', { isAuthenticated, user, userProfile });
    if (userProfile) {
      console.log('Dashboard - UserProfile keys:', Object.keys(userProfile));
      console.log('Dashboard - UserProfile name field:', userProfile.name);
    }
  }, [isAuthenticated, user, userProfile]);

  // Generate recent activity based on user data
  const getRecentActivity = () => {
    if (!userProfile) return [];
    
    const activities = [];
    
    // Add activity based on user stats
    if (userProfile.blogCount > 0) {
      activities.push({
        id: 1,
        type: "blog",
        title: "Blog posts published",
        description: `You have ${userProfile.blogCount} published blog${userProfile.blogCount !== 1 ? 's' : ''}`,
        time: "Recent",
        icon: BookOpen,
        color: "text-primary-500",
      });
    }
    
    if (userProfile.totalLikes > 0) {
      activities.push({
        id: 2,
        type: "likes",
        title: "Likes received",
        description: `Your content has received ${userProfile.totalLikes} likes`,
        time: "All time",
        icon: Heart,
        color: "text-red-500",
      });
    }
    
    if (userProfile.followerCount > 0) {
      activities.push({
        id: 3,
        type: "followers",
        title: "Followers gained",
        description: `${userProfile.followerCount} people are following you`,
        time: "Total",
        icon: Users,
        color: "text-blue-500",
      });
    }
    
    if (userProfile.xp > 0) {
      activities.push({
        id: 4,
        type: "xp",
        title: "Experience points earned",
        description: `You have ${userProfile.xp} XP (Level ${userProfile.level || 1})`,
        time: "Current",
        icon: Trophy,
        color: "text-yellow-500",
      });
    }
    
    return activities;
  };

  const quickActions = [
    {
      name: "Write New Post",
      icon: BookOpen,
      action: () => navigate("/create-blog"),
    },
    {
      name: "View Profile",
      icon: User,
      action: () => navigate(`/profile/${user?.id || user?._id}`),
    },
    {
      name: "My Blogs",
      icon: BookOpen,
      action: () => navigate("/my-blogs"),
    },
    {
      name: "Leaderboard",
      icon: Trophy,
      action: () => navigate("/leaderboard"),
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Activity className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Failed to Load Dashboard</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Get user stats with fallbacks
  const stats = {
    totalViews: userProfile?.totalViews || 0,
    totalLikes: userProfile?.totalLikes || 0,
    totalComments: userProfile?.totalComments || 0,
    totalShares: userProfile?.totalShares || 0,
    blogCount: userProfile?.blogCount || 0,
    followerCount: userProfile?.followerCount || 0,
    followingCount: userProfile?.followingCount || 0,
    xp: userProfile?.xp || 0,
    level: userProfile?.level || 1,
    engagementScore: userProfile?.engagementScore || 0,
  };

  const recentActivity = getRecentActivity();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-8 border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-3">
              Welcome back, {userProfile ? userProfile.firstName || userProfile.email?.split('@')[0] || 'User' : user?.name || 'User'}! 👋
            </h1>
            <p className="text-text-secondary text-lg mb-2">
              Here's what's happening with your VocalInk account today.
            </p>
            {userProfile && (
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Level {stats.level}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  {stats.xp} XP
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {stats.engagementScore}% Engagement
                </span>
              </div>
            )}
          </div>
          {userProfile?.avatar && (
            <div className="hidden md:block">
              <img
                src={userProfile.avatar}
                alt={user?.name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">
              {stats.blogCount.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary">
              Published articles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.totalLikes.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary">
              Across all content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Followers</CardTitle>
            <Users className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats.followerCount.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary">
              Following: {stats.followingCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Experience</CardTitle>
            <Trophy className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.xp.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary">
              Level {stats.level}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={action.action}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm text-center leading-tight">
                      {action.name}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Your Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3 p-2 rounded-lg hover:bg-surface transition-colors"
                    >
                      <div
                        className={`p-2 rounded-full bg-surface ${activity.color}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">
                          {activity.title}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {activity.description}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">
                    Start creating content to see your activity here!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Profile Summary */}
      {userProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-medium">Account Status</span>
                </div>
                <Badge variant={userProfile.isVerified ? "success" : "warning"}>
                  {userProfile.isVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>

              {userProfile.bio && (
                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-2">Bio</h4>
                  <p className="text-sm text-text-secondary">{userProfile.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-color">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-500">{stats.engagementScore}%</div>
                  <div className="text-xs text-text-secondary">Engagement Score</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-500">{userProfile.badges?.length || 0}</div>
                  <div className="text-xs text-text-secondary">Badges Earned</div>
                </div>
              </div>

              {userProfile.badges && userProfile.badges.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-2">Recent Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.badges.slice(0, 3).map((badge, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        {badge.name}
                      </Badge>
                    ))}
                    {userProfile.badges.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{userProfile.badges.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
