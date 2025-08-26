import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  TrendingUp, 
  Users, 
  Heart, 
  BookOpen,
  MessageCircle,
  Zap,
  Calendar,
  Filter,
  Award,
  Target,
  Sparkles,
  Flame,
  Eye,
  Clock
} from 'lucide-react';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('creators');
  const [timeRange, setTimeRange] = useState('all-time');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLeaderboard({
        creators: [
          {
            rank: 1,
            username: 'Sarah Johnson',
            displayName: 'Sarah Johnson',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face',
            xp: 45230,
            level: 15,
            posts: 89,
            followers: 12450,
            totalViews: 234500,
            totalLikes: 15670,
            totalComments: 3240,
            badge: '👑',
            badgeColor: 'text-yellow-500',
            trend: '+12%',
            trendDirection: 'up'
          },
          {
            rank: 2,
            username: 'Mike Chen',
            displayName: 'Mike Chen',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
            xp: 38920,
            level: 13,
            posts: 67,
            followers: 8920,
            totalViews: 189400,
            totalLikes: 12340,
            totalComments: 2890,
            badge: '🥈',
            badgeColor: 'text-gray-400',
            trend: '+8%',
            trendDirection: 'up'
          },
          {
            rank: 3,
            username: 'Emily Rodriguez',
            displayName: 'Emily Rodriguez',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
            xp: 32450,
            level: 12,
            posts: 54,
            followers: 7560,
            totalViews: 156800,
            totalLikes: 9870,
            totalComments: 2340,
            badge: '🥉',
            badgeColor: 'text-orange-500',
            trend: '+15%',
            trendDirection: 'up'
          },
          {
            rank: 4,
            username: 'David Kim',
            displayName: 'David Kim',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
            xp: 28910,
            level: 11,
            posts: 43,
            followers: 6340,
            totalViews: 134200,
            totalLikes: 8230,
            totalComments: 1890,
            badge: '💎',
            badgeColor: 'text-blue-500',
            trend: '+5%',
            trendDirection: 'up'
          },
          {
            rank: 5,
            username: 'Lisa Thompson',
            displayName: 'Lisa Thompson',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
            xp: 25670,
            level: 10,
            posts: 38,
            followers: 5670,
            totalViews: 118900,
            totalLikes: 7450,
            totalComments: 1670,
            badge: '⭐',
            badgeColor: 'text-yellow-400',
            trend: '+18%',
            trendDirection: 'up'
          }
        ],
        posts: [
          {
            rank: 1,
            title: 'The Future of AI in Content Creation',
            author: 'Sarah Johnson',
            authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
            views: 15420,
            likes: 1240,
            comments: 89,
            shares: 156,
            publishedAt: '2024-01-15',
            readTime: 8,
            badge: '🔥',
            badgeColor: 'text-red-500',
            trend: '+25%',
            trendDirection: 'up'
          },
          {
            rank: 2,
            title: 'Building a Successful Blog Series',
            author: 'Mike Chen',
            authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
            views: 12340,
            likes: 890,
            comments: 67,
            shares: 123,
            publishedAt: '2024-01-12',
            readTime: 12,
            badge: '📈',
            badgeColor: 'text-green-500',
            trend: '+18%',
            trendDirection: 'up'
          },
          {
            rank: 3,
            title: 'Voice-to-Text: The Next Big Thing',
            author: 'Emily Rodriguez',
            authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
            views: 9876,
            likes: 756,
            comments: 45,
            shares: 98,
            publishedAt: '2024-01-10',
            readTime: 6,
            badge: '⚡',
            badgeColor: 'text-yellow-500',
            trend: '+12%',
            trendDirection: 'up'
          }
        ],
        series: [
          {
            rank: 1,
            title: 'AI in Content Creation',
            author: 'Sarah Johnson',
            authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
            posts: 12,
            totalViews: 45600,
            totalLikes: 3450,
            totalComments: 890,
            startedAt: '2023-11-01',
            badge: '📚',
            badgeColor: 'text-purple-500',
            trend: '+30%',
            trendDirection: 'up'
          },
          {
            rank: 2,
            title: 'Building Better Blogs',
            author: 'Mike Chen',
            authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
            posts: 8,
            totalViews: 32400,
            totalLikes: 2340,
            totalComments: 567,
            startedAt: '2023-12-01',
            badge: '🎯',
            badgeColor: 'text-blue-500',
            trend: '+22%',
            trendDirection: 'up'
          },
          {
            rank: 3,
            title: 'Voice Technology Revolution',
            author: 'Emily Rodriguez',
            authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
            posts: 6,
            totalViews: 28900,
            totalLikes: 1890,
            totalComments: 445,
            startedAt: '2023-12-15',
            badge: '🎙️',
            badgeColor: 'text-green-500',
            trend: '+15%',
            trendDirection: 'up'
          }
        ],
        badges: [
          {
            rank: 1,
            name: 'AI Pioneer',
            description: 'Used AI features 50+ times',
            icon: '🤖',
            rarity: 'legendary',
            earnedBy: 156,
            totalUsers: 1250,
            badge: '🏆',
            badgeColor: 'text-yellow-500',
            trend: '+45%',
            trendDirection: 'up'
          },
          {
            rank: 2,
            name: 'Engagement Master',
            description: 'Received 100+ likes on a single post',
            icon: '🔥',
            rarity: 'rare',
            earnedBy: 234,
            totalUsers: 890,
            badge: '🥈',
            badgeColor: 'text-gray-400',
            trend: '+28%',
            trendDirection: 'up'
          },
          {
            rank: 3,
            name: 'Series Creator',
            description: 'Created a blog series with 5+ posts',
            icon: '📚',
            rarity: 'epic',
            earnedBy: 89,
            totalUsers: 567,
            badge: '🥉',
            badgeColor: 'text-orange-500',
            trend: '+32%',
            trendDirection: 'up'
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categories = [
    { id: 'creators', name: 'Top Creators', icon: Users, count: leaderboard.creators.length },
    { id: 'posts', name: 'Trending Posts', icon: BookOpen, count: leaderboard.posts.length },
    { id: 'series', name: 'Best Series', icon: BookOpen, count: leaderboard.series.length },
    { id: 'badges', name: 'Popular Badges', icon: Award, count: leaderboard.badges.length }
  ];

  const timeRanges = [
    { value: 'all-time', label: 'All Time' },
    { value: 'this-month', label: 'This Month' },
    { value: 'this-week', label: 'This Week' },
    { value: 'today', label: 'Today' }
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return { icon: '👑', color: 'text-yellow-500' };
      case 2: return { icon: '🥈', color: 'text-gray-400' };
      case 3: return { icon: '🥉', color: 'text-orange-500' };
      default: return { icon: rank, color: 'text-text-secondary' };
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-text-primary">Leaderboard</h1>
        <p className="text-lg text-text-secondary">Discover the top performers in the VocalInk community</p>
      </div>

      {/* Time Range Filter */}
      <div className="flex justify-center">
        <div className="flex items-center bg-background rounded-lg p-1 border border-border">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                timeRange === range.value
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8 justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeCategory === category.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.name} ({category.count})
              </button>
            );
          })}
        </nav>
      </div>

      {/* Leaderboard Content */}
      <div className="space-y-6">
        {activeCategory === 'creators' && (
          <div className="space-y-4">
            {leaderboard.creators.map((creator) => {
              const rankInfo = getRankIcon(creator.rank);
              return (
                <Card key={creator.rank} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Rank */}
                      <div className="flex flex-col items-center min-w-[60px]">
                        <div className={`text-2xl font-bold ${rankInfo.color}`}>
                          {rankInfo.icon}
                        </div>
                        <div className="text-sm text-text-secondary">#{creator.rank}</div>
                      </div>

                      {/* Avatar and Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <img 
                          src={creator.avatar} 
                          alt={creator.displayName}
                          className="w-16 h-16 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-text-primary">
                              {creator.displayName}
                            </h3>
                            <span className={`text-xl ${creator.badgeColor}`}>
                              {creator.badge}
                            </span>
                            <Badge variant="outline">
                              Level {creator.level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {creator.posts} posts
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {creator.followers.toLocaleString()} followers
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {creator.totalViews.toLocaleString()} views
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-500 mb-1">
                          {creator.xp.toLocaleString()} XP
                        </div>
                        <div className="flex items-center gap-1 text-sm text-success">
                          <TrendingUp className="w-4 h-4" />
                          {creator.trend}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {activeCategory === 'posts' && (
          <div className="space-y-4">
            {leaderboard.posts.map((post) => {
              const rankInfo = getRankIcon(post.rank);
              return (
                <Card key={post.rank} className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Rank */}
                      <div className="flex flex-col items-center min-w-[60px]">
                        <div className={`text-2xl font-bold ${rankInfo.color}`}>
                          {rankInfo.icon}
                        </div>
                        <div className="text-sm text-text-secondary">#{post.rank}</div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-text-primary">
                            {post.title}
                          </h3>
                          <span className={`text-xl ${post.badgeColor}`}>
                            {post.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
                          <div className="flex items-center gap-2">
                            <img 
                              src={post.authorAvatar} 
                              alt={post.author}
                              className="w-6 h-6 rounded-full"
                            />
                            <span>{post.author}</span>
                          </div>
                          <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.readTime} min read
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
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
                        </div>
                      </div>

                      {/* Trend */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-success">
                          <TrendingUp className="w-4 h-4" />
                          {post.trend}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {activeCategory === 'series' && (
          <div className="space-y-4">
            {leaderboard.series.map((series) => {
              const rankInfo = getRankIcon(series.rank);
              return (
                <Card key={series.rank} className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Rank */}
                      <div className="flex flex-col items-center min-w-[60px]">
                        <div className={`text-2xl font-bold ${rankInfo.color}`}>
                          {rankInfo.icon}
                        </div>
                        <div className="text-sm text-text-secondary">#{series.rank}</div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-text-primary">
                            {series.title}
                          </h3>
                          <span className={`text-xl ${series.badgeColor}`}>
                            {series.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
                          <div className="flex items-center gap-2">
                            <img 
                              src={series.authorAvatar} 
                              alt={series.author}
                              className="w-6 h-6 rounded-full"
                            />
                            <span>{series.author}</span>
                          </div>
                          <span>{series.posts} posts</span>
                          <span>Started {new Date(series.startedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {series.totalViews.toLocaleString()} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {series.totalLikes.toLocaleString()} likes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {series.totalComments} comments
                          </span>
                        </div>
                      </div>

                      {/* Trend */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-success">
                          <TrendingUp className="w-4 h-4" />
                          {series.trend}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {activeCategory === 'badges' && (
          <div className="space-y-4">
            {leaderboard.badges.map((badge) => {
              const rankInfo = getRankIcon(badge.rank);
              return (
                <Card key={badge.rank} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Rank */}
                      <div className="flex flex-col items-center min-w-[60px]">
                        <div className={`text-2xl font-bold ${rankInfo.color}`}>
                          {rankInfo.icon}
                        </div>
                        <div className="text-sm text-text-secondary">#{badge.rank}</div>
                      </div>

                      {/* Badge Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-3xl">{badge.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-text-primary">
                              {badge.name}
                            </h3>
                            <span className={`text-xl ${badge.badgeColor}`}>
                              {badge.badge}
                            </span>
                            <Badge className={getRarityColor(badge.rarity)}>
                              {badge.rarity}
                            </Badge>
                          </div>
                          <p className="text-sm text-text-secondary mb-2">
                            {badge.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-text-secondary">
                            <span>{badge.earnedBy} users earned</span>
                            <span>{Math.round((badge.earnedBy / badge.totalUsers) * 100)}% completion rate</span>
                          </div>
                        </div>
                      </div>

                      {/* Trend */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-success">
                          <TrendingUp className="w-4 h-4" />
                          {badge.trend}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">👑</div>
            <div className="text-2xl font-bold text-primary-500">1,247</div>
            <div className="text-sm text-text-secondary">Active Creators</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-2xl font-bold text-primary-500">45,230</div>
            <div className="text-sm text-text-secondary">Total Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-primary-500">892</div>
            <div className="text-sm text-text-secondary">Badges Earned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-primary-500">2.3M</div>
            <div className="text-sm text-text-secondary">Total Views</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardPage; 