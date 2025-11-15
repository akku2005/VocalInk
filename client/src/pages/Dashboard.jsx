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
  Heart,
  MessageCircle,
  Eye,
  Trophy,
  Target,
  User,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  Calendar,
  Bookmark,
  Edit,
  BarChart3,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import dashboardService from "../services/dashboardService";
import { getCleanExcerpt } from "../utils/textUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [topBlogs, setTopBlogs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [growthStats, setGrowthStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [dashboard, recent, top, activity, growth] = await Promise.all([
          dashboardService.getDashboardData().catch(err => {
            console.error('Dashboard data error:', err);
            return null;
          }),
          dashboardService.getRecentBlogs(5).catch(err => {
            console.error('Recent blogs error:', err);
            return [];
          }),
          dashboardService.getTopBlogs(5).catch(err => {
            console.error('Top blogs error:', err);
            return [];
          }),
          dashboardService.getRecentActivity(10).catch(err => {
            console.error('Activity error:', err);
            return [];
          }),
          dashboardService.getGrowthStats(selectedPeriod).catch(err => {
            console.error('Growth stats error:', err);
            return null;
          }),
        ]);

        setDashboardData(dashboard);
        setRecentBlogs(recent);
        setTopBlogs(top);
        setRecentActivity(activity);
        setGrowthStats(growth);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user, selectedPeriod]);

  // Quick actions
  const quickActions = [
    {
      name: "Write New Post",
      icon: Edit,
      action: () => navigate("/create-blog"),
      color: "text-primary-500",
    },
    {
      name: "View Profile",
      icon: User,
      action: () => navigate(`/profile/${user?.id || user?._id}`),
      color: "text-blue-500",
    },
    {
      name: "My Blogs",
      icon: BookOpen,
      action: () => navigate("/my-blogs"),
      color: "text-green-500",
    },
    {
      name: "Analytics",
      icon: BarChart3,
      action: () => navigate("/analytics"),
      color: "text-purple-500",
    },
  ];

  // Growth indicator component
  const GrowthIndicator = ({ value }) => {
    if (value > 0) {
      return (
        <span className="flex items-center text-green-500 text-xs font-medium">
          <ArrowUp className="w-3 h-3 mr-1" />
          {value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center text-red-500 text-xs font-medium">
          <ArrowDown className="w-3 h-3 mr-1" />
          {Math.abs(value)}%
        </span>
      );
    }
    return (
      <span className="flex items-center text-gray-500 text-xs font-medium">
        <Minus className="w-3 h-3 mr-1" />
        0%
      </span>
    );
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

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

  const stats = dashboardData?.stats || {};
  const userData = dashboardData?.user || {};

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-2">
              Welcome back, {userData.firstName || user?.name || 'User'}! 👋
            </h1>
            <p className="text-text-secondary text-lg mb-3">
              Here's your content performance overview
            </p>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                Level {userData.level || 1}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                {userData.xp || 0} XP
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {stats.engagementRate || 0}% Engagement
              </span>
            </div>
          </div>
          {userData.avatar && (
            <div className="hidden md:block">
              <img
                src={userData.avatar}
                alt={userData.firstName}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Blogs */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-primary-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">
              {stats.totalBlogs?.toLocaleString() || 0}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-text-secondary">
                {stats.draftBlogs || 0} drafts
              </p>
              {growthStats && (
                <GrowthIndicator value={growthStats.growth?.blogs || 0} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Views */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats.totalViews?.toLocaleString() || 0}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-text-secondary">
                All time views
              </p>
              {growthStats && (
                <GrowthIndicator value={growthStats.growth?.views || 0} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Likes */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.totalLikes?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {stats.totalComments || 0} comments
            </p>
          </CardContent>
        </Card>

        {/* Followers */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Followers</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.followerCount?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Following: {stats.followingCount || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="flex flex-col items-center justify-center p-4 rounded-lg border border-border-color hover:bg-surface hover:border-primary-500 transition-all group"
                  >
                    <Icon className={`w-6 h-6 mb-2 ${action.color} group-hover:scale-110 transition-transform`} />
                    <span className="text-sm font-medium text-text-primary text-center">
                      {action.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-surface transition-colors"
                  >
                    <div className="p-2 rounded-full bg-primary-50">
                      {activity.icon === 'BookOpen' && <BookOpen className="w-4 h-4 text-primary-500" />}
                      {activity.icon === 'MessageCircle' && <MessageCircle className="w-4 h-4 text-blue-500" />}
                      {activity.icon === 'Heart' && <Heart className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {activity.title}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {timeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">
                    No recent activity yet
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Blogs and Top Performing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Blogs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Blogs</CardTitle>
            <Link to="/my-blogs" className="text-sm text-primary-500 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBlogs.length > 0 ? (
                recentBlogs.map((blog) => (
                  <Link
                    key={blog._id}
                    to={`/article/${blog._id}`}
                    className="block p-3 rounded-lg border border-border-color hover:border-primary-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text-primary truncate mb-1">
                          {blog.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {blog.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {blog.likesCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {blog.commentsCount || 0}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-text-secondary whitespace-nowrap ml-2">
                        {formatDate(blog.publishedAt)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">No blogs yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate("/create-blog")}
                  >
                    Create your first blog
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Blogs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Performing</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topBlogs.length > 0 ? (
                topBlogs.map((blog, index) => (
                  <Link
                    key={blog._id}
                    to={`/article/${blog._id}`}
                    className="block p-3 rounded-lg border border-border-color hover:border-green-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text-primary truncate mb-1">
                          {blog.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {blog.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {blog.likesCount || 0}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {blog.engagementScore || 0}% engagement
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">No data yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Summary */}
      {userData.badges && userData.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userData.badges.slice(0, 6).map((badge, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  <Trophy className="w-3 h-3 mr-1" />
                  {badge.name}
                </Badge>
              ))}
              {userData.badges.length > 6 && (
                <Badge variant="outline" className="text-sm">
                  +{userData.badges.length - 6} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
