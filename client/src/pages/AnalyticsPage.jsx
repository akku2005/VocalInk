import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import CustomDropdown from "../components/ui/CustomDropdown";
import {
  TrendingUp,
  Target,
  Activity,
  Calendar,
  Clock,
  PieChart,
  Heart,
} from "lucide-react";
import dashboardService from "../services/dashboardService";
import useAnalyticsPreferences from "../hooks/useAnalyticsPreferences";

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

const formatNumber = (value) =>
  typeof value === "number" ? value.toLocaleString() : value;

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

  const primaryMetric = useMemo(() => {
    const stats = personalAnalytics?.stats;
    if (!stats) return null;
    if (preferredMetric === "likes") {
      return {
        label: "Total likes",
        value: stats.totalLikes,
        detail: `${stats.totalLikes} total likes`,
      };
    }
    if (preferredMetric === "engagement") {
      return {
        label: "Engagement rate",
        value: `${stats.engagementRate}%`,
        detail: `${stats.engagementRate}% of viewers interact`,
      };
    }
    return {
      label: "Total views",
      value: stats.totalViews,
      detail: `${stats.totalViews} page views`,
    };
  }, [personalAnalytics, preferredMetric]);

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

  const summaryCards = useMemo(() => {
    if (!dashboardOverview?.stats) return [];
    const stats = dashboardOverview.stats;
    return [
      {
        label: "Total followers",
        value: formatNumber(dashboardOverview.stats?.followerCount || 0),
        icon: <Target className="w-5 h-5 text-primary-500" />,
      },
      {
        label: "Total likes",
        value: formatNumber(stats.totalLikes),
        icon: <Heart className="w-5 h-5 text-primary-500" />,
      },
      {
        label: "Total comments",
        value: formatNumber(stats.totalComments),
        icon: <Activity className="w-5 h-5 text-primary-500" />,
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
    <div className="space-y-8 print:p-0 print:bg-white bg-surface-light text-text-primary">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold">Analytics & Personalization</h2>
        <Button variant="secondary" onClick={handleDownloadReport}>
          Download PDF Report
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-1/3 grid gap-3">
          {summaryCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-lg">{card.icon}</div>
                <div>
                  <p className="text-xs text-text-secondary">{card.label}</p>
                  <p className="text-2xl font-semibold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="w-full lg:w-2/3 grid gap-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Growth ({timeRange})
              </CardTitle>
              <div className="flex gap-3">
                <CustomDropdown
                  label="Time Range"
                  options={timeOptions}
                  value={timeRange}
                  onChange={setTimeRange}
                  variant="ghost"
                />
                <CustomDropdown
                  label="Focus Metric"
                  options={metricOptions}
                  value={preferredMetric}
                  onChange={setPreferredMetric}
                  variant="ghost"
                />
              </div>
            </CardHeader>
            <CardContent>
              {errors.personal && <p className="text-sm text-error-500">{errors.personal}</p>}
              {loading.personal ? (
                <p className="text-sm text-text-secondary">Loading growth chart…</p>
              ) : personalAnalytics?.timeline?.length === 0 ? (
                <p className="text-sm text-text-secondary">Waiting for data.</p>
              ) : (
                <Analytics3DBarChart data={personalAnalytics?.timeline || []} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                Focus Metric
              </CardTitle>
            </CardHeader>
            <CardContent>
            {loading.overview ? (
              <p className="text-sm text-text-secondary">Loading focus metrics…</p>
            ) : personalAnalytics ? (
              <>
                <p className="text-xs text-text-secondary">{primaryMetric?.label}</p>
                <p className="text-3xl font-semibold text-text-primary">
                  {primaryMetric?.value?.toLocaleString
                      ? primaryMetric.value.toLocaleString()
                      : primaryMetric?.value || "—"}
                  </p>
                  <p className="text-sm text-text-secondary">{primaryMetric?.detail}</p>
                </>
              ) : (
                <p className="text-sm text-text-secondary">No data yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Age Range</CardTitle>
          </CardHeader>
          <CardContent>
            {normalizedAgeGroups.map((group) => (
              <div key={group.range} className="flex items-center gap-3 mb-3">
                <div className="text-xs w-12 text-text-secondary">{group.range}</div>
                <div className="flex-1 bg-secondary-100 h-2 rounded-full">
                  <div
                    className="bg-primary-500 h-2 rounded-full"
                    style={{ width: `${group.value}%` }}
                  ></div>
                </div>
                <span className="text-xs text-text-primary">{group.value}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
          </CardHeader>
          <CardContent>
            {normalizedLocations.map((loc) => (
              <div key={loc.label} className="flex items-center justify-between mb-3 text-sm text-text-secondary">
                <span>{loc.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-secondary-100 h-2 rounded-full">
                    <div className="bg-accent h-2 rounded-full" style={{ width: `${loc.value}%` }}></div>
                  </div>
                  <span className="text-text-primary">{loc.value}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Times to Publish</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(() => {
              const raw = personalAnalytics?.bestTimes || bestTimes;
              const maxValue = Math.max(...raw.map((item) => item.value ?? item.percentage ?? 0), 1);
              return raw.map((time) => {
                const value = time.value ?? time.percentage ?? 0;
                const percentage = time.percentage ?? Math.round((value / maxValue) * 100);
                return (
                  <div key={time.label} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{time.label}</span>
                    <span className="text-sm font-semibold">{percentage}% engagement</span>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errors.activity && <p className="text-sm text-error-500">{errors.activity}</p>}
          {loading.activity ? (
            <p className="text-sm text-text-secondary">Loading activity feed…</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-text-secondary">No recent activity to display.</p>
          ) : (
            <div className="grid gap-3">
              {activity.map((item, index) => (
                <div key={`${item.title}-${index}`} className="border border-border rounded-lg p-3 bg-white">
                  <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                  <p className="text-xs text-text-secondary">{item.description}</p>
                  <p className="text-[0.7rem] text-text-secondary mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Analytics3DBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map((entry) => entry.value || 0), 1);
  return (
    <div className="relative h-48" style={{ perspective: 800 }}>
      <div className="absolute inset-0 grid grid-cols-5 items-end gap-3 px-2">
        {data.map((entry) => {
          const height = ((entry.value || 0) / maxValue) * 100;
          return (
            <div key={entry.label} className="flex flex-col items-center">
              <div
                className="relative w-11/12 bg-transparent"
                style={{ height: `${height}%` }}
              >
                <div
                  className="absolute inset-0 rounded-sm bg-gradient-to-br from-primary-500 to-fuchsia-500 shadow-2xl"
                  style={{
                    transform: "skewX(-15deg) translateZ(0)",
                    transformOrigin: "bottom left",
                  }}
                ></div>
                <div
                  className="absolute inset-0 rounded-sm bg-gradient-to-tl from-white/30 to-transparent"
                  style={{
                    transform: "translateY(-50%) scale(0.9) rotateX(60deg)",
                    transformOrigin: "center",
                  }}
                ></div>
              </div>
              <p className="text-xs text-text-secondary mt-2">{entry.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyticsPage;
