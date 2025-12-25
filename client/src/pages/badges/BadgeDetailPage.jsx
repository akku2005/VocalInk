import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { CheckCircle, Clock, Award, Sparkles, Lock } from 'lucide-react';
import badgeService from '../../services/badgeService';
import Skeleton from '../../components/skeletons/Skeleton';
import { useAuth } from '../../hooks/useAuth';

// Shared fallback/demo badges (mirrors gallery extras)
const fallbackBadges = [
  {
    name: "Veteran Writer",
    description: "Be active for 90 days",
    rarity: "legendary",
    category: "writing",
    progress: 0,
    icon: "🏆",
    requirements: [
      { text: "Reach 2,000 XP", target: 2000, current: 0, completed: false },
      { text: "Publish 20 blogs", target: 20, current: 0, completed: false },
      { text: "Gain 50 followers", target: 50, current: 0, completed: false },
      { text: "Collect 1,000 likes", target: 1000, current: 0, completed: false },
      { text: "Receive 200 comments", target: 200, current: 0, completed: false },
      { text: "Stay active for 90 days", target: 90, current: 0, completed: false },
    ],
    analytics: { totalEarned: 0 },
  },
  {
    name: "Thought Leader",
    description: "Reach 5,000 total reads across your posts",
    rarity: "legendary",
    category: "engagement",
    progress: 22,
    icon: "🧠",
    requirements: [
      { text: "Reach 5,000 reads", target: 5000, current: 1100, completed: false },
    ],
    analytics: { totalEarned: 17 },
  },
  {
    name: "Speedrunner",
    description: "Draft, edit, and publish a post within 2 hours",
    rarity: "legendary",
    category: "achievement",
    progress: 80,
    icon: "⚡",
    requirements: [
      { text: "Complete a publish cycle in 2 hours", target: 1, current: 0, completed: false },
    ],
    analytics: { totalEarned: 9 },
  },
  {
    name: "Community Builder",
    description: "Gain 100 followers",
    rarity: "epic",
    category: "community",
    progress: 0,
    icon: "👥",
    requirements: [
      { text: "Reach 1,000 XP", target: 1000, current: 0, completed: false },
      { text: "Publish 5 blogs", target: 5, current: 0, completed: false },
      { text: "Collect 150 likes", target: 150, current: 0, completed: false },
      { text: "Receive 20 comments", target: 20, current: 0, completed: false },
      { text: "Stay active for 30 days", target: 30, current: 0, completed: false },
    ],
    analytics: { totalEarned: 0 },
  },
  {
    name: "AI Explorer",
    description: "Use AI tools for writing or editing 15 times",
    rarity: "uncommon",
    category: "ai",
    progress: 90,
    icon: "🤖",
    requirements: [
      { text: "Use AI helpers 15 times", target: 15, current: 13, completed: false },
    ],
    analytics: { totalEarned: 120 },
  },
];

const slugify = (name = '') =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const clampPercentage = (value) => {
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value ?? 0);
  if (Number.isNaN(numericValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numericValue)));
};

const requirementFieldConfig = [
  { key: 'xpRequired', formatter: (value) => `Reach ${value.toLocaleString()} XP` },
  { key: 'blogsRequired', formatter: (value) => `Publish ${value.toLocaleString()} blog${value === 1 ? '' : 's'}` },
  { key: 'followersRequired', formatter: (value) => `Gain ${value.toLocaleString()} follower${value === 1 ? '' : 's'}` },
  { key: 'likesRequired', formatter: (value) => `Collect ${value.toLocaleString()} like${value === 1 ? '' : 's'}` },
  { key: 'commentsRequired', formatter: (value) => `Receive ${value.toLocaleString()} comment${value === 1 ? '' : 's'}` },
  { key: 'daysActiveRequired', formatter: (value) => `Stay active for ${value.toLocaleString()} day${value === 1 ? '' : 's'}` },
];

const normalizeRequirementItem = (requirement) => {
  if (!requirement) return null;

  const target =
    requirement.target ??
    requirement.required ??
    requirement.goal ??
    requirement.value ??
    requirement.threshold ??
    null;

  const current =
    requirement.current ??
    requirement.progressCurrent ??
    requirement.valueCurrent ??
    undefined;

  const text =
    requirement.text ||
    requirement.name ||
    requirement.label ||
    requirement.description ||
    (typeof target === 'number'
      ? `Complete requirement (${target.toLocaleString()})`
      : 'Complete requirement');

  return {
    ...requirement,
    text,
    target,
    current,
    completed:
      typeof requirement.completed === 'boolean'
        ? requirement.completed
        : typeof current === 'number' && typeof target === 'number' && current >= target,
  };
};

