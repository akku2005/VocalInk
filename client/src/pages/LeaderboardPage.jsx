import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { userService } from '../services/userService';
import { getProfilePath } from '../utils/profileUrl';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalXp: 0,
    activeThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // all, month, week
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getLeaderboard();

        // Normalized list from API shape
        const list = data?.leaderboard || data?.leaders || (Array.isArray(data) ? data : []);
        const sorted = [...list].sort((a, b) => (b.xp || 0) - (a.xp || 0));
        const withRank = sorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
        setLeaderboardData(withRank);
        setStats({
          totalUsers: data?.totalUsers ?? withRank.length,
          totalXp: data?.totalXp ?? withRank.reduce((sum, u) => sum + (u.xp || 0), 0),
          activeThisWeek: data?.activeThisWeek ?? data?.activeUsers ?? 0,
        });
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setError(err.message || 'Failed to load leaderboard');
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeframe]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-text-secondary">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-secondary-100 rounded w-1/3 mb-3"></div>
          <div className="h-12 bg-secondary-100 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-secondary-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} className="inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary-500" />
            Leaderboard
          </h1>
          <p className="text-text-secondary mt-1">
            Top contributors and content creators
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex gap-2">
          <Button
            variant={timeframe === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('all')}
          >
            All Time
          </Button>
          <Button
            variant={timeframe === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('month')}
          >
            This Month
          </Button>
          <Button
            variant={timeframe === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('week')}
          >
            This Week
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-full">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Users</p>
                <p className="text-2xl font-bold text-text-primary">{stats.totalUsers?.toLocaleString?.() || stats.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total XP Earned</p>
                <p className="text-2xl font-bold text-text-primary">{stats.totalXp?.toLocaleString?.() || stats.totalXp || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Active This Week</p>
                <p className="text-2xl font-bold text-text-primary">{stats.activeThisWeek?.toLocaleString?.() || stats.activeThisWeek || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard List */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border-color">
            {leaderboardData.map((user) => (
              <div
                key={user.userId || user.id || user._id}
                className="p-6 hover:bg-surface-hover transition-colors cursor-pointer"
                onClick={() => {
                  const path = getProfilePath({
                    username: user.username,
                    _id: user.userId || user.id || user._id,
                  });
                  window.location.href = path;
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 flex items-center justify-center">
                    {getRankIcon(user.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar || user.profilePicture ? (
                      <img
                        src={user.avatar || user.profilePicture}
                        alt={user.name || user.displayName || user.username || "User"}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-600">
                          {(user.name || user.displayName || user.username || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate">
                      {user.name || user.displayName || user.username || "Unknown user"}
                    </h3>
                    {user.username && (
                      <p className="text-xs text-text-secondary truncate">@{user.username}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Level {user.level}
                      </Badge>
                      {typeof user.blogCount !== "undefined" && (
                        <span className="text-sm text-text-secondary">
                          {user.blogCount} blogs
                        </span>
                      )}
                      {typeof user.badges !== "undefined" && (
                        <span className="text-sm text-text-secondary">
                          {Array.isArray(user.badges) ? user.badges.length : user.badges} badges
                        </span>
                      )}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {(user.xp ?? 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-text-secondary">XP</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {leaderboardData.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No leaderboard data yet
            </h3>
            <p className="text-text-secondary">
              Start creating content to appear on the leaderboard!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaderboardPage;
