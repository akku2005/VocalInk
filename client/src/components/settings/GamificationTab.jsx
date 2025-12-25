import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import logger from '../../utils/logger';
import {
  Trophy,
  Star,
  Award,
  Target,
  Users,
  Bell,
  Zap,
  ShieldCheck,
  PenSquare,
  Repeat,
  CheckCircle,
  Flag,
  Sparkles
} from 'lucide-react';
import settingsService from '../../services/settingsService';

const preferenceOptions = [
  {
    id: 'showXP',
    title: 'Show XP',
    description: 'Display your experience points on your public profile.',
    icon: Trophy
  },
  {
    id: 'showLevel',
    title: 'Show Level',
    description: 'Let other creators see your current level.',
    icon: Star
  },
  {
    id: 'showBadges',
    title: 'Show Badges',
    description: 'Display the badges you have earned.',
    icon: ShieldCheck
  },
  {
    id: 'showLeaderboard',
    title: 'Appear in Leaderboard',
    description: 'Allow your stats to appear in community leaderboards.',
    icon: Users
  },
  {
    id: 'notifications',
    title: 'Gamification Notifications',
    description: 'Receive alerts for level ups and badge milestones.',
    icon: Bell
  }
];

const GamificationTab = ({
  settings,
  setSettings,
  loading,
  setLoading,
  showToast,
  loadSettings
}) => {
  const gamification = settings?.gamification || {};

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      gamification: {
        ...(prev.gamification || {}),
        [field]: value
      }
    }));
  };

  const togglePreference = (field) => {
    const currentValue = gamification[field];
    const resolvedCurrent = currentValue === undefined ? true : currentValue;
    handleInputChange(field, !resolvedCurrent);
  };

  const handleSaveGamification = async () => {
    setLoading(true);
    try {
      await settingsService.updateGamificationSection(settings.gamification || {});
      await loadSettings(true);
      showToast('Gamification settings saved successfully', 'success');
    } catch (error) {
      logger.error('Error saving gamification settings:', error);
      showToast(error.message || 'Failed to save gamification settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const badgeCategories = [
    { id: 'writing', name: 'Writing', icon: PenSquare, count: gamification.writingBadges || 0 },
    { id: 'social', name: 'Social', icon: Users, count: gamification.socialBadges || 0 },
    { id: 'consistency', name: 'Consistency', icon: Repeat, count: gamification.consistencyBadges || 0 },
    { id: 'quality', name: 'Quality', icon: CheckCircle, count: gamification.qualityBadges || 0 },
    { id: 'milestone', name: 'Milestones', icon: Flag, count: gamification.milestoneBadges || 0 },
    { id: 'special', name: 'Special', icon: Sparkles, count: gamification.specialBadges || 0 }
  ];

  const achievements = [
    { id: 'first_post', name: 'First Steps', description: 'Published your first post', completed: true },
    { id: 'week_streak', name: 'Consistent Writer', description: 'Posted for 7 consecutive days', completed: true },
    { id: 'hundred_likes', name: 'Popular Creator', description: 'Received 100 likes total', completed: false },
    { id: 'ten_comments', name: 'Engaging Writer', description: 'Received 10 comments on a single post', completed: false },
    { id: 'month_active', name: 'Dedicated User', description: 'Active for 30 days', completed: true }
  ];

  const visibilityCards = [
    {
      label: 'XP Visibility',
      value: gamification.showXP !== false ? 'Visible' : 'Hidden',
      detail: 'Control if XP is displayed to others'
    },
    {
      label: 'Leaderboard Participation',
      value: gamification.showLeaderboard !== false ? 'Enabled' : 'Disabled',
      detail: 'Determine if you appear in rankings'
    },
    {
      label: 'Gamification Alerts',
      value: gamification.notifications !== false ? 'On' : 'Off',
      detail: 'Notifications for wins and milestones'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Engagement Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{gamification.level || 1}</div>
              <div className="text-sm text-blue-700 font-medium">Current Level</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{gamification.totalXP || 0}</div>
              <div className="text-sm text-green-700 font-medium">Total XP</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{gamification.totalBadges || 0}</div>
              <div className="text-sm text-purple-700 font-medium">Badges Earned</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">
                Progress to Level {(gamification.level || 1) + 1}
              </span>
              <span className="text-sm text-text-secondary">
                {gamification.currentLevelXP || 0} / {gamification.nextLevelXP || 100} XP
              </span>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-3">
              <div
                className="bg-primary-500 h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    ((gamification.currentLevelXP || 0) / (gamification.nextLevelXP || 100)) * 100
                  )}%`
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Target className="w-5 h-5" />
            Visibility Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {preferenceOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div
                key={option.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-secondary-100 text-primary-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">{option.title}</h4>
                    <p className="text-sm text-text-secondary">{option.description}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-start sm:self-center">
                  <input
                    type="checkbox"
                    checked={gamification?.[option.id] !== false}
                    onChange={() => togglePreference(option.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary-500 peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                </label>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Award className="w-5 h-5" />
            Badge Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badgeCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className="p-4 border rounded-lg text-center hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex justify-center mb-2">
                    <Icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <div className="font-medium text-text-primary">{category.name}</div>
                  <div className="text-sm text-text-secondary">{category.count} earned</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Star className="w-5 h-5" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center gap-4 p-3 rounded-lg border ${
                  achievement.completed ? 'bg-green-50 border-green-200' : 'bg-secondary-50 border-border'
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    achievement.completed ? 'bg-green-100 text-green-600' : 'bg-secondary-200 text-secondary-500'
                  }`}
                >
                  {achievement.completed ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-text-primary">{achievement.name}</div>
                  <div className="text-sm text-text-secondary">{achievement.description}</div>
                </div>
                {achievement.completed && (
                  <div className="text-green-600 font-medium text-sm">Completed</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Zap className="w-5 h-5" />
            XP Multipliers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {visibilityCards.map((card) => (
              <div key={card.label} className="p-4 bg-secondary-50 border border-border rounded-lg">
                <div className="text-sm text-text-secondary">{card.label}</div>
                <div className="text-xl font-semibold text-text-primary">{card.value}</div>
                <div className="text-xs text-text-secondary mt-1">{card.detail}</div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-orange-900">Weekend Boost</div>
                <div className="text-sm text-orange-700">Double XP on weekends</div>
              </div>
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSaveGamification}
          loading={loading}
          className="flex items-center gap-2 bg-primary-500 text-white hover:bg-primary-600"
        >
          <Award className="w-4 h-4" />
          Save Gamification Settings
        </Button>
      </div>
    </div>
  );
};

export default GamificationTab;
