import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  Users,
  FileText,
  MessageCircle,
  Eye,
  Heart,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Shield,
  AlertTriangle,
  UserCheck,
  UserX,
  Clock,
  Zap,
  Award,
  Volume2,
  RefreshCw,
  ChevronRight,
  Search,
  Filter,
  Ban,
  CheckCircle,
  XCircle,

  MoreVertical,
  Mail
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user?.role, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboard();
    }
  }, [user?._id, user?.role]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getDashboardOverview();
      if (response.success) {
        setDashboard(response.data);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const getGrowthIcon = (value) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getGrowthColor = (value) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registered': return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'blog_created': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'comment_added': return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case 'abuse_report': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="w-16 h-16 text-red-500" />
        <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const { users, content, engagement, system, recentActivity } = dashboard || {};

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'content', name: 'Content', icon: FileText },
    { id: 'system', name: 'System', icon: Server },
    { id: 'moderation', name: 'Moderation', icon: Shield },
    { id: 'marketing', name: 'Marketing', icon: Mail }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monitor and manage your platform
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(users?.total)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {getGrowthIcon(users?.growth)}
                        <span className={`text-sm ${getGrowthColor(users?.growth)}`}>
                          {users?.growth > 0 ? '+' : ''}{users?.growth}% this month
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Blogs */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Published Blogs</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(content?.blogs?.published)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {content?.blogs?.draft} drafts
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Views */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(engagement?.views)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatNumber(engagement?.likes)} likes
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                      <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Today */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Today</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(users?.activeToday)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {users?.newToday} new today
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                      <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Badges Earned */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                      <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Badges Earned</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(engagement?.badges?.totalEarned)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {engagement?.badges?.earnedThisMonth} this month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* TTS Generated */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-full">
                      <Volume2 className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">TTS Generated</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(content?.ai?.tts)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {content?.ai?.summaries} AI summaries
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                      <MessageCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Comments</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(content?.comments?.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {content?.comments?.thisWeek} this week
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity & System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentActivity?.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate">
                            {activity.message}
                          </p>
                          {activity.user && (
                            <p className="text-xs text-gray-500">
                              by {activity.user.name}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Server Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Server Status</span>
                      </div>
                      <span className="text-sm font-medium text-green-500">Online</span>
                    </div>

                    {/* Uptime */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatUptime(system?.server?.uptime || 0)}
                      </span>
                    </div>

                    {/* Memory Usage */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Memory</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {system?.memory?.heapUsed}MB / {system?.memory?.heapTotal}MB
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${system?.memory?.percentUsed > 80 ? 'bg-red-500' :
                            system?.memory?.percentUsed > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                          style={{ width: `${system?.memory?.percentUsed || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* CPU */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">CPU Load</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {system?.cpu?.averageLoad}% ({system?.cpu?.cores} cores)
                      </span>
                    </div>

                    {/* Database */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
                      </div>
                      <Badge variant={system?.database?.status === 'connected' ? 'success' : 'error'}>
                        {system?.database?.status}
                      </Badge>
                    </div>

                    {/* DB Size */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-6">Storage</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {system?.database?.dataSize}MB ({system?.database?.documents} docs)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users by Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Users by Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(users?.byRole || {}).map(([role, count]) => (
                    <div key={role} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                      <p className="text-sm text-gray-500 capitalize">{role}s</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'content' && <ContentTab content={content} />}
        {activeTab === 'system' && <SystemTab system={system} />}
        {activeTab === 'system' && <SystemTab system={system} />}
        {activeTab === 'moderation' && <ModerationTab />}
        {activeTab === 'marketing' && <MarketingTab />}
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await adminService.getUsers({
          page: pagination.page,
          limit: 20,
          search,
          role: roleFilter
        });
        if (response.success) {
          setUsers(response.data.users);
          setPagination(prev => ({ ...prev, ...response.data.pagination }));
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [pagination.page, search, roleFilter]);

  const handleBanUser = async (userId, isBanned) => {
    try {
      await adminService.updateUserStatus(userId, { isBanned: !isBanned });
      // Trigger re-fetch by resetting pagination
      setPagination(prev => ({ ...prev, page: prev.page }));
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="writer">Writer</option>
          <option value="reader">Reader</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">XP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <span className="text-sm font-medium">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.isVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                          {user.isBanned && (
                            <Badge variant="error">Banned</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {user.xp || 0}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBanUser(user._id, user.isBanned)}
                          className={user.isBanned ? 'text-green-600' : 'text-red-600'}
                        >
                          {user.isBanned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

// Content Tab Component
const ContentTab = ({ content }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBlogs({
        page: pagination.page,
        limit: 10,
        search,
        status: statusFilter
      });
      if (response.success) {
        setBlogs(response.data.blogs);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [pagination.page, search, statusFilter]);

  const handleDeleteClick = (blog) => {
    setSelectedBlog(blog);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBlog || !deleteReason) return;
    try {
      await adminService.deleteContent('blog', selectedBlog._id, deleteReason);
      setDeleteModalOpen(false);
      setSelectedBlog(null);
      setDeleteReason('');
      fetchBlogs(); // Refresh list
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('Failed to delete blog');
    }
  };

  return (
    <div className="space-y-6">
      {/* Blog Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{content?.blogs?.total || 0}</p>
              <p className="text-sm text-gray-500">Total Blogs</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{content?.blogs?.published || 0}</p>
              <p className="text-sm text-gray-500">Published</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{content?.blogs?.draft || 0}</p>
              <p className="text-sm text-gray-500">Drafts</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{content?.blogs?.thisWeek || 0}</p>
              <p className="text-sm text-gray-500">This Week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Blogs</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search blogs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : blogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No blogs found
                    </td>
                  </tr>
                ) : (
                  blogs.map((blog) => (
                    <tr key={blog._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs" title={blog.title}>
                          {blog.title}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {blog.author?.firstName} {blog.author?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{blog.author?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={blog.status === 'published' ? 'success' : 'warning'}>
                          {blog.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{blog.views || 0}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/${blog.category}/${blog.slug}`, '_blank')}
                          className="mr-2 text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(blog)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Content</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete "{selectedBlog?.title}"? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason for deletion (required)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                rows="3"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g., Violeted terms of service..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDelete}
                disabled={!deleteReason.trim()}
              >
                Delete Content
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// System Tab Component
const SystemTab = ({ system }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Server Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Server Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Node Version</span>
                <span className="font-medium">{system?.server?.nodeVersion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform</span>
                <span className="font-medium">{system?.server?.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">PID</span>
                <span className="font-medium">{system?.server?.pid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hostname</span>
                <span className="font-medium">{system?.os?.hostname}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OS Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              Operating System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium">{system?.os?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Release</span>
                <span className="font-medium">{system?.os?.release}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Memory</span>
                <span className="font-medium">{system?.os?.totalMemory} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Free Memory</span>
                <span className="font-medium">{system?.os?.freeMemory} GB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge variant={system?.database?.status === 'connected' ? 'success' : 'error'}>
                  {system?.database?.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Collections</span>
                <span className="font-medium">{system?.database?.collections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Documents</span>
                <span className="font-medium">{system?.database?.documents?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Data Size</span>
                <span className="font-medium">{system?.database?.dataSize} MB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Heap Used</span>
                <span className="font-medium">{system?.memory?.heapUsed} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Heap Total</span>
                <span className="font-medium">{system?.memory?.heapTotal} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RSS</span>
                <span className="font-medium">{system?.memory?.rss} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">External</span>
                <span className="font-medium">{system?.memory?.external} MB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Moderation Tab Component
const ModerationTab = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingCount: 0, urgentCount: 0 });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await adminService.getModerationQueue({ status: 'pending' });
      if (response.success) {
        setReports(response.data.reports);
        setStats({
          pendingCount: response.data.pendingCount,
          urgentCount: response.data.urgentCount
        });
      }
    } catch (err) {
      console.error('Error fetching moderation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
                <p className="text-sm text-gray-500">Pending Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.urgentCount}</p>
                <p className="text-sm text-gray-500">Urgent Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Abuse Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No pending reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={report.priority === 'high' || report.priority === 'critical' ? 'error' : 'warning'}>
                          {report.priority}
                        </Badge>
                        <span className="font-medium">{report.reportType}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Reported by: {report.reporterId?.firstName} {report.reporterId?.lastName}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Marketing Tab Component
const MarketingTab = () => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [target, setTarget] = useState('subscribed'); // subscribed | all
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [estimatedAudience, setEstimatedAudience] = useState(null);
  const [estimating, setEstimating] = useState(false);

  // Fetch estimation whenever filters change
  useEffect(() => {
    const fetchEstimation = async () => {
      try {
        setEstimating(true);
        const filters = {
          target,
          role: roleFilter || undefined
        };
        const response = await adminService.estimateCampaignAudience(filters);
        if (response.success) {
          setEstimatedAudience(response.data.count);
        }
      } catch (err) {
        console.error('Failed to estimate audience:', err);
      } finally {
        setEstimating(false);
      }
    };

    // Debounce slightly to avoid rapid calls
    const timeoutId = setTimeout(fetchEstimation, 300);
    return () => clearTimeout(timeoutId);
  }, [target, roleFilter]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      setError('Subject and content are required');
      return;
    }

    if (!confirm(`Are you sure you want to send this campaign to ${estimatedAudience} users? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const filters = {
        target,
        role: roleFilter || undefined
      };

      const result = await adminService.sendMarketingCampaign({
        subject,
        content,
        filters
      });

      if (result.success) {
        setSuccess(`Campaign queued successfully! ${result.data.count} emails will be sent.`);
        setSubject('');
        setContent('');
      } else {
        setError('Failed to queue campaign');
      }
    } catch (err) {
      console.error('Error sending campaign:', err);
      setError(err.response?.data?.message || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Create Email Campaign
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-6">
            {success && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Target Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Audience
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="target"
                      value="subscribed"
                      checked={target === 'subscribed'}
                      onChange={(e) => setTarget(e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Subscribed Users Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="target"
                      value="all"
                      checked={target === 'all'}
                      onChange={(e) => setTarget(e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">All Users (Use with caution)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role Filter (Optional)
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="writer">Writer</option>
                  <option value="reader">Reader</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Audience Estimation Display */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Estimated Reach</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Based on your current filters
                </p>
              </div>
              <div className="text-right">
                {estimating ? (
                  <span className="text-sm text-gray-500 animate-pulse">Calculating...</span>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {estimatedAudience !== null ? estimatedAudience : '-'}
                    </span>
                    <span className="text-sm text-gray-500">users</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content Inputs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Content (HTML supported)
                </label>
                <p className="text-xs text-gray-500">
                  You can use {'{{name}}'} and {'{{email}}'} as placeholders.
                </p>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="<p>Hello {{name}}, check out our new features!</p>"
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="min-w-[120px]">
                {loading ? <LoadingSpinner size="sm" /> : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Campaign
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card >

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Note on delivery</h4>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Emails are processed in the background using a queue system. Delivery times may vary depending on the audience size and server load.
          This system is designed to handle thousands of emails efficiently without timeout.
        </p>
      </div>
    </div >
  );
};

export default AdminDashboard;
