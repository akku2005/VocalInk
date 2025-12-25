import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import CustomDropdown from "../components/ui/CustomDropdown";
import Input from "../components/ui/Input";
import {
  Award,
  Trophy,
  Star,
  Target,
  X,
  Filter,
  Search,
  Sparkles,
  Lock,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  BookOpen,
  Heart,
  MessageCircle,
  Zap,
  Crown,
  Flame,
  Palette,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import { Link } from "react-router-dom";
import badgeService from "../services/badgeService";
import { useAuth } from "../hooks/useAuth";
import Skeleton from "../components/skeletons/Skeleton";

const requirementFieldConfig = [
  {
    key: "xpRequired",
    formatter: (value) =>
      `Reach ${value.toLocaleString()} XP`,
  },
  {
    key: "blogsRequired",
    formatter: (value) =>
      `Publish ${value.toLocaleString()} blog${value === 1 ? "" : "s"}`,
  },
  {
    key: "followersRequired",
    formatter: (value) =>
      `Gain ${value.toLocaleString()} follower${value === 1 ? "" : "s"}`,
  },
  {
    key: "likesRequired",
    formatter: (value) =>
      `Collect ${value.toLocaleString()} like${value === 1 ? "" : "s"}`,
  },
  {
    key: "commentsRequired",
    formatter: (value) =>
      `Receive ${value.toLocaleString()} comment${value === 1 ? "" : "s"}`,
  },
  {
    key: "daysActiveRequired",
    formatter: (value) =>
      `Stay active for ${value.toLocaleString()} day${value === 1 ? "" : "s"}`,
  },
];

const clampPercentage = (value) => {
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value ?? 0);
  if (Number.isNaN(numericValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numericValue)));
};

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
    (typeof target === "number"
      ? `Complete requirement (${target.toLocaleString()})`
      : "Complete requirement");

  return {
    ...requirement,
    text,
    target,
    current,
    completed:
      typeof requirement.completed === "boolean"
        ? requirement.completed
        : typeof current === "number" &&
        typeof target === "number" &&
        current >= target,
  };
};

