import { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import CustomDropdown from "../components/ui/CustomDropdown";
import {
  Activity,
  Calendar,
  Download,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import dashboardService from "../services/dashboardService";
import useAnalyticsPreferences from "../hooks/useAnalyticsPreferences";
import StatCard from "../components/analytics/StatCard";
import GrowthChart from "../components/analytics/GrowthChart";
import { AgeDistributionChart, LocationChart } from "../components/analytics/DemographicsCharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";

const timeOptions = [
  { id: "7d", name: "Last 7 days" },
  { id: "30d", name: "Last 30 days" },
  { id: "90d", name: "Last 90 days" },
  { id: "1y", name: "Last year" },
];

const metricOptions = [
  { id: "views", name: "Views" },
  { id: "likes", name: "Likes" },
  { id: "engagement", name: "Engagement" },
];

const bestTimes = [
  { label: "8 AM", percentage: 85 },
  { label: "12 PM", percentage: 72 },
  { label: "6 PM", percentage: 64 },
];

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M6 2a2 2 0 0 0-2 2v17l8-5 8 5V4a2 2 0 0 0-2-2H6z" />
  </svg>
);

const AnalyticsPage = () => {
  const {
    timeRange,
    setTimeRange,
    preferredMetric,
    setPreferredMetric,
  } = useAnalyticsPreferences();

  const [dashboardOverview, setDashboardOverview] = useState(null);
  const [personalAnalytics, setPersonalAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState({
    overview: true,
    personal: true,
    activity: true,
  });
  const [errors, setErrors] = useState({
    overview: null,
    personal: null,
    activity: null,
  });

  const formatNumber = (value = 0) => {
    const num = Number(value) || 0;
    return num >= 1000 ? num.toLocaleString() : String(num);
  };

  const loadOverview = async () => {
    setLoading((prev) => ({ ...prev, overview: true }));
    try {
      const data = await dashboardService.getDashboardData();
      setDashboardOverview(data);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        overview: "Unable to load overview.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, overview: false }));
    }
  };

  const loadPersonalAnalytics = async () => {
    setLoading((prev) => ({ ...prev, personal: true }));
    try {
      const data = await dashboardService.getPersonalAnalytics(timeRange);
      setPersonalAnalytics(data);
      setErrors((prev) => ({ ...prev, personal: null }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        personal: "Could not load personalized analytics.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, personal: false }));
    }
  };

  const loadActivity = async () => {
    setLoading((prev) => ({ ...prev, activity: true }));
    try {
      const data = await dashboardService.getRecentActivity(6);
      setActivity(data);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        activity: "Could not load activity feed.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, activity: false }));
    }
  };

  useEffect(() => {
    loadOverview();
    loadActivity();
    loadPersonalAnalytics();
  }, []);

  useEffect(() => {
    loadPersonalAnalytics();
  }, [timeRange]);

  const handleDownloadReport = () => {
    window.print();
  };

  const summaryStats = useMemo(() => {
    if (!dashboardOverview?.stats) return [];
    const stats = dashboardOverview.stats;

    return [
      {
        label: "Total Views",
        value: stats.totalViews?.toLocaleString() || "0",
        icon: Eye,
        color: "blue",
        trend: "up",
        trendValue: "12%",
      },
      {
        label: "Total Likes",
        value: stats.totalLikes?.toLocaleString() || "0",
        icon: Heart,
        color: "rose",
        trend: "up",
        trendValue: "8%",
      },
      {
        label: "Comments",
        value: stats.totalComments?.toLocaleString() || "0",
        icon: MessageCircle,
        color: "amber",
        trend: "down",
        trendValue: "3%",
      },
      {
        label: "Followers",
        value: dashboardOverview.stats?.followerCount?.toLocaleString() || "0",
        icon: Users,
        color: "emerald",
        trend: "up",
        trendValue: "24%",
      },
    ];
  }, [dashboardOverview]);

  const normalizedAgeGroups = useMemo(() => {
    const groups = personalAnalytics?.audience?.ageGroups || [];
    const total = groups.reduce((sum, group) => sum + (group.value || 0), 0);

    return groups.map((group) => {
      const value = group.value || 0;
      const percent = total ? Math.round((value / total) * 100) : 0;
      return {
        range: group.range || group.label || "Unknown",
        value: percent,
        raw: value,
      };
    });
  }, [personalAnalytics]);

  const normalizedLocations = useMemo(() => {
    const locs = personalAnalytics?.audience?.locations || [];
    const total = locs.reduce((sum, loc) => sum + (loc.value || 0), 0);

    return locs.map((loc) => {
      const value = loc.value || 0;
      const percent = total ? Math.round((value / total) * 100) : 0;
      return {
        label: loc.label,
        value: percent,
        raw: value,
      };
    });
  }, [personalAnalytics]);

  const growthData = useMemo(() => {
    const timeline = personalAnalytics?.timeline || [];
    const metricKey = preferredMetric === 'engagement' ? 'likes' : preferredMetric;

    return timeline.map((point) => ({
      date: point.label || point.date || '',
      value:
        (metricKey && point[metricKey] !== undefined)
          ? point[metricKey]
          : point.views || 0,
    }));
  }, [personalAnalytics, preferredMetric]);

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden bg-background text-text-primary">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -left-24 -top-24 w-80 h-80 rounded-full bg-primary-500/10 blur-[120px]" />
        <div className="absolute -right-24 top-10 w-64 h-64 rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute right-10 bottom-0 w-72 h-72 rounded-full bg-emerald-400/10 blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10"
        >
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-text-primary mb-2">Analytics Dashboard</h2>
            <p className="text-lg text-text-secondary">Track performance, audience pulse, and publishing signals.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CustomDropdown
              label="Time Range"
              options={timeOptions}
              value={timeRange}
              onChange={setTimeRange}
              variant="outline"
            />
            <CustomDropdown
              label="Metric"
              options={metricOptions}
              value={preferredMetric}
              onChange={setPreferredMetric}
              variant="outline"
            />
            <Button variant="primary" onClick={handleDownloadReport} className="flex items-center gap-2 shadow-lg shadow-primary-500/20">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat, index) => (
            <StatCard
              key={stat.label}
              {...stat}
              delay={index * 0.08}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 h-full border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Growth Trend ({timeRange})
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[440px]">
              <GrowthChart data={growthData} title="" color="#6366f1" />
            </CardContent>
          </Card>

          <Card className="h-full border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Publishing Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {(personalAnalytics?.bestTimes || bestTimes).map((slot, idx) => {
                const value = slot.value ?? slot.percentage ?? 0;
                return (
                  <div key={`${slot.label}-${idx}`} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{slot.label}</span>
                      <span className="font-semibold text-text-primary">{value}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-secondary-100 dark:bg-gray-700 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border border-border bg-white/40 dark:bg-gray-900/40">
                  <p className="text-text-secondary mb-1">Engagement rate</p>
                  <p className="text-xl font-semibold text-text-primary">{dashboardOverview?.stats?.engagementRate || 0}%</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-white/40 dark:bg-gray-900/40">
                  <p className="text-text-secondary mb-1">Followers</p>
                  <p className="text-xl font-semibold text-text-primary">{formatNumber(dashboardOverview?.stats?.followerCount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AgeDistributionChart data={normalizedAgeGroups} />
            <LocationChart data={normalizedLocations} />
          </div>

          <Card className="h-full border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                Engagement Mix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Likes", value: dashboardOverview?.stats?.totalLikes, icon: <Heart className="w-4 h-4" />, gradient: "from-pink-500 to-rose-500" },
                { label: "Comments", value: dashboardOverview?.stats?.totalComments, icon: <MessageCircle className="w-4 h-4" />, gradient: "from-amber-500 to-orange-500" },
                { label: "Bookmarks", value: dashboardOverview?.stats?.totalBookmarks, icon: <BookmarkIcon />, gradient: "from-blue-500 to-indigo-500" },
                { label: "Views", value: dashboardOverview?.stats?.totalViews, icon: <Eye className="w-4 h-4" />, gradient: "from-emerald-500 to-teal-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-white/40 dark:bg-gray-900/40">
                  <div className="flex items-center gap-2 text-sm text-text-primary">
                    <span className={`p-2 rounded-md bg-gradient-to-br ${item.gradient} text-white`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <span className="font-semibold text-text-primary">{formatNumber(item.value)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {errors.activity && <p className="text-sm text-error-500">{errors.activity}</p>}
              {loading.activity ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-text-secondary">No recent activity to display.</p>
              ) : (
                <div className="grid gap-3">
                  {activity.map((item, index) => (
                    <motion.div
                      key={`${item.title}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + (index * 0.05) }}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
                    >
                      <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mt-1">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                      </div>
                      <div className="text-[0.7rem] text-text-secondary whitespace-nowrap flex items-center gap-1 bg-secondary-50 dark:bg-gray-800 px-2 py-1 rounded-full">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                Audience Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg border border-border bg-white/40 dark:bg-gray-900/40">
                <p className="text-xs text-text-secondary">Top region</p>
                <p className="text-base font-semibold text-text-primary">
                  {normalizedLocations?.[0]?.label || "No data"}
                </p>
                <p className="text-xs text-text-secondary">{normalizedLocations?.[0]?.value || 0}% of audience</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-white/40 dark:bg-gray-900/40">
                <p className="text-xs text-text-secondary">Primary age band</p>
                <p className="text-base font-semibold text-text-primary">
                  {normalizedAgeGroups?.[0]?.range || "No data"}
                </p>
                <p className="text-xs text-text-secondary">{normalizedAgeGroups?.[0]?.value || 0}% of audience</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
