import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share, 
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  BookOpen
} from 'lucide-react';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAnalytics({
        overview: {
          totalViews: 89234,
          totalLikes: 15420,
          totalComments: 3240,
          totalShares: 1890,
          avgReadTime: 4.2,
          bounceRate: 23.5,
          engagementRate: 8.7
        },
        trends: {
          views: { current: 89234, previous: 78456, change: 13.7 },
          likes: { current: 15420, previous: 14230, change: 8.4 },
          comments: { current: 3240, previous: 2890, change: 12.1 },
          shares: { current: 1890, previous: 1650, change: 14.5 }
        },
        topPosts: [
          {
            id: 1,
            title: 'The Future of AI in Content Creation',
            views: 15420,
            likes: 1240,
            comments: 89,
            shares: 156,
            avgReadTime: 6.2,
            engagementRate: 9.8
          },
          {
            id: 2,
            title: 'Building a Successful Blog Series',
            views: 12340,
            likes: 890,
            comments: 67,
            shares: 123,
            avgReadTime: 8.1,
            engagementRate: 8.7
          },
          {
            id: 3,
            title: 'Voice-to-Text: The Next Big Thing',
            views: 9876,
            likes: 756,
            comments: 45,
            shares: 98,
            avgReadTime: 5.4,
            engagementRate: 9.1
          }
        ],
        audienceInsights: {
          demographics: {
            ageGroups: [
              { range: '18-24', percentage: 25 },
              { range: '25-34', percentage: 35 },
              { range: '35-44', percentage: 22 },
              { range: '45+', percentage: 18 }
            ],
            locations: [
              { country: 'United States', percentage: 45 },
              { country: 'United Kingdom', percentage: 18 },
              { country: 'Canada', percentage: 12 },
              { country: 'Australia', percentage: 8 },
              { country: 'Others', percentage: 17 }
            ]
          },
          devices: [
            { type: 'Desktop', percentage: 52 },
            { type: 'Mobile', percentage: 38 },
            { type: 'Tablet', percentage: 10 }
          ],
          sources: [
            { source: 'Direct', percentage: 35 },
            { source: 'Social Media', percentage: 28 },
            { source: 'Search', percentage: 22 },
            { source: 'Referral', percentage: 15 }
          ]
        },
        engagementMetrics: {
          scrollDepth: [
            { depth: '25%', percentage: 85 },
            { depth: '50%', percentage: 62 },
            { depth: '75%', percentage: 38 },
            { depth: '100%', percentage: 24 }
          ],
          timeOnPage: [
            { range: '0-30s', percentage: 25 },
            { range: '30s-2min', percentage: 35 },
            { range: '2-5min', percentage: 28 },
            { range: '5min+', percentage: 12 }
          ]
        }
      });
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-error" />;
    return <Activity className="w-4 h-4 text-text-secondary" />;
  };

  const getTrendColor = (change) => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-error';
    return 'text-text-secondary';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Analytics Dashboard</h1>
          <p className="text-text-secondary">Track your content performance and audience insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-text-primary"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">
              {analytics.overview.totalViews.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(analytics.trends.views.change)}
              <span className={`text-sm ${getTrendColor(analytics.trends.views.change)}`}>
                {analytics.trends.views.change > 0 ? '+' : ''}{analytics.trends.views.change}%
              </span>
              <span className="text-sm text-text-secondary">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">
              {analytics.overview.totalLikes.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(analytics.trends.likes.change)}
              <span className={`text-sm ${getTrendColor(analytics.trends.likes.change)}`}>
                {analytics.trends.likes.change > 0 ? '+' : ''}{analytics.trends.likes.change}%
              </span>
              <span className="text-sm text-text-secondary">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageCircle className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">
              {analytics.overview.totalComments.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(analytics.trends.comments.change)}
              <span className={`text-sm ${getTrendColor(analytics.trends.comments.change)}`}>
                {analytics.trends.comments.change > 0 ? '+' : ''}{analytics.trends.comments.change}%
              </span>
              <span className="text-sm text-text-secondary">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <Share className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">
              {analytics.overview.totalShares.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon(analytics.trends.shares.change)}
              <span className={`text-sm ${getTrendColor(analytics.trends.shares.change)}`}>
                {analytics.trends.shares.change > 0 ? '+' : ''}{analytics.trends.shares.change}%
              </span>
              <span className="text-sm text-text-secondary">vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              Average Read Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-500 mb-2">
              {analytics.overview.avgReadTime} min
            </div>
            <p className="text-sm text-text-secondary">
              Time readers spend on your content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-success" />
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success mb-2">
              {analytics.overview.engagementRate}%
            </div>
            <p className="text-sm text-text-secondary">
              Likes, comments, and shares per view
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-warning" />
              Bounce Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning mb-2">
              {analytics.overview.bounceRate}%
            </div>
            <p className="text-sm text-text-secondary">
              Readers who leave after one page
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-500" />
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPosts.map((post, index) => (
              <div key={post.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-surface transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{post.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share className="w-4 h-4" />
                        {post.shares}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-success">{post.engagementRate}%</div>
                  <div className="text-sm text-text-secondary">Engagement</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audience Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Audience Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-text-primary mb-3">Age Groups</h4>
                <div className="space-y-2">
                  {analytics.audienceInsights.demographics.ageGroups.map((group) => (
                    <div key={group.range} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{group.range}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary-100 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${group.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-text-primary w-8">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-3">Top Locations</h4>
                <div className="space-y-2">
                  {analytics.audienceInsights.demographics.locations.map((location) => (
                    <div key={location.country} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{location.country}</span>
                      <span className="text-sm font-medium text-text-primary">{location.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources & Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              Traffic Sources & Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-text-primary mb-3">Traffic Sources</h4>
                <div className="space-y-2">
                  {analytics.audienceInsights.sources.map((source) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{source.source}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary-100 rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full"
                            style={{ width: `${source.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-text-primary w-8">{source.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-3">Devices</h4>
                <div className="space-y-2">
                  {analytics.audienceInsights.devices.map((device) => (
                    <div key={device.type} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{device.type}</span>
                      <span className="text-sm font-medium text-text-primary">{device.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-500" />
              Scroll Depth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.engagementMetrics.scrollDepth.map((metric) => (
                <div key={metric.depth} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{metric.depth}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-secondary-100 rounded-full h-2">
                      <div 
                        className="bg-success h-2 rounded-full"
                        style={{ width: `${metric.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-text-primary w-8">{metric.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              Time on Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.engagementMetrics.timeOnPage.map((metric) => (
                <div key={metric.range} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{metric.range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-secondary-100 rounded-full h-2">
                      <div 
                        className="bg-warning h-2 rounded-full"
                        style={{ width: `${metric.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-text-primary w-8">{metric.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage; 