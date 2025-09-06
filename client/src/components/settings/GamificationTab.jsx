import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Badge, Trophy, Star, Target, Zap, Award } from 'lucide-react';
import settingsService from '../../services/settingsService';

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
        ...prev.gamification,
        [field]: value,
      },
    }));
  };

  const handleSaveGamification = async () => {
    setLoading(true);
    try {
      console.log('Saving Gamification settings:', settings.gamification);
      
      await settingsService.updateGamificationSection(settings.gamification);
      
      // Force refresh to get updated data
      await loadSettings(true);
      
      showToast('Gamification settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving gamification settings:', error);
      showToast(error.message || 'Failed to save gamification settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const difficultyLevels = [
    { value: 'easy', label: 'Easy', description: 'Lower thresholds, more frequent rewards' },
    { value: 'medium', label: 'Medium', description: 'Balanced challenge and rewards' },
    { value: 'hard', label: 'Hard', description: 'Higher thresholds, exclusive rewards' },
    { value: 'expert', label: 'Expert', description: 'Maximum challenge for dedicated users' }
  ];

  const badgeCategories = [
    { id: 'writing', name: 'Writing', icon: '✍️', count: gamification.writingBadges || 0 },
    { id: 'social', name: 'Social', icon: '👥', count: gamification.socialBadges || 0 },
    { id: 'consistency', name: 'Consistency', icon: '🔥', count: gamification.consistencyBadges || 0 },
    { id: 'quality', name: 'Quality', icon: '⭐', count: gamification.qualityBadges || 0 },
    { id: 'milestone', name: 'Milestones', icon: '🏆', count: gamification.milestoneBadges || 0 },
    { id: 'special', name: 'Special', icon: '🎖️', count: gamification.specialBadges || 0 }
  ];

  const achievements = [
    { id: 'first_post', name: 'First Steps', description: 'Published your first post', completed: true },
    { id: 'week_streak', name: 'Consistent Writer', description: 'Posted for 7 consecutive days', completed: true },
    { id: 'hundred_likes', name: 'Popular Creator', description: 'Received 100 likes total', completed: false },
    { id: 'ten_comments', name: 'Engaging Writer', description: 'Received 10 comments on a single post', completed: false },
    { id: 'month_active', name: 'Dedicated User', description: 'Active for 30 days', completed: true }
  ];

  return (
    <div className="space-y-6">
      {/* Gamification Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Your Progress
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

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">Progress to Level {(gamification.level || 1) + 1}</span>
              <span className="text-sm text-text-secondary">{gamification.currentLevelXP || 0} / {gamification.nextLevelXP || 100} XP</span>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((gamification.currentLevelXP || 0) / (gamification.nextLevelXP || 100)) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gamification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Target className="w-5 h-5" />
            Gamification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-text-primary">Enable Gamification</h4>
                <p className="text-sm text-text-secondary">Show badges, levels, and achievements</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gamification.enabled !== undefined ? gamification.enabled : true}
                  onChange={(e) => handleInputChange('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-text-primary">Show Progress Notifications</h4>
                <p className="text-sm text-text-secondary">Get notified when you earn badges or level up</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gamification.showNotifications !== undefined ? gamification.showNotifications : true}
                  onChange={(e) => handleInputChange('showNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-text-primary">Public Profile Badges</h4>
                <p className="text-sm text-text-secondary">Display your badges on your public profile</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gamification.publicBadges !== undefined ? gamification.publicBadges : true}
                  onChange={(e) => handleInputChange('publicBadges', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-text-primary">Leaderboard Participation</h4>
                <p className="text-sm text-text-secondary">Participate in community leaderboards</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gamification.leaderboard !== undefined ? gamification.leaderboard : false}
                  onChange={(e) => handleInputChange('leaderboard', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Challenge Difficulty
            </label>
            <div className="space-y-3">
              {difficultyLevels.map((level) => (
                <label
                  key={level.value}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-secondary-50"
                >
                  <input
                    type="radio"
                    name="difficulty"
                    value={level.value}
                    checked={gamification.difficulty === level.value}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                    className="w-4 h-4 text-primary-500 border-border focus:ring-primary-500"
                  />
                  <div>
                    <div className="font-medium text-text-primary">{level.label}</div>
                    <div className="text-sm text-text-secondary">{level.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Badge className="w-5 h-5" />
            Badge Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badgeCategories.map((category) => (
              <div
                key={category.id}
                className="p-4 border rounded-lg text-center hover:bg-secondary-50 transition-colors"
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="font-medium text-text-primary">{category.name}</div>
                <div className="text-sm text-text-secondary">{category.count} earned</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
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
                  achievement.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-secondary-50 border-border'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  achievement.completed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-secondary-200 text-secondary-500'
                }`}>
                  {achievement.completed ? (
                    <Trophy className="w-5 h-5" />
                  ) : (
                    <Target className="w-5 h-5" />
                  )}
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

      {/* XP Multipliers */}
      <Card>
        <CardHeader>
          <CardTitle className="font-medium flex items-center gap-2">
            <Zap className="w-5 h-5" />
            XP Multipliers
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900">Daily Streak</div>
                  <div className="text-sm text-blue-700">+{gamification.streakMultiplier || 1.0}x XP</div>
                </div>
                <div className="text-2xl">🔥</div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-purple-900">Premium Bonus</div>
                  <div className="text-sm text-purple-700">+{gamification.premiumMultiplier || 1.0}x XP</div>
                </div>
                <div className="text-2xl">⭐</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-orange-900">Weekend Boost</div>
                <div className="text-sm text-orange-700">Double XP on weekends</div>
              </div>
              <div className="text-2xl">🎉</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
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