const normalizeRequirements = (requirements) => {
  if (!requirements) return [];

  if (Array.isArray(requirements)) {
    return requirements
      .map((item) => normalizeRequirementItem(item))
      .filter(Boolean);
  }

  if (typeof requirements === "object") {
    const derived = [];

    requirementFieldConfig.forEach(({ key, formatter }) => {
      const value = requirements[key];
      if (typeof value === "number" && value > 0) {
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

    if (
      Array.isArray(requirements.prerequisites) &&
      requirements.prerequisites.length
    ) {
      derived.push(
        normalizeRequirementItem({
          text: `Unlock ${requirements.prerequisites.length
            } prerequisite badge${requirements.prerequisites.length === 1 ? "" : "s"
            }`,
          target: requirements.prerequisites.length,
          completed: false,
        })
      );
    }

    if (requirements.logicalExpression) {
      derived.push(
        normalizeRequirementItem({
          text: "Meet special eligibility rules",
          description: requirements.logicalExpression,
          completed: false,
        })
      );
    }

    return derived;
  }

  return [];
};

const normalizeBadgeForDisplay = (badge, progressInfo = null) => {
  const normalizedRequirements = normalizeRequirements(
    progressInfo?.requirements ?? badge.requirements
  );

  return {
    ...badge,
    progress: clampPercentage(
      progressInfo?.progress ?? badge.progress ?? 0
    ),
    requirements: normalizedRequirements,
    earned: progressInfo?.earned ?? badge.earned ?? false,
    earnedAt: progressInfo?.earned
      ? progressInfo?.earnedAt || badge.earnedAt
      : badge.earnedAt,
  };
};

const formatRequirementValue = (value) =>
  typeof value === "number" ? value.toLocaleString() : value;

const BadgeGalleryPage = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rarity");
  const [badgeStats, setBadgeStats] = useState(null);
  const [progressSummary, setProgressSummary] = useState(null);

  const [badgeModal, setBadgeModal] = useState({ open: false, badge: null });
  const { userProfile, isAuthenticated } = useAuth();

  const badgeSlug = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const fetchBadgeStats = useCallback(async () => {
    try {
      const stats = await badgeService.getBadgeStats();
      setBadgeStats(stats);
    } catch (statsError) {
      console.error("Failed to load badge stats", statsError);
    }
  }, []);

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!isAuthenticated) {
      setProgressSummary(null);
    }
    try {
      const params = { limit: 60 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filterRarity !== "all") params.rarity = filterRarity;
      if (filterCategory !== "all") params.category = filterCategory;
      if (sortBy === "rarity" || sortBy === "name") {
        params.sortBy = sortBy;
        params.sortOrder = sortBy === "name" ? "asc" : "desc";
      }

      const { badges: badgeList = [] } = await badgeService.getBadges(params);
      let progressMap = null;

      if (isAuthenticated) {
        try {
          const progress = await badgeService.getUserBadgeProgress();
          if (progress) {
            setProgressSummary(progress);
            progressMap = new Map(
              (progress.badges || []).map((entry) => [
                entry.badgeId?.toString() || entry.badgeKey,
                entry,
              ])
            );
          }
        } catch (progressError) {
          setProgressSummary(null);
          if (progressError.response?.status !== 401) {
            // console.error("Failed to load badge progress", progressError);
          }
        }
      }

      const enrichedBadges = badgeList.map((badge) => {
        const key = badge._id?.toString?.() || badge.badgeKey;
        const progressInfo = key && progressMap ? progressMap.get(key) : null;
        return normalizeBadgeForDisplay(badge, progressInfo);
      });

      setBadges(enrichedBadges);
    } catch (err) {
      console.error("Failed to load badges", err);
      setError(err.response?.data?.message || err.message || "Failed to load badges");
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterRarity, filterCategory, sortBy, isAuthenticated]);

  useEffect(() => {
    fetchBadgeStats();
  }, [fetchBadgeStats]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const rarities = [
    { id: "all", name: "All Rarities", color: "bg-surface text-text-primary" },
    { id: "common", name: "Common", color: "bg-surface text-text-primary" },
    { id: "rare", name: "Rare", color: "bg-surface text-text-primary" },
    { id: "epic", name: "Epic", color: "bg-surface text-text-primary" },
    {
      id: "legendary",
      name: "Legendary",
      color: "bg-surface text-text-primary",
    },
  ];

  const categories = [
    { id: "all", name: "All Categories", icon: Award },
    { id: "writing", name: "Writing", icon: BookOpen },
    { id: "engagement", name: "Engagement", icon: Heart },
    { id: "series", name: "Series", icon: BookOpen },
    { id: "ai", name: "AI", icon: Zap },
    { id: "social", name: "Social", icon: Users },
    { id: "consistency", name: "Consistency", icon: Clock },
    { id: "special", name: "Special", icon: Star },
  ];

  const sortOptions = [
    { value: "rarity", label: "Rarity" },
    { value: "progress", label: "Progress" },
    { value: "name", label: "Name" },
    { value: "earned", label: "Recently Earned" },
  ];

  const filteredBadges = useMemo(() => {
    return badges
      .filter((badge) => {
        const matchesSearch =
          badge.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          badge.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRarity =
          filterRarity === "all" || badge.rarity === filterRarity;
        const matchesCategory =
          filterCategory === "all" || badge.category === filterCategory;
        return matchesSearch && matchesRarity && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "rarity": {
            const order = {
              mythic: 6,
              legendary: 5,
              epic: 4,
              rare: 3,
              uncommon: 2,
              common: 1,
            };
            return (order[b.rarity] || 0) - (order[a.rarity] || 0);
          }
          case "progress":
            return (b.progress || 0) - (a.progress || 0);
          case "name":
            return a.name.localeCompare(b.name);
          case "earned":
            if (a.earned && !b.earned) return -1;
            if (!a.earned && b.earned) return 1;
            if (a.earnedAt && b.earnedAt) {
              return new Date(b.earnedAt) - new Date(a.earnedAt);
            }
            return 0;
          default:
            return 0;
        }
      });
  }, [badges, searchQuery, filterRarity, filterCategory, sortBy]);

  const earnedBadges = badges.filter((badge) => badge.earned || badge.earnedAt);
  const totalBadges = badgeStats?.totalBadges ?? badges.length;
  const completionRate =
    progressSummary?.completionPercentage ??
    (totalBadges
      ? Math.round((earnedBadges.length / Math.max(totalBadges, 1)) * 100)
      : 0);
  const totalXp = userProfile?.xp ?? 0;

  if (loading) {
    const placeholderBadges = Array.from({ length: 6 });
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8" aria-busy="true">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>

        <Card className="border border-[var(--border-color)]">
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card
              key={idx}
              className="border border-[var(--border-color)] p-6 space-y-3"
            >
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full rounded-full" />
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholderBadges.map((_, idx) => (
            <Card
              key={idx}
              className="border border-[var(--border-color)]"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-center">
                  <Skeleton className="h-16 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mx-auto" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full rounded-full" />
                  <Skeleton className="h-3 w-3/4 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-text-primary">Badge Gallery</h1>
        <p className="text-lg text-text-secondary">
          Unlock achievements and showcase your progress
        </p>
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <Card className="border border-[var(--border-color)]">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary " />
              <Input
                type="text"
                placeholder="Search badges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 border border-[var(--border-color)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--light-text-color)] cursor-pointer touch-target"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rarity Filter */}
              <div>
                <CustomDropdown
                  label="Rarity"
                  value={filterRarity}
                  onChange={(val) => setFilterRarity(val)}
                  options={rarities}
                  optionLabelKey="name"
                  optionValueKey="id"
                  placeholder="Select a rarity"
                  className="w-full"
                />
              </div>

              {/* Category Filter */}
              <div>
                <CustomDropdown
                  label="Category"
                  value={filterCategory}
                  onChange={(val) => setFilterCategory(val)}
                  options={categories}
                  optionLabelKey="name"
                  optionValueKey="id"
                  placeholder="Select a category"
                  className="w-full"
                />
              </div>

              {/* Sort By */}
              <div>
                <CustomDropdown
                  label="Sort by"
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions.map((opt) => ({
                    id: opt.value,
                    name: opt.label,
                  }))}
                  optionLabelKey="name"
                  optionValueKey="id"
                  placeholder="Select sort option"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-text-secondary">
          Showing{" "}
          <span className="font-semibold text-text-primary">
            {filteredBadges.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-text-primary">{totalBadges}</span>{" "}
          badges
        </div>
        <div className="text-sm text-text-secondary">
          {earnedBadges.length} earned • {totalBadges - earnedBadges.length}{" "}
          remaining
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBadges.map((badge) => (
          <Card
            key={badge._id || badge.id}
            className="hover:shadow-lg transition-all duration-300 cursor-pointer border border-[var(--border-color)]"
            onClick={() => setBadgeModal({ open: true, badge })}
          >
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                {/* Badge Icon and Status */}
                <div className="relative">
                  {badge.icon?.startsWith('/') || badge.icon?.startsWith('http') ? (
                    <img
                      src={badge.icon}
                      alt={badge.name}
                      className="w-16 h-16 mx-auto mb-2 object-contain"
                    />
                  ) : (
                    <div className="text-4xl mb-2">{badge.icon}</div>
                  )}
                  {badge.earned || badge.earnedAt ? (
                    <div className="absolute -top-2 -right-2">
                      <CheckCircle className="w-6 h-6 text-success" />
                    </div>
                  ) : (
                    <div className="absolute -top-2 -right-2">
                      <Lock className="w-6 h-6 text-text-secondary" />
                    </div>
                  )}
                </div>

                {/* Badge Info */}
                <div>
                  <h3 className="font-semibold text-text-primary text-lg mb-2">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                    {badge.description}
                  </p>

                  {/* Rarity Badge */}
                  <div className="flex justify-center mb-3">
                    <Badge
                      className={
                        rarities.find((r) => r.id === badge.rarity)?.color
                      }
                    >
                      {badge.rarity.charAt(0).toUpperCase() +
                        badge.rarity.slice(1)}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Progress</span>
                      <span className="font-medium text-text-primary">
                        {badge.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${badge.earnedAt ? "bg-success" : "bg-primary-500"
                          }`}
                        style={{ width: `${badge.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="mt-4 space-y-2">
                    {Array.isArray(badge.requirements) &&
                      badge.requirements.length > 0 ? (
                      badge.requirements.map((req, index) => {
                        const requirementText =
                          req.text || req.name || "Requirement";
                        const currentValue =
                          req.current ?? req.value ?? undefined;
                        const targetValue =
                          req.target ?? req.required ?? req.goal ?? undefined;
                        const showValues =
                          typeof currentValue !== "undefined" &&
                          typeof targetValue !== "undefined";

                        return (
                          <div
                            key={`${requirementText}-${index}`}
                            className="flex items-start gap-2 text-sm"
                          >
                            {req.completed ? (
                              <CheckCircle className="w-4 h-4 mt-0.5 text-success" />
                            ) : (
                              <Clock className="w-4 h-4 mt-0.5 text-text-secondary" />
                            )}
                            <div>
                              <span
                                className={
                                  req.completed
                                    ? "text-success"
                                    : "text-text-secondary"
                                }
                              >
                                {requirementText}
                                {showValues && (
                                  <span className="font-medium text-text-primary">
                                    {" "}
                                    (
                                    {formatRequirementValue(currentValue)}/
                                    {formatRequirementValue(targetValue)})
                                  </span>
                                )}
                              </span>
                              {req.description && (
                                <div className="text-xs text-text-secondary">
                                  {req.description}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-text-secondary">
                        Requirements will be announced soon.
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      {(() => {
                        const earnedCount = (badge.analytics?.totalEarned ?? badge.earnedBy ?? 0);
                        const rawAdoption =
                          typeof badge.analytics?.popularityScore === "number"
                            ? badge.analytics.popularityScore
                            : typeof badge.analytics?.adoptionRate === "number"
                              ? badge.analytics.adoptionRate
                              : null;
                        const adoptionPercent =
                          Number.isFinite(rawAdoption) && rawAdoption > 0
                            ? Math.round(Math.min(rawAdoption * 100, 100))
                            : null;
                        return (
                          <>
                            <span>{earnedCount.toLocaleString()} earned</span>
                            {adoptionPercent !== null && (
                              <span>{adoptionPercent}% adoption</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Earned Date */}
                  {badge.earnedAt && (
                    <div className="mt-2 text-xs text-success">
                      Earned {new Date(badge.earnedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={badgeModal.open}
        onClose={() => setBadgeModal({ open: false, badge: null })}
        title={badgeModal.badge?.name || "Badge"}
        footer={
          <>
            <button
              className="px-4 py-2 rounded-md border border-[var(--border-color)] cursor-pointer"
              onClick={() => setBadgeModal({ open: false, badge: null })}
            >
              Close
            </button>
            {badgeModal.badge && (
              <Link
                to={`/badges/${badgeSlug(badgeModal.badge.name)}`}
                className="px-4 py-2 rounded-md bg-primary-500 text-white"
              >
                View details
              </Link>
            )}
          </>
        }
      >
        {badgeModal.badge && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {badgeModal.badge.icon?.startsWith('/') || badgeModal.badge.icon?.startsWith('http') ? (
                <img
                  src={badgeModal.badge.icon}
                  alt={badgeModal.badge.name}
                  className="w-12 h-12 object-contain"
                  aria-hidden
                />
              ) : (
                <div className="text-3xl" aria-hidden>
                  {badgeModal.badge.icon}
                </div>
              )}
              <Badge
                className={
                  rarities.find((r) => r.id === badgeModal.badge.rarity)?.color
                }
              >
                {badgeModal.badge.rarity}
              </Badge>
            </div>
            <p className="text-text-secondary">
              {badgeModal.badge.description}
            </p>
            <div className="text-sm text-text-secondary">
              Earned by{" "}
              {(
                badgeModal.badge.analytics?.totalEarned ??
                badgeModal.badge.earnedBy ??
                0
              ).toLocaleString()}{" "}
              users
            </div>
          </div>
        )}
      </Modal>

      {/* Empty State */}
      {filteredBadges.length === 0 && (
        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              No badges found
            </h3>
            <p className="text-text-secondary">
              Try adjusting your search or filters to find more badges.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BadgeGalleryPage;