const normalizeRequirements = (requirements) => {
  if (!requirements) return [];

  if (Array.isArray(requirements)) {
    return requirements.map((item) => normalizeRequirementItem(item)).filter(Boolean);
  }

  if (typeof requirements === 'object') {
    const derived = [];
    requirementFieldConfig.forEach(({ key, formatter }) => {
      const value = requirements[key];
      if (typeof value === 'number' && value > 0) {
        derived.push(
          normalizeRequirementItem({
            text: formatter(value),
            target: value,
            current: undefined,
            completed: false,
          })
        );
      }
    });

    if (Array.isArray(requirements.prerequisites) && requirements.prerequisites.length) {
      derived.push(
        normalizeRequirementItem({
          text: `Unlock ${requirements.prerequisites.length} prerequisite badge${requirements.prerequisites.length === 1 ? '' : 's'}`,
          target: requirements.prerequisites.length,
          completed: false,
        })
      );
    }

    if (requirements.logicalExpression) {
      derived.push(
        normalizeRequirementItem({
          text: 'Meet special eligibility rules',
          description: requirements.logicalExpression,
          completed: false,
        })
      );
    }

    return derived;
  }

  return [];
};

const normalizeBadge = (badge, { isAuthenticated }) => {
  if (!badge) return null;
  const requirements = normalizeRequirements(badge.requirements);

  return {
    ...badge,
    slug: slugify(badge.name),
    progress: isAuthenticated ? clampPercentage(badge.progress || 0) : 0,
    requirements: requirements.map((req) => ({
      ...req,
      current: isAuthenticated ? req.current : undefined,
      completed: isAuthenticated ? req.completed : false,
    })),
    earnedCount: badge.isDemo ? 0 : (badge.analytics?.totalEarned ?? badge.earnedBy ?? 0),
    rarity: badge.rarity || 'common',
    category: badge.category || 'achievement',
    isDemo: badge.isDemo || false,
    earnedAt: isAuthenticated ? badge.earnedAt : null,
  };
};

const getRarityClass = (rarity) => {
  switch (rarity) {
    case 'legendary':
      return 'text-yellow-500';
    case 'epic':
      return 'text-purple-500';
    case 'rare':
      return 'text-blue-500';
    case 'uncommon':
      return 'text-emerald-500';
    default:
      return 'text-text-secondary';
  }
};

const LoadingView = () => (
  <div className="max-w-3xl mx-auto p-6 space-y-4" aria-busy="true">
    <Skeleton className="h-10 w-2/3" />
    <Card className="border border-[var(--border-color)]">
      <CardContent className="p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/5" />
      </CardContent>
    </Card>
  </div>
);

const NotFound = () => (
  <div className="max-w-3xl mx-auto p-6">
    <Card className="border border-[var(--border-color)]">
      <CardContent className="p-8 text-center space-y-4">
        <div className="text-5xl mb-2" aria-hidden>
          ?
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Badge not found</h1>
        <p className="text-text-secondary">
          We couldn't find this badge. It might have been removed or renamed.
        </p>
        <Link to="/badges" className="text-primary-500">
          Go back to badges
        </Link>
      </CardContent>
    </Card>
  </div>
);

