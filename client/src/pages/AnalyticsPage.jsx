import { useState, useEffect, useMemo } from "react";
import Button from "../components/ui/Button";
import CustomDropdown from "../components/ui/CustomDropdown";
import {
  Target,
  Activity,
  Calendar,
  Download,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
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

const ageGroups = [
  { range: "13-17", value: 8 },
  { range: "18-24", value: 28 },
  { range: "25-34", value: 32 },
  { range: "35-44", value: 20 },
  { range: "45-54", value: 7 },
  { range: "55-64", value: 4 },
  { range: "65+", value: 1 },
];

const locations = [
  { label: "New York", value: 28 },
  { label: "San Francisco", value: 22 },
  { label: "London", value: 18 },
  { label: "Toronto", value: 10 },
  { label: "Bengaluru", value: 8 },
];

const bestTimes = [
  { label: "8 AM", percentage: 85 },
  { label: "12 PM", percentage: 72 },
  { label: "6 PM", percentage: 64 },
];

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

    // Calculate fake trends for demo purposes if real ones aren't available
    // In a real app, these would come from the API comparison with previous period
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
    const groups = personalAnalytics?.audience?.ageGroups || ageGroups;
    const total = groups.reduce((sum, group) => sum + (group.value || 0), 0);

    return groups.map((group) => {
      const value = group.value || 0;
      const percent = total ? Math.round((value / total) * 100) : 0;
      return {
        range: group.range || group.label || "—",
        value: percent,
        raw: value,
      };
    });
  }, [personalAnalytics]);

  const normalizedLocations = useMemo(() => {
    const locs = personalAnalytics?.audience?.locations || locations;
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

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden bg-background text-text-primary">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-10"
        >
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-text-primary mb-2">Analytics Dashboard</h2>
            <p className="text-lg text-text-secondary">Track your content performance and audience growth.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CustomDropdown
              label="Time Range"
              options={timeOptions}
              value={timeRange}
              onChange={setTimeRange}
              variant="outline"
            />
            <Button variant="primary" onClick={handleDownloadReport} className="flex items-center gap-2 shadow-lg shadow-primary-500/20">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat, index) => (
            <StatCard
              key={stat.label}
              {...stat}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[500px]">
            <GrowthChart
              data={personalAnalytics?.timeline || []}
              title={`Growth Trend (${timeRange})`}
              color="#6366f1"
            />
          </div>
          <div className="space-y-6">
            <div className="h-[238px]">
              <AgeDistributionChart data={normalizedAgeGroups} />
            </div>
            <div className="h-[238px]">
              <LocationChart data={normalizedLocations} />
            </div>
          </div>
        </div>

        {/* Bottom Section: Best Times & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="h-full border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="w-5 h-5 text-amber-500" />
                  Best Times to Publish
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 p-6">
                {(() => {
                  const raw = personalAnalytics?.bestTimes || bestTimes;
                  const maxValue = Math.max(...raw.map((item) => item.value ?? item.percentage ?? 0), 1);
                  return raw.map((time, index) => {
                    const value = time.value ?? time.percentage ?? 0;
                    const percentage = time.percentage ?? Math.round((value / maxValue) * 100);
                    return (
                      <div key={time.label} className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-secondary">{time.label}</span>
                          <span className="text-sm font-bold text-text-primary">{percentage}%</span>
                        </div>
                        <div className="w-full bg-secondary-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="h-full border-border/50 bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
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
                        transition={{ duration: 0.3, delay: 0.6 + (index * 0.05) }}
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
