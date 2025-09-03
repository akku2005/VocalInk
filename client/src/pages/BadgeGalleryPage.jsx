import { useState, useEffect } from "react";
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

const BadgeGalleryPage = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rarity");

  const [badgeModal, setBadgeModal] = useState({ open: false, badge: null });

  const badgeSlug = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBadges([
        // Writing Badges
        {
          id: 1,
          name: "First Post",
          description: "Published your first blog post",
          icon: "🎉",
          rarity: "common",
          category: "writing",
          earnedBy: 1247,
          totalUsers: 1250,
          progress: 100,
          earnedAt: "2023-01-15",
          requirements: [{ text: "Publish 1 blog post", completed: true }],
        },
        {
          id: 2,
          name: "Prolific Writer",
          description: "Published 50 blog posts",
          icon: "✍️",
          rarity: "rare",
          category: "writing",
          earnedBy: 234,
          totalUsers: 1250,
          progress: 45,
          earnedAt: null,
          requirements: [
            {
              text: "Publish 50 blog posts",
              completed: false,
              current: 23,
              target: 50,
            },
          ],
        },
        {
          id: 3,
          name: "Master Wordsmith",
          description: "Published 100 blog posts",
          icon: "📝",
          rarity: "epic",
          category: "writing",
          earnedBy: 89,
          totalUsers: 1250,
          progress: 12,
          earnedAt: null,
          requirements: [
            {
              text: "Publish 100 blog posts",
              completed: false,
              current: 23,
              target: 100,
            },
          ],
        },
        {
          id: 4,
          name: "Legendary Author",
          description: "Published 500 blog posts",
          icon: "👑",
          rarity: "legendary",
          category: "writing",
          earnedBy: 12,
          totalUsers: 1250,
          progress: 2,
          earnedAt: null,
          requirements: [
            {
              text: "Publish 500 blog posts",
              completed: false,
              current: 23,
              target: 500,
            },
          ],
        },

        // Engagement Badges
        {
          id: 5,
          name: "Engagement Master",
          description: "Received 100+ likes on a single post",
          icon: "🔥",
          rarity: "rare",
          category: "engagement",
          earnedBy: 156,
          totalUsers: 1250,
          progress: 85,
          earnedAt: "2023-02-20",
          requirements: [
            { text: "Receive 100+ likes on a single post", completed: true },
          ],
        },
        {
          id: 6,
          name: "Viral Sensation",
          description: "Get 10,000+ views on a single post",
          icon: "🚀",
          rarity: "legendary",
          category: "engagement",
          earnedBy: 23,
          totalUsers: 1250,
          progress: 65,
          earnedAt: null,
          requirements: [
            {
              text: "Get 10,000+ views on a single post",
              completed: false,
              current: 6500,
              target: 10000,
            },
          ],
        },
        {
          id: 7,
          name: "Comment King",
          description: "Left 100+ meaningful comments",
          icon: "💬",
          rarity: "epic",
          category: "engagement",
          earnedBy: 67,
          totalUsers: 1250,
          progress: 45,
          earnedAt: null,
          requirements: [
            {
              text: "Left 100+ meaningful comments",
              completed: false,
              current: 45,
              target: 100,
            },
          ],
        },

        // Series Badges
        {
          id: 8,
          name: "Series Creator",
          description: "Created a blog series with 5+ posts",
          icon: "📚",
          rarity: "epic",
          category: "series",
          earnedBy: 89,
          totalUsers: 1250,
          progress: 78,
          earnedAt: "2023-03-10",
          requirements: [
            { text: "Create a blog series with 5+ posts", completed: true },
          ],
        },
        {
          id: 9,
          name: "Series Master",
          description: "Created 10+ blog series",
          icon: "📖",
          rarity: "legendary",
          category: "series",
          earnedBy: 34,
          totalUsers: 1250,
          progress: 12,
          earnedAt: null,
          requirements: [
            {
              text: "Create 10+ blog series",
              completed: false,
              current: 2,
              target: 10,
            },
          ],
        },

        // AI Badges
        {
          id: 10,
          name: "AI Pioneer",
          description: "Used AI features 50+ times",
          icon: "🤖",
          rarity: "legendary",
          category: "ai",
          earnedBy: 45,
          totalUsers: 1250,
          progress: 100,
          earnedAt: "2023-04-05",
          requirements: [
            { text: "Used AI features 50+ times", completed: true },
          ],
        },
        {
          id: 11,
          name: "AI Enthusiast",
          description: "Used AI features 10+ times",
          icon: "⚡",
          rarity: "rare",
          category: "ai",
          earnedBy: 234,
          totalUsers: 1250,
          progress: 67,
          earnedAt: null,
          requirements: [
            {
              text: "Used AI features 10+ times",
              completed: false,
              current: 7,
              target: 10,
            },
          ],
        },

        // Social Badges
        {
          id: 12,
          name: "Social Butterfly",
          description: "Followed 50+ users",
          icon: "🦋",
          rarity: "rare",
          category: "social",
          earnedBy: 189,
          totalUsers: 1250,
          progress: 100,
          earnedAt: "2023-05-12",
          requirements: [{ text: "Followed 50+ users", completed: true }],
        },
        {
          id: 13,
          name: "Community Leader",
          description: "Have 1,000+ followers",
          icon: "👑",
          rarity: "legendary",
          category: "social",
          earnedBy: 23,
          totalUsers: 1250,
          progress: 80,
          earnedAt: null,
          requirements: [
            {
              text: "Have 1,000+ followers",
              completed: false,
              current: 800,
              target: 1000,
            },
          ],
        },

        // Consistency Badges
        {
          id: 14,
          name: "Consistency Champion",
          description: "Post for 30 consecutive days",
          icon: "📅",
          rarity: "epic",
          category: "consistency",
          earnedBy: 78,
          totalUsers: 1250,
          progress: 50,
          earnedAt: null,
          requirements: [
            {
              text: "Post for 30 consecutive days",
              completed: false,
              current: 15,
              target: 30,
            },
          ],
        },
        {
          id: 15,
          name: "Daily Grinder",
          description: "Post for 7 consecutive days",
          icon: "⚡",
          rarity: "common",
          category: "consistency",
          earnedBy: 456,
          totalUsers: 1250,
          progress: 78,
          earnedAt: null,
          requirements: [
            {
              text: "Post for 7 consecutive days",
              completed: false,
              current: 5,
              target: 7,
            },
          ],
        },

        // Special Badges
        {
          id: 16,
          name: "Early Adopter",
          description: "Joined VocalInk in the first month",
          icon: "🌟",
          rarity: "legendary",
          category: "special",
          earnedBy: 12,
          totalUsers: 1250,
          progress: 100,
          earnedAt: "2023-01-01",
          requirements: [
            { text: "Joined VocalInk in the first month", completed: true },
          ],
        },
        {
          id: 17,
          name: "Beta Tester",
          description: "Tested beta features and provided feedback",
          icon: "🧪",
          rarity: "epic",
          category: "special",
          earnedBy: 34,
          totalUsers: 1250,
          progress: 0,
          earnedAt: null,
          requirements: [
            {
              text: "Tested beta features and provided feedback",
              completed: false,
            },
          ],
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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

  const filteredBadges = badges
    .filter((badge) => {
      const matchesSearch =
        badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badge.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity =
        filterRarity === "all" || badge.rarity === filterRarity;
      const matchesCategory =
        filterCategory === "all" || badge.category === filterCategory;
      return matchesSearch && matchesRarity && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rarity": {
          const order = { legendary: 4, epic: 3, rare: 2, common: 1 };
          return order[b.rarity] - order[a.rarity];
        }
        case "progress":
          return b.progress - a.progress;
        case "name":
          return a.name.localeCompare(b.name);
        case "earned":
          if (a.earnedAt && !b.earnedAt) return -1;
          if (!a.earnedAt && b.earnedAt) return 1;
          if (a.earnedAt && b.earnedAt) {
            return new Date(b.earnedAt) - new Date(a.earnedAt);
          }
          return 0;
        default:
          return 0;
      }
    });

  const earnedBadges = badges.filter((badge) => badge.earnedAt);
  const totalBadges = badges.length;
  const completionRate = Math.round((earnedBadges.length / totalBadges) * 100);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[rgba(var(--color-surface),0.6)] rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded border border-[var(--border-color)] bg-[rgba(var(--color-surface),0.6)]"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded border border-[var(--border-color)] bg-[rgba(var(--color-surface),0.6)]"
              ></div>
            ))}
          </div>
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

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-primary-500">
              {earnedBadges.length}
            </div>
            <div className="text-sm text-text-secondary">Badges Earned</div>
          </CardContent>
        </Card>
        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-primary-500">
              {totalBadges}
            </div>
            <div className="text-sm text-text-secondary">Total Badges</div>
          </CardContent>
        </Card>
        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-primary-500">
              {completionRate}%
            </div>
            <div className="text-sm text-text-secondary">Completion Rate</div>
          </CardContent>
        </Card>
        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-primary-500">12,450</div>
            <div className="text-sm text-text-secondary">Total XP Earned</div>
          </CardContent>
        </Card>
      </div>

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
            key={badge.id}
            className="hover:shadow-lg transition-all duration-300 cursor-pointer border border-[var(--border-color)]"
            onClick={() => setBadgeModal({ open: true, badge })}
          >
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                {/* Badge Icon and Status */}
                <div className="relative">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  {badge.earnedAt ? (
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
                        className={`h-2 rounded-full transition-all duration-300 ${
                          badge.earnedAt ? "bg-success" : "bg-primary-500"
                        }`}
                        style={{ width: `${badge.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="mt-4 space-y-2">
                    {badge.requirements.map((req, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        {req.completed ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <Clock className="w-4 h-4 text-text-secondary" />
                        )}
                        <span
                          className={
                            req.completed
                              ? "text-success"
                              : "text-text-secondary"
                          }
                        >
                          {req.text}
                          {req.current !== undefined && (
                            <span className="font-medium text-text-primary">
                              {" "}
                              ({req.current}/{req.target})
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>{badge.earnedBy} earned</span>
                      <span>
                        {Math.round((badge.earnedBy / badge.totalUsers) * 100)}%
                        of users
                      </span>
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
              <div className="text-3xl" aria-hidden>
                {badgeModal.badge.icon}
              </div>
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
              Earned by {badgeModal.badge.earnedBy} users (
              {Math.round(
                (badgeModal.badge.earnedBy / badgeModal.badge.totalUsers) * 100
              )}
              %)
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