export default function BadgeDetailPage() {
  const { slug } = useParams();
  const [badge, setBadge] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let mounted = true;
    const loadBadge = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try searching directly by slug/name to minimize data transfer
        const searchTerm = slug.replace(/-/g, ' ');
        const searchResult = await badgeService.searchBadges(searchTerm, { limit: 100 });
        const normalizedSearch = (searchResult.badges || []).map((b) => normalizeBadge(b, { isAuthenticated }));

        // Fallback: broad fetch if search misses (e.g., backend search disabled)
        const listResult =
          normalizedSearch.length === 0
            ? await badgeService.getBadges({ limit: 100 })
            : null;
        const normalizedList =
          normalizedSearch.length > 0
            ? normalizedSearch
            : (listResult?.badges || []).map((b) => normalizeBadge(b, { isAuthenticated }));

        // Also include fallback/demo badges for detail pages
        const normalizedFallback = fallbackBadges.map((b) =>
          normalizeBadge({ ...b, badgeKey: b.badgeKey || slugify(b.name) }, { isAuthenticated })
        );

        const matched =
          normalizedList.find(
            (b) => b.slug === slug || b.badgeKey === slug
          ) ||
          normalizedFallback.find(
            (b) => b.slug === slug || b.badgeKey === slug
          );

        if (!matched) {
          if (mounted) {
            setBadge(null);
            setError('Badge not found');
          }
          return;
        }

        let detailedBadge = matched;
        if (matched._id) {
          try {
            const fetched = await badgeService.getBadgeById(matched._id);
            if (fetched) {
              detailedBadge = normalizeBadge({ ...matched, ...fetched }, { isAuthenticated });
            }
          } catch (detailError) {
            // fall back silently to matched badge
            console.warn('Badge detail fetch failed, using basic data', detailError);
          }
        }

        if (mounted) {
          setBadge(detailedBadge);
          const relatedPool = [...normalizedList, ...normalizedFallback];
          setRelated(
            relatedPool
              .filter((b) => b.slug !== matched.slug && b.category === matched.category)
              .slice(0, 3)
          );
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || err.message || 'Unable to load badge');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadBadge();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const rewards = useMemo(() => {
    if (!badge?.requirements?.rewards) return null;
    const reward = badge.requirements.rewards;
    return [
      reward.xp ? `+${reward.xp.toLocaleString()} XP` : null,
      reward.bonus ? `+${reward.bonus.toLocaleString()} bonus points` : null,
      Array.isArray(reward.multipliers) && reward.multipliers.length
        ? `Multipliers: ${reward.multipliers.join('x, ')}`
        : null,
    ].filter(Boolean);
  }, [badge]);

  if (loading) return <LoadingView />;
  if (error || !badge) return <NotFound />;

  const displayProgress = isAuthenticated ? badge.progress : 0;
  const displayEarnedCount = badge.isDemo ? 0 : badge.earnedCount;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border border-[var(--border-color)]">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="text-6xl" aria-hidden>
              {badge.icon || '🏅'}
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline">Rarity</Badge>
                <span className={`font-medium ${getRarityClass(badge.rarity)}`}>
                  {badge.rarity}
                </span>
                <Badge variant="outline">Category</Badge>
                <span className="text-text-secondary capitalize">{badge.category}</span>
                <Badge variant="outline">Earned by</Badge>
                <span className="text-text-secondary">
                  {displayEarnedCount.toLocaleString()} users
                </span>
              </div>
              <h1 className="text-3xl font-bold text-text-primary">{badge.name}</h1>
              <p className="text-text-secondary">{badge.description}</p>
              {badge.longDescription && (
                <p className="text-text-secondary">{badge.longDescription}</p>
              )}
              {badge.exceptions?.isLimitedTime && (
                <div className="text-sm text-amber-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Limited-time badge
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[var(--border-color)]">
        <CardContent className="p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">Progress</h2>
            {badge.earnedAt ? (
              <span className="text-success text-sm">
                Earned {new Date(badge.earnedAt).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-text-secondary text-sm">Not earned yet</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Completion</span>
              <span className="font-medium text-text-primary">{displayProgress}%</span>
            </div>
            <div className="w-full bg-secondary-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${badge.earnedAt ? 'bg-success' : 'bg-primary-500'}`}
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>
          {rewards && rewards.length > 0 && (
            <div className="border border-[var(--border-color)] rounded-lg p-4 bg-surface">
              <div className="text-sm font-semibold text-text-primary mb-2">Rewards</div>
              <ul className="list-disc list-inside text-text-secondary space-y-1">
                {rewards.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-[var(--border-color)]">
        <CardContent className="p-8 space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Requirements</h2>
          <ul className="space-y-3">
            {badge.requirements && badge.requirements.length > 0 ? (
              badge.requirements.map((req, i) => (
                <li key={`${req.text}-${i}`} className="flex items-start gap-3 text-text-secondary">
                  {req.completed ? (
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  ) : (
                    <Clock className="w-5 h-5 text-text-secondary mt-0.5" />
                  )}
                  <div>
                    <div className={req.completed ? 'text-success' : 'text-text-secondary'}>
                      {req.text}
                      {isAuthenticated && typeof req.current !== 'undefined' && typeof req.target !== 'undefined' && (
                        <span className="ml-1 text-text-primary font-medium">
                          ({req.current}/{req.target})
                        </span>
                      )}
                    </div>
                    {req.description && (
                      <div className="text-xs text-text-secondary">{req.description}</div>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="text-text-secondary flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Requirements will be announced soon.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {related.length > 0 && (
        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-8 space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-text-primary">More badges in this category</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link
                  key={item._id || item.slug}
                  to={`/badges/${item.slug}`}
                  className="border border-[var(--border-color)] rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-2">{item.icon || '🏅'}</div>
                  <div className="font-semibold text-text-primary">{item.name}</div>
                  <div className="text-sm text-text-secondary capitalize">{item.rarity}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Link to="/badges" className="px-4 py-2 rounded-md border border-[var(--border-color)]">
          Back to badges
        </Link>
      </div>
    </div>
  );
}
