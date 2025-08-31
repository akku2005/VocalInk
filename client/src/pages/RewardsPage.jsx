import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
  Trophy, 
  Star, 
  Target, 
  Award, 
  Zap, 
  BookOpen, 
  MessageCircle, 
  Heart,
  Share,
  Users,
  Calendar,
  TrendingUp,
  Gift,
  Crown,
  Medal,
  Sparkles
} from 'lucide-react';

const RewardsPage = () => {
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('badges');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRewards({
        userStats: {
          level: 8,
          xp: 15420,
          totalXp: 25000,
          rank: 'Silver',
          badgesEarned: 12,
          totalBadges: 25,
          streak: 15,
          achievements: 8
        },
        badges: {
          earned: [
            {
              id: 1,
              name: 'First Post',
              description: 'Published your first blog post',
              icon: '🎉',
              rarity: 'common',
              earnedAt: '2023-01-15',
              category: 'writing'
            },
            {
              id: 2,
              name: 'Engagement Master',
              description: 'Received 100+ likes on a single post',
              icon: '🔥',
              rarity: 'rare',
              earnedAt: '2023-02-20',
              category: 'engagement'
            },
            {
              id: 3,
              name: 'Series Creator',
              description: 'Created a blog series with 5+ posts',
              icon: '📚',
              rarity: 'epic',
              earnedAt: '2023-03-10',
              category: 'series'
            },
            {
              id: 4,
              name: 'AI Pioneer',
              description: 'Used AI features 50+ times',
              icon: '🤖',
              rarity: 'legendary',
              earnedAt: '2023-04-05',
              category: 'ai'
            },
            {
              id: 5,
              name: 'Social Butterfly',
              description: 'Followed 50+ users',
              icon: '🦋',
              rarity: 'rare',
              earnedAt: '2023-05-12',
              category: 'social'
            },
            {
              id: 6,
              name: 'Comment King',
              description: 'Left 100+ meaningful comments',
              icon: '💬',
              rarity: 'epic',
              earnedAt: '2023-06-18',
              category: 'engagement'
            }
          ],
          available: [
            {
              id: 7,
              name: 'Viral Sensation',
              description: 'Get 10,000+ views on a single post',
              icon: '🚀',
              rarity: 'legendary',
              progress: 65,
              target: 10000,
              current: 6500,
              category: 'viral'
            },
            {
              id: 8,
              name: 'Consistency Champion',
              description: 'Post for 30 consecutive days',
              icon: '📅',
              rarity: 'epic',
              progress: 50,
              target: 30,
              current: 15,
              category: 'consistency'
            },
            {
              id: 9,
              name: 'Community Leader',
              description: 'Have 1,000+ followers',
              icon: '👑',
              rarity: 'legendary',
              progress: 80,
              target: 1000,
              current: 800,
              category: 'social'
            }
          ]
        },
        achievements: [
          {
            id: 1,
            name: 'Content Creator',
            description: 'Publish 50 blog posts',
            icon: BookOpen,
            progress: 90,
            target: 50,
            current: 45,
            reward: '500 XP + Special Badge'
          },
          {
            id: 2,
            name: 'Engagement Expert',
            description: 'Receive 5,000 total likes',
            icon: Heart,
            progress: 75,
            target: 5000,
            current: 3750,
            reward: '1000 XP + Profile Highlight'
          },
          {
            id: 3,
            name: 'Discussion Starter',
            description: 'Start 20 meaningful discussions',
            icon: MessageCircle,
            progress: 60,
            target: 20,
            current: 12,
            reward: '750 XP + Comment Priority'
          }
        ],
        leaderboard: [
          { rank: 1, username: 'Sarah Johnson', xp: 45230, level: 15, badge: '👑' },
          { rank: 2, username: 'Mike Chen', xp: 38920, level: 13, badge: '🥈' },
          { rank: 3, username: 'Emily Rodriguez', xp: 32450, level: 12, badge: '🥉' },
          { rank: 4, username: 'David Kim', xp: 28910, level: 11, badge: '💎' },
          { rank: 5, username: 'Lisa Thompson', xp: 25670, level: 10, badge: '⭐' }
        ],
        recentActivity: [
          {
            id: 1,
            type: 'badge_earned',
            title: 'Earned "AI Pioneer" Badge',
            description: 'Used AI features 50+ times',
            time: '2 hours ago',
            icon: Award,
            color: 'text-success'
          },
          {
            id: 2,
            type: 'level_up',
            title: 'Level Up!',
            description: 'Reached level 8',
            time: '1 day ago',
            icon: TrendingUp,
            color: 'text-primary'
          },
          {
            id: 3,
            type: 'streak',
            title: '15 Day Streak!',
            description: 'Keep up the great work',
            time: '2 days ago',
            icon: Zap,
            color: 'text-warning'
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

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

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRarityIcon = (rarity) => {
    switch (rarity) {
      case 'common': return '⭐';
      case 'rare': return '💎';
      case 'epic': return '👑';
      case 'legendary': return '🏆';
      default: return '⭐';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-text-primary">Rewards Center</h1>
        <p className="text-lg text-text-secondary">Track your progress, earn badges, and climb the leaderboard</p>
      </div>

      {/* User Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Trophy className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">{rewards.userStats.level}</div>
            <div className="w-full bg-primary-200 rounded-full h-2 mt-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(rewards.userStats.xp / rewards.userStats.totalXp) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-primary-700 mt-1">
              {rewards.userStats.xp.toLocaleString()} / {rewards.userStats.totalXp.toLocaleString()} XP
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rank</CardTitle>
            <Crown className="h-4 w-4 text-warning-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">{rewards.userStats.rank}</div>
            <p className="text-xs text-warning-700 mt-1">Current ranking</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-success-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-600">
              {rewards.userStats.badgesEarned}/{rewards.userStats.totalBadges}
            </div>
            <p className="text-xs text-success-700 mt-1">
              {Math.round((rewards.userStats.badgesEarned / rewards.userStats.totalBadges) * 100)}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Zap className="h-4 w-4 text-accent-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-600">{rewards.userStats.streak} days</div>
            <p className="text-xs text-accent-700 mt-1">Keep it going!</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'badges', label: 'Badges', count: rewards.badges.earned.length },
            { id: 'achievements', label: 'Achievements', count: rewards.achievements.length },
            { id: 'leaderboard', label: 'Leaderboard', count: rewards.leaderboard.length },
            { id: 'activity', label: 'Recent Activity', count: rewards.recentActivity.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="space-y-8">
            {/* Earned Badges */}
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">Earned Badges</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.badges.earned.map((badge) => (
                  <Card key={badge.id} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-4">{badge.icon}</div>
                      <h3 className="font-semibold text-text-primary mb-2">{badge.name}</h3>
                      <p className="text-sm text-text-secondary mb-4">{badge.description}</p>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Badge className={getRarityColor(badge.rarity)}>
                          {getRarityIcon(badge.rarity)} {badge.rarity}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-secondary">
                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Available Badges */}
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">Available Badges</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.badges.available.map((badge) => (
                  <Card key={badge.id} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-4 opacity-50">{badge.icon}</div>
                      <h3 className="font-semibold text-text-primary mb-2">{badge.name}</h3>
                      <p className="text-sm text-text-secondary mb-4">{badge.description}</p>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Badge className={getRarityColor(badge.rarity)}>
                          {getRarityIcon(badge.rarity)} {badge.rarity}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full bg-secondary-100 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${badge.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-text-secondary">
                          {badge.current.toLocaleString()} / {badge.target.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            {rewards.achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <Card key={achievement.id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary-100 rounded-full">
                        <Icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary mb-1">{achievement.name}</h3>
                        <p className="text-sm text-text-secondary mb-3">{achievement.description}</p>
                        <div className="space-y-2">
                          <div className="w-full bg-secondary-100 rounded-full h-2">
                            <div 
                              className="bg-success h-2 rounded-full transition-all duration-300"
                              style={{ width: `${achievement.progress}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary">
                              {achievement.current} / {achievement.target}
                            </span>
                            <span className="text-success font-medium">{achievement.progress}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-success mb-1">Reward</div>
                        <div className="text-xs text-text-secondary">{achievement.reward}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rewards.leaderboard.map((user, index) => (
                  <div key={user.rank} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-surface transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-warning to-warning/80 rounded-full flex items-center justify-center text-white font-bold">
                        {user.rank}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{user.badge}</span>
                        <div>
                          <div className="font-semibold text-text-primary">{user.username}</div>
                          <div className="text-sm text-text-secondary">Level {user.level}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-500">{user.xp.toLocaleString()} XP</div>
                      <div className="text-sm text-text-secondary">Rank #{user.rank}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            {rewards.recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <Card key={activity.id} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full bg-surface ${activity.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{activity.title}</h3>
                        <p className="text-sm text-text-secondary">{activity.description}</p>
                        <p className="text-xs text-text-secondary mt-1">{activity.time}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPage; 