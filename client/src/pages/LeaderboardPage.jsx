import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // all, month, week

  useEffect(() => {
    // TODO: Fetch leaderboard data from API
    // For now, using mock data
    setLeaderboardData([
      {
        rank: 1,
        userId: '1',
        username: 'TopWriter',
        avatar: null,
        xp: 15420,
        level: 25,
        badges: 12,
        blogs: 45,
      },
      {
        rank: 2,
        userId: '2',
        username: 'ContentCreator',
        avatar: null,
        xp: 12350,
        level: 22,
        badges: 10,
        blogs: 38,
      },
      {
        rank: 3,
        userId: '3',
        username: 'BlogMaster',
        avatar: null,
        xp: 10200,
        level: 20,
        badges: 9,
        blogs: 32,
      },
    ]);
    setLoading(false);
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
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
                <p className="text-2xl font-bold text-text-primary">1,234</p>
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
                <p className="text-2xl font-bold text-text-primary">2.5M</p>
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
                <p className="text-2xl font-bold text-text-primary">456</p>
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
                key={user.userId}
                className="p-6 hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 flex items-center justify-center">
                    {getRankIcon(user.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-600">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary">
                      {user.username}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <Badge variant="outline" className="text-xs">
                        Level {user.level}
                      </Badge>
                      <span className="text-sm text-text-secondary">
                        {user.blogs} blogs
                      </span>
                      <span className="text-sm text-text-secondary">
                        {user.badges} badges
                      </span>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {user.xp.toLocaleString()}
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
