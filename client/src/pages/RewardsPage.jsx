import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import badgeService from "../services/badgeService";
import { useAuth } from "../hooks/useAuth";
import {
  Trophy,
  Star,
  Target,
  Award,
  Zap,
  BookOpen,
  MessageCircle,
  Heart,
  TrendingUp,
  Crown,
  Medal,
  Sparkles,
} from "lucide-react";

const rarityStyles = {
  common: { className: "bg-gray-100 text-gray-800", Icon: Sparkles },
  rare: { className: "bg-blue-100 text-blue-800", Icon: Star },
  epic: { className: "bg-purple-100 text-purple-800", Icon: Crown },
  legendary: { className: "bg-yellow-100 text-yellow-800", Icon: Medal },
};

const emptyRewards = {
  userStats: {
    level: 1,
    xp: 0,
    totalXp: 100,
    rank: "Member",
    badgesEarned: 0,
    totalBadges: 0,
    streak: 0,
    achievements: 0,
  },
  badges: {
    earned: [],
    available: [],
  },
  achievements: [],
  leaderboard: [],
  recentActivity: [],
};

const RewardsPage = () => {
  const [rewards, setRewards] = useState(emptyRewards);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("badges");
  const { isAuthenticated, userProfile } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [stats, progress] = await Promise.all([
          badgeService.getBadgeStats().catch(() => null),
          isAuthenticated ? badgeService.getUserBadgeProgress().catch(() => null) : Promise.resolve(null),
        ]);

        const earned = progress?.badges?.filter((b) => b.earned) ?? [];
        const available = progress?.badges?.filter((b) => !b.earned) ?? [];

        const xpValue = progress?.xp ?? userProfile?.xp ?? 0;
        const remaining = progress?.remainingXP ?? 100;
        const totalXpForLevel =
          (progress?.currentLevelXP && progress?.nextLevelXP
            ? progress.currentLevelXP + progress.nextLevelXP
            : xpValue + remaining) || 100;

        setRewards({
          userStats: {
            level: progress?.level ?? userProfile?.level ?? 1,
            xp: xpValue,
            totalXp: totalXpForLevel,
            rank: progress?.rank ?? "Member",
            badgesEarned: progress?.earnedBadges ?? earned.length,
            totalBadges:
              progress?.totalBadges ??
              stats?.totalBadges ??
              earned.length + available.length,
            streak: progress?.streak ?? 0,
            achievements: available.length,
          },
          badges: {
            earned,
            available,
          },
          achievements:
            available.slice(0, 3).map((b, idx) => ({
              id: b.badgeId || b.id || idx,
              name: b.name || "Badge",
              description:
                b.description || "Keep progressing to unlock this badge",
              icon: Target,
              progress: b.progress || 0,
              target:
                b.requirements?.[0]?.target ||
                b.requirements?.[0]?.required ||
                0,
              current: b.requirements?.[0]?.current || 0,
              reward: `${b.rarity || "Badge"} reward`,
            })) || [],
          leaderboard: [],
          recentActivity: [],
        });
      } catch (err) {
        console.error("Failed to load rewards:", err);
        setRewards(emptyRewards);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, userProfile]);

  const getRarityColor = (rarity) =>
    rarityStyles[rarity]?.className || rarityStyles.common.className;

  const renderRarityIcon = (rarity, className = "w-5 h-5") => {
    const Icon = rarityStyles[rarity]?.Icon || Sparkles;
    return <Icon className={className} />;
  };

  const progressPercent = useMemo(() => {
    if (!rewards.userStats.totalXp) return 0;
    return Math.min(
      Math.round((rewards.userStats.xp / rewards.userStats.totalXp) * 100),
      100
    );
  }, [rewards.userStats.xp, rewards.userStats.totalXp]);

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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-text-primary">Rewards Center</h1>
        <p className="text-lg text-text-secondary">
          Track your progress, earn badges, and climb the leaderboard
        </p>
      </div>

      {/* User Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Trophy className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">
              {rewards.userStats.level}
            </div>
            <div className="w-full bg-primary-200 rounded-full h-2 mt-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-primary-700 mt-1">
              {rewards.userStats.xp.toLocaleString()} /{" "}
              {rewards.userStats.totalXp.toLocaleString()} XP
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rank</CardTitle>
            <Crown className="h-4 w-4 text-warning-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">
              {rewards.userStats.rank}
            </div>
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
              {rewards.userStats.totalBadges
                ? Math.round(
                    (rewards.userStats.badgesEarned /
                      rewards.userStats.totalBadges) *
                      100
                  )
                : 0}
              % complete
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Zap className="h-4 w-4 text-accent-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-600">
              {rewards.userStats.streak} days
            </div>
            <p className="text-xs text-accent-700 mt-1">Keep it going!</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            {
              id: "badges",
              label: "Badges",
              count: rewards.badges.earned.length,
            },
            {
              id: "achievements",
              label: "Achievements",
              count: rewards.achievements.length,
            },
            {
              id: "leaderboard",
              label: "Leaderboard",
              count: rewards.leaderboard.length,
            },
            {
              id: "activity",
              label: "Recent Activity",
              count: rewards.recentActivity.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
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
        {activeTab === "badges" && (
          <div className="space-y-8">
            {/* Earned Badges */}
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Earned Badges
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.badges.earned.map((badge) => {
                  const rarity = (badge.rarity || "common").toLowerCase();
                  const IconComp = rarityStyles[rarity]?.Icon || Sparkles;
                  return (
                    <Card
                      key={badge.badgeId || badge.id}
                      className="hover:shadow-lg transition-all duration-300"
                    >
                      <CardContent className="p-6 text-center">
                        <div className="flex justify-center mb-4 text-primary-600">
                          <IconComp className="w-8 h-8" />
                        </div>
                        <h3 className="font-semibold text-text-primary mb-2">
                          {badge.name}
                        </h3>
                        <p className="text-sm text-text-secondary mb-4">
                          {badge.description}
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Badge className={getRarityColor(rarity)}>
                            {renderRarityIcon(rarity, "w-4 h-4")} {rarity}
                          </Badge>
                        </div>
                        {badge.earnedAt && (
                          <p className="text-xs text-text-secondary">
                            Earned {new Date(badge.earnedAt).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {rewards.badges.earned.length === 0 && (
                  <p className="text-text-secondary">No badges earned yet.</p>
                )}
              </div>
            </div>

            {/* Available Badges */}
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Available Badges
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.badges.available.map((badge) => {
                  const rarity = (badge.rarity || "common").toLowerCase();
                  const IconComp = rarityStyles[rarity]?.Icon || Sparkles;
                  const progressValue = Math.round(badge.progress || 0);
                  const target =
                    badge.requirements?.[0]?.target ||
                    badge.requirements?.[0]?.required ||
                    0;
                  const current = badge.requirements?.[0]?.current || 0;

                  return (
                    <Card
                      key={badge.badgeId || badge.id}
                      className="hover:shadow-lg transition-all duration-300"
                    >
                      <CardContent className="p-6 text-center">
                        <div className="flex justify-center mb-4 text-text-secondary">
                          <IconComp className="w-8 h-8" />
                        </div>
                        <h3 className="font-semibold text-text-primary mb-2">
                          {badge.name}
                        </h3>
                        <p className="text-sm text-text-secondary mb-4">
                          {badge.description}
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <Badge className={getRarityColor(rarity)}>
                            {renderRarityIcon(rarity, "w-4 h-4")} {rarity}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full bg-secondary-100 rounded-full h-2">
                            <div
                              className="bg-primary-500 h-2 rounded-full transition-all duration-300 "
                              style={{ width: `${progressValue}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-text-secondary">
                            {current.toLocaleString()} / {target.toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {rewards.badges.available.length === 0 && (
                  <p className="text-text-secondary">No available badges found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="space-y-6">
            {rewards.achievements.map((achievement) => {
              const Icon = achievement.icon || Target;
              return (
                <Card
                  key={achievement.id}
                  className="hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary-100 rounded-full">
                        <Icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary mb-1">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-text-secondary mb-3">
                          {achievement.description}
                        </p>
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
                            <span className="text-success font-medium">
                              {achievement.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-success mb-1">
                          Reward
                        </div>
                        <div className="text-xs text-text-secondary">
                          {achievement.reward}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {rewards.achievements.length === 0 && (
              <p className="text-text-secondary">No achievements to show.</p>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === "leaderboard" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rewards.leaderboard.map((user) => (
                  <div
                    key={user.rank}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-warning to-warning/80 rounded-full flex items-center justify-center text-white font-bold">
                        {user.rank}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {renderRarityIcon(user.rarity || "common", "w-4 h-4")}
                        </span>
                        <div>
                          <div className="font-semibold text-text-primary">
                            {user.username}
                          </div>
                          <div className="text-sm text-text-secondary">
                            Level {user.level}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-500">
                        {user.xp.toLocaleString()} XP
                      </div>
                      <div className="text-sm text-text-secondary">
                        Rank #{user.rank}
                      </div>
                    </div>
                  </div>
                ))}
                {rewards.leaderboard.length === 0 && (
                  <p className="text-text-secondary">No leaderboard data.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Tab */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            {rewards.recentActivity.map((activity) => {
              const Icon = activity.icon || Sparkles;
              return (
                <Card
                  key={activity.id}
                  className="hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-full bg-surface ${activity.color || "text-primary"}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {activity.description}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {rewards.recentActivity.length === 0 && (
              <p className="text-text-secondary">No recent activity.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;
