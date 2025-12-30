import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getBlogUrl } from "../utils/blogUrlHelper";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BookOpen,
  Bookmark,
  Calendar,
  Edit,
  Eye,
  Heart,
  MessageCircle,
  Minus,
  Target,
  TrendingUp,
  Trophy,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import dashboardService from "../services/dashboardService";
import { getProfilePath } from "../utils/profileUrl";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [topBlogs, setTopBlogs] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [growthStats, setGrowthStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const periodLabels = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [dashboard, recent, top, activity, growth] = await Promise.all([
          dashboardService.getDashboardData().catch((err) => {
            console.error("Dashboard data error:", err);
            return null;
          }),
          dashboardService.getRecentBlogs(5).catch((err) => {
            console.error("Recent blogs error:", err);
            return [];
          }),
          dashboardService.getTopBlogs(5).catch((err) => {
            console.error("Top blogs error:", err);
            return [];
          }),
          dashboardService.getRecentActivity(10).catch((err) => {
            console.error("Activity error:", err);
            return [];
          }),
          dashboardService.getGrowthStats(selectedPeriod).catch((err) => {
            console.error("Growth stats error:", err);
            return null;
          }),
        ]);

        setDashboardData(dashboard);
        setRecentBlogs(recent);
        setTopBlogs(top);
        setRecentActivity(activity);
        setGrowthStats(growth);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Use user?._id instead of user object to prevent infinite re-renders
    // when user object reference changes but data stays the same
  }, [isAuthenticated, user?._id, selectedPeriod]);

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
      action: () => navigate(getProfilePath(user)),
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

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "0";
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return "0";
    if (numericValue >= 1000) {
      return numericValue.toLocaleString("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      });
    }
    return numericValue.toLocaleString();
  };

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
      <span className="flex items-center text-text-secondary text-xs font-medium">
        <Minus className="w-3 h-3 mr-1" />
        0%
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }
    return "Just now";
  };

  const getActivityIcon = (iconName) => {
    switch (iconName) {
      case "BookOpen":
        return <BookOpen className="w-4 h-4 text-primary-500" />;
      case "MessageCircle":
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "Heart":
        return <Heart className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-text-secondary" />;
    }
  };

  const computeShare = (current = 0, previous = 0) => {
    const total = current + previous;
    if (!total) return 0;
    return Math.round((current / total) * 100);
  };

  const StatCard = ({ title, value, icon: Icon, accent, helper, change }) => (
    <Card className="hover:shadow-primary-500/20 border border-[var(--border-color)] bg-surface transition-transform hover:-translate-y-0.5">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-text-secondary">
              {title}
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-semibold text-text-primary">
                {formatNumber(value)}
              </span>
              {change !== undefined && <GrowthIndicator value={change} />}
            </div>
            {helper && (
              <p className="text-sm text-text-secondary mt-1">
                {helper}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${accent}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Activity className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Failed to Load Dashboard
          </h2>
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
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-surface shadow-primary-500/20">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, rgba(var(--color-primary), 0.12), rgba(var(--color-primary), 0.05))",
          }}
        />
        <div className="absolute -left-10 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-70 pointer-events-none" />
        <div className="relative p-6 sm:p-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Calendar className="w-4 h-4" />
              <span>Dashboard overview</span>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                Welcome back, {userData.firstName || user?.name || "Creator"}!
              </h1>
              <p className="text-text-secondary mt-2">
                Your content performance snapshot across views, engagement, and growth.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="bg-primary/10 border-primary/40 text-primary-500"
              >
                <Trophy className="w-3 h-3 mr-1" />
                Level {userData.level || 1}
              </Badge>
              <Badge
                variant="outline"
                className="border-[var(--border-color)] text-text-primary"
              >
                <Zap className="w-3 h-3 mr-1" />
                {formatNumber(userData.xp || 0)} XP earned
              </Badge>
              <Badge
                variant="outline"
                className="border-primary/40 text-primary-500"
              >
                <Target className="w-3 h-3 mr-1" />
                {stats.engagementRate || 0}% engagement
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate("/create-blog")}
                variant="primary"
                className="shadow-primary-500/25"
              >
                Write a new post
              </Button>
              <Button
                onClick={() => navigate("/analytics")}
                variant="outline"
                className="border-primary/40 text-primary-500"
              >
                View analytics
              </Button>
              <Button
                onClick={() => navigate(getProfilePath(user))}
                variant="ghost"
              >
                View profile
              </Button>
            </div>
          </div>
          <div className="w-full max-w-sm">
            <div className="rounded-xl border border-[var(--border-color)] bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-text-secondary">
                    Performance window
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    {periodLabels[selectedPeriod]}
                  </p>
                </div>
                <div className="flex gap-1">
                  {Object.keys(periodLabels).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedPeriod === period
                          ? "bg-primary/10 text-primary-500 border-primary/40 shadow-primary-500/25"
                          : "bg-surface hover:border-primary/40 border-[var(--border-color)] text-text-secondary"
                      }`}
                    >
                      {period.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              {growthStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[var(--border-color)] bg-surface p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-secondary">Views</p>
                      <GrowthIndicator value={growthStats.growth?.views || 0} />
                    </div>
                    <p className="text-2xl font-semibold text-text-primary mt-1">
                      {formatNumber(growthStats.current?.views || stats.totalViews || 0)}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-surface-active overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{
                          width: `${computeShare(
                            growthStats.current?.views || 0,
                            growthStats.previous?.views || 0
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      vs previous {periodLabels[selectedPeriod]}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--border-color)] bg-surface p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-text-secondary">Blogs published</p>
                      <GrowthIndicator value={growthStats.growth?.blogs || 0} />
                    </div>
                    <p className="text-2xl font-semibold text-text-primary mt-1">
                      {formatNumber(growthStats.current?.blogs || stats.totalBlogs || 0)}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-surface-active overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${computeShare(
                            growthStats.current?.blogs || 0,
                            growthStats.previous?.blogs || 0
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      vs previous {periodLabels[selectedPeriod]}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  We’ll start showing trendlines once your content gets traction.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Published posts"
          value={stats.totalBlogs}
          helper={`${stats.draftBlogs || 0} drafts in progress`}
          icon={BookOpen}
          accent="bg-primary/10 text-primary-500"
          change={growthStats?.growth?.blogs}
        />
        <StatCard
          title="Total views"
          value={stats.totalViews}
          helper={`${stats.totalComments || 0} comments logged`}
          icon={Eye}
          accent="bg-blue-500/10 text-blue-500"
          change={growthStats?.growth?.views}
        />
        <StatCard
          title="Likes received"
          value={stats.totalLikes}
          helper={`${stats.totalBookmarks || 0} bookmarks`}
          icon={Heart}
          accent="bg-red-500/10 text-red-500"
        />
        <StatCard
          title="Followers"
          value={stats.followerCount}
          helper={`Following ${stats.followingCount || 0}`}
          icon={Users}
          accent="bg-emerald-500/10 text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border border-[var(--border-color)]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
            <div>
              <CardTitle>Performance pulse</CardTitle>
              <p className="text-sm text-text-secondary">
                How your reach and publishing cadence compare to the previous {periodLabels[selectedPeriod].toLowerCase()}.
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary-500"
            >
              {periodLabels[selectedPeriod]}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-[var(--border-color)] bg-surface">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-secondary">Views this period</p>
                    <p className="text-2xl font-semibold text-text-primary">
                      {formatNumber(growthStats?.current?.views || stats.totalViews || 0)}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-primary/10 text-primary-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary mt-2">
                  <span>vs previous window</span>
                  <GrowthIndicator value={growthStats?.growth?.views || 0} />
                </div>
              </div>
              <div className="p-4 rounded-lg border border-[var(--border-color)] bg-surface">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-secondary">Blogs published</p>
                    <p className="text-2xl font-semibold text-text-primary">
                      {formatNumber(growthStats?.current?.blogs || stats.totalBlogs || 0)}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary mt-2">
                  <span>vs previous window</span>
                  <GrowthIndicator value={growthStats?.growth?.blogs || 0} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--border-color)] pt-4">
              <div className="p-4 rounded-lg bg-surface-active border border-[var(--border-color)]">
                <p className="text-xs text-text-secondary">Engagement rate</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-semibold text-text-primary">
                    {stats.engagementRate || 0}%
                  </span>
                  <span className="text-xs text-text-secondary">
                    likes + comments per view
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-surface-active border border-[var(--border-color)]">
                <p className="text-xs text-text-secondary">Followers</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-semibold text-text-primary">
                    {formatNumber(stats.followerCount)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    following {stats.followingCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[var(--border-color)]">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="flex flex-col items-start gap-2 p-4 rounded-lg border border-[var(--border-color)] bg-surface hover:border-primary/40 hover:shadow-primary-500/10 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`p-2 rounded-md bg-surface-active ${action.color}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {action.name}
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary flex items-center gap-1">
                      Jump in <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-[var(--border-color)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent blogs</CardTitle>
            <Link
              to="/my-blogs"
              className="text-sm text-primary-500 hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBlogs.length > 0 ? (
                recentBlogs.map((blog) => (
                  <Link
                    key={blog._id}
                    to={getBlogUrl(blog)}
                    className="block p-3 rounded-lg border border-[var(--border-color)] hover:border-primary/40 hover:-translate-y-0.5 transition-all bg-surface"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-text-primary truncate">
                          {blog.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-2">
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
                          <Badge
                            variant="outline"
                            className="text-[11px] border-[var(--border-color)]"
                          >
                            {blog.tags?.[0] || "Blog"}
                          </Badge>
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
                  <BookOpen className="w-12 h-12 text-text-secondary mx-auto mb-3" />
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

        <Card className="border border-[var(--border-color)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-color)] bg-surface hover:border-primary/40 transition-colors"
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      {getActivityIcon(activity.icon)}
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
                <div className="text-center py-10">
                  <Activity className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">No recent activity yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-[var(--border-color)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top performing</CardTitle>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topBlogs.length > 0 ? (
                topBlogs.map((blog, index) => (
                  <Link
                    key={blog._id}
                    to={getBlogUrl(blog)}
                    className="block p-3 rounded-lg border border-[var(--border-color)] hover:border-emerald-400 hover:-translate-y-0.5 transition-all bg-surface"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-text-primary truncate mb-1">
                          {blog.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {blog.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {blog.likesCount || 0}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[11px] border-[var(--border-color)]"
                          >
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

        <Card className="border border-[var(--border-color)]">
          <CardHeader>
            <CardTitle>Engagement highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border border-[var(--border-color)] bg-surface-active">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-secondary">Engagement rate</p>
                  <p className="text-xl font-semibold text-text-primary">
                    {stats.engagementRate || 0}%
                  </p>
                </div>
                <Target className="w-5 h-5 text-primary-500" />
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Likes + comments + bookmarks per view
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-[var(--border-color)] bg-surface">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-secondary">Likes</p>
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-xl font-semibold text-text-primary mt-1">
                  {formatNumber(stats.totalLikes)}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border-color)] bg-surface">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-secondary">Comments</p>
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-xl font-semibold text-text-primary mt-1">
                  {formatNumber(stats.totalComments)}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border-color)] bg-surface">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-secondary">Bookmarks</p>
                  <Bookmark className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xl font-semibold text-text-primary mt-1">
                  {formatNumber(stats.totalBookmarks)}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border-color)] bg-surface">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-secondary">Views</p>
                  <Eye className="w-4 h-4 text-primary-500" />
                </div>
                <p className="text-xl font-semibold text-text-primary mt-1">
                  {formatNumber(stats.totalViews)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {userData.badges && userData.badges.length > 0 && (
        <Card className="border border-[var(--border-color)]">
          <CardHeader>
            <CardTitle>Your badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userData.badges.slice(0, 8).map((badge, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-sm border-[var(--border-color)]"
                >
                  <Trophy className="w-3 h-3 mr-1" />
                  {badge.name}
                </Badge>
              ))}
              {userData.badges.length > 8 && (
                <Badge
                  variant="outline"
                  className="text-sm border-[var(--border-color)]"
                >
                  +{userData.badges.length - 8} more
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
