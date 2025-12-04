import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import SeriesPageSkeleton from "../components/skeletons/SeriesPageSkeleton";
import {
  Search,
  Filter,
  Plus,
  Grid3X3,
  List,
  Layers,
  Users,
  Clock,
  BookOpen,
  TrendingUp,
  Star,
  Play,
  X,
  ArrowUpDown,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Award,
  Target,
  Zap,
  Shield,
  AlertCircle,
} from "lucide-react";
import DiscoverSeriesDropDown from "../components/ui/DiscoverSeriesDropdown";
import seriesService from "../services/seriesService";
import ErrorBoundary from "../components/error/ErrorBoundary.jsx";
import { resolveAssetUrl } from "../constants/apiConfig";

const SeriesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  // State management with URL sync (matching BlogPage pattern)
  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    params.get("cat") || "all"
  );
  const [selectedTemplate, setSelectedTemplate] = useState(
    params.get("template") || "all"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState(
    params.get("difficulty") || "all"
  );
  const [viewMode, setViewMode] = useState(params.get("view") || "grid");
  const [sortBy, setSortBy] = useState(params.get("sort") || "recent");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [series, setSeries] = useState([]);
  const [error, setError] = useState(null);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Fetch series from API
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await seriesService.getSeries({
          page: 1,
          limit: 50,
          category: selectedCategory !== 'all' ? selectedCategory.toLowerCase() : undefined,
          template: selectedTemplate !== 'all' ? selectedTemplate : undefined,
          difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
          sortBy: sortBy === 'recent' ? 'createdAt' : sortBy === 'popular' ? 'analytics.totalViews' : 'createdAt',
          sortOrder: 'desc',
          search: debouncedQuery
        });
        setSeries(data);
      } catch (err) {
        console.error('Error fetching series:', err);
        setError('Failed to load series. Please try again later.');
        setSeries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeries();
  }, [selectedCategory, selectedTemplate, selectedDifficulty, sortBy, debouncedQuery]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Dynamic categories based on API data
  const categories = useMemo(() => {
    const categoryMap = {};
    series.forEach(s => {
      const cat = s.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const cats = [{ id: "all", name: "All Series", count: series.length }];
    Object.entries(categoryMap).forEach(([name, count]) => {
      cats.push({
        id: name.toLowerCase(),
        name: name,
        count
      });
    });
    return cats;
  }, [series]);

  const templates = useMemo(() => {
    const templateMap = {};
    series.forEach(s => {
      const tmpl = s.template || 'Other';
      templateMap[tmpl] = (templateMap[tmpl] || 0) + 1;
    });

    const tmpls = [{ id: "all", name: "All Templates", count: series.length }];
    Object.entries(templateMap).forEach(([name, count]) => {
      tmpls.push({
        id: name,
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count
      });
    });
    return tmpls;
  }, [series]);

  const difficulties = useMemo(() => {
    const difficultyMap = {};
    series.forEach(s => {
      const diff = s.difficulty || 'Other';
      difficultyMap[diff] = (difficultyMap[diff] || 0) + 1;
    });

    const diffs = [{
      id: "all",
      name: "All Levels",
      count: series.length,
      color: "bg-gray-500 text-white hover:bg-gray-600",
    }];

    const colorMap = {
      beginner: "bg-indigo-600 text-white hover:bg-indigo-700",
      intermediate: "bg-black text-white hover:bg-gray-800",
      advanced: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-100",
    };

    Object.entries(difficultyMap).forEach(([name, count]) => {
      diffs.push({
        id: name,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        color: colorMap[name] || "bg-gray-500 text-white hover:bg-gray-600",
      });
    });
    return diffs;
  }, [series]);

  // URL sync effect (matching BlogPage pattern)
  useEffect(() => {
    const q = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
    const cat =
      selectedCategory && selectedCategory !== "all"
        ? `&cat=${encodeURIComponent(selectedCategory)}`
        : "";
    const template =
      selectedTemplate && selectedTemplate !== "all"
        ? `&template=${encodeURIComponent(selectedTemplate)}`
        : "";
    const difficulty =
      selectedDifficulty && selectedDifficulty !== "all"
        ? `&difficulty=${encodeURIComponent(selectedDifficulty)}`
        : "";
    const view =
      viewMode !== "grid" ? `&view=${encodeURIComponent(viewMode)}` : "";
    const sort =
      sortBy !== "recent" ? `&sort=${encodeURIComponent(sortBy)}` : "";

    const query = [q, cat, template, difficulty, view, sort]
      .filter(Boolean)
      .join("");
    const url = query ? `/series?${query.replace(/^&/, "")}` : "/series";
    navigate(url, { replace: true });
  }, [
    searchQuery,
    selectedCategory,
    selectedTemplate,
    selectedDifficulty,
    viewMode,
    sortBy,
    navigate,
  ]);

  // Client-side filtering and sorting of API data
  const filteredAndSortedSeries = useMemo(() => {
    // API already filters by search and category, but we can do additional client-side filtering
    let filtered = series;

    // Additional client-side filtering for template and difficulty
    filtered = filtered.filter((s) => {
      const matchesTemplate =
        selectedTemplate === "all" || s.template === selectedTemplate;
      const matchesDifficulty =
        selectedDifficulty === "all" || s.difficulty === selectedDifficulty;
      return matchesTemplate && matchesDifficulty;
    });

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt);
      }
      if (sortBy === "popular") {
        const aScore = (a.analytics?.totalViews || 0) + (a.analytics?.subscribers || 0) + (a.likes || 0);
        const bScore = (b.analytics?.totalViews || 0) + (b.analytics?.subscribers || 0) + (b.likes || 0);
        return bScore - aScore;
      }
      if (sortBy === "episodes") {
        return (b.episodes?.length || 0) - (a.episodes?.length || 0);
      }
      if (sortBy === "completion") {
        return (b.analytics?.completionRate || 0) - (a.analytics?.completionRate || 0);
      }
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });

    return sorted;
  }, [series, selectedTemplate, selectedDifficulty, sortBy]);

  // Utility functions
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getTemplateIcon = (template) => {
    switch (template) {
      case "educational_course":
        return <BookOpen className="w-4 h-4" />;
      case "research_journey":
        return <TrendingUp className="w-4 h-4" />;
      case "story_arc":
        return <Play className="w-4 h-4" />;
      case "step_by_step":
        return <Target className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    const level = (difficulty || "").toLowerCase();
    const sharedBase =
      "text-[var(--text-color)] border border-[var(--border-color)] transition-colors";

    switch (level) {
      case "beginner":
        return `${sharedBase} bg-[var(--secondary-btn2)] hover:bg-[var(--secondary-btn-hover2)]`;
      case "intermediate":
        return `${sharedBase} bg-[var(--secondary-btn3)] hover:bg-[var(--secondary-btn-hover3)]`;
      case "advanced":
        return `${sharedBase} bg-transparent hover:bg-[var(--secondary-btn-hover3)]`;
      case "expert":
        return `${sharedBase} bg-[var(--secondary-btn)] hover:bg-[var(--secondary-btn-hover3)]`;
      default:
        return `${sharedBase} bg-[var(--secondary-btn2)] hover:bg-[var(--secondary-btn-hover2)]`;
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return <Zap className="w-3 h-3" />;
      case "intermediate":
        return <Award className="w-3 h-3" />;
      case "advanced":
        return <Target className="w-3 h-3" />;
      case "expert":
        return <Shield className="w-3 h-3" />;
      default:
        return <Layers className="w-3 h-3" />;
    }
  };

  const getPublishedEpisodesCount = (episodes) => {
    return episodes.filter((ep) => ep.status === "published").length;
  };

  const getTotalReadTime = (episodes) => {
    return episodes.reduce((total, ep) => {
      // If episodeId is populated, get readingTime from it
      if (ep.episodeId && typeof ep.episodeId === 'object') {
        return total + (ep.episodeId.readingTime || 0);
      }
      // Fallback to readingTime on episode itself
      return total + (ep.readingTime || 0);
    }, 0);
  };

  const getSeriesProgress = (episodes) => {
    const published = getPublishedEpisodesCount(episodes);
    const total = episodes.length;
    return Math.round((published / total) * 100);
  };

  const getAuthorName = (seriesItem) => {
    if (!seriesItem) return "Unknown";

    const directCandidate =
      seriesItem.authorName ||
      seriesItem.authorDisplayName ||
      seriesItem.authorFullName;
    if (directCandidate) return directCandidate;

    const author =
      seriesItem.authorId ||
      seriesItem.author ||
      seriesItem.createdBy ||
      seriesItem.owner;
    if (!author) return "Unknown";

    if (typeof author === "string") {
      return seriesItem.authorDisplayName || author || "Unknown";
    }

    const nestedProfileName =
      author.profile?.displayName ||
      author.profile?.fullName ||
      author.profile?.name;

    const fullName = [author.firstName, author.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      author.displayName ||
      nestedProfileName ||
      author.name ||
      fullName ||
      author.username ||
      seriesItem.authorUsername ||
      "Unknown"
    );
  };


  // SeriesCard component with improved mobile design
  const SeriesCard = ({ series, viewMode }) => {
    const publishedEpisodes = getPublishedEpisodesCount(series.episodes || []);
    // Use totalReadingTime from backend if available, otherwise calculate client-side
    const totalReadTime = series.totalReadingTime || getTotalReadTime(
      (series.episodes || []).filter((ep) => ep.status === "published")
    );
    const progress = getSeriesProgress(series.episodes || []);

    const handleCardClick = () => {
      const identifier = series.slug || series._id || series.id;
      navigate(`/series/${identifier}`);
    };

    if (viewMode === "list") {
      return (
        <Card
          className="cursor-pointer group hover:shadow-lg transition-all duration-300 border border-[var(--border-color)] bg-surface/50 dark:bg-white/5 backdrop-blur-sm"
          onClick={handleCardClick}
        >
          <div className="flex flex-col lg:flex-row">
            {/* Cover Image */}
            <div className="w-full lg:w-80 aspect-video lg:aspect-square relative overflow-hidden rounded-l-2xl bg-[var(--secondary-btn2)] border border-[var(--border-color)]">
              {series.coverImage ? (
                <img
                  src={resolveAssetUrl(series.coverImage)}
                  alt={series.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl opacity-30">📚</div>
                </div>
              )}

              {/* Overlay Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 border border-[var(--border-color)] bg-[var(--secondary-btn)] text-[var(--text-color)] backdrop-blur-sm"
                >
                  {getTemplateIcon(series.template)}
                  <span className="ml-1 capitalize hidden sm:inline">
                    {series.template.replace("_", " ")}
                  </span>
                </Badge>
                <Badge
                  className={`text-xs px-2 py-1 backdrop-blur-sm ${getDifficultyColor(
                    series.difficulty
                  )}`}
                >
                  {getDifficultyIcon(series.difficulty)}
                  <span className="ml-1 capitalize hidden sm:inline">
                    {series.difficulty}
                  </span>
                </Badge>
              </div>

              {/* Premium Badge */}
              {series.visibility === "premium" && (
                <div className="absolute top-3 right-3">
                  <Badge
                    variant="warning"
                    className="text-xs px-2 py-1 border border-[var(--border-color)] bg-[var(--secondary-btn)] text-[var(--text-color)] backdrop-blur-sm"
                  >
                    Premium
                  </Badge>
                </div>
              )}

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm p-2 sm:p-3">
                <div className="flex items-center justify-between text-xs text-white mb-1">
                  <span>
                    {publishedEpisodes}/{series.episodes.length} episodes
                  </span>
                  <span>{progress}% complete</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1">
                  <div
                    className="bg-primary-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-4 lg:p-6">
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {series.tags
                        .slice(0, window.innerWidth < 640 ? 2 : 3)
                        .map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2 py-1 border border-[var(--border-color)]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      {series.tags.length >
                        (window.innerWidth < 640 ? 2 : 3) && (
                          <Badge
                            variant="outline"
                            className="text-xs px-2 py-1 border border-[var(--border-color)]"
                          >
                            +
                            {series.tags.length -
                              (window.innerWidth < 640 ? 2 : 3)}
                          </Badge>
                        )}
                    </div>

                    {/* Title */}
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl line-clamp-2 group-hover:text-primary-500 transition-colors leading-tight">
                      {series.title}
                    </CardTitle>

                    {/* Summary */}
                    <p className="text-sm sm:text-base text-text-secondary line-clamp-3 leading-relaxed">
                      {series.summary}
                    </p>
                  </div>

                  {/* Bookmark Button */}
                  <button className="p-2 bg-white/70 hover:bg-white/80 dark:bg-black/40 dark:hover:bg-black/60 rounded-lg transition-colors flex-shrink-0 border border-[var(--border-color)] cursor-pointer">
                    <Star
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${series.isBookmarked ? "fill-current text-primary-500" : "text-text-secondary"}`}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-4 px-4 sm:px-6 pb-4 sm:pb-6">
                {/* Author and Meta Info */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-text-secondary mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium">{getAuthorName(series)}</span>
                    {series.authorId?.verified && (
                      <Shield className="w-2 h-2 sm:w-3 sm:h-3 text-primary-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{series.category}</span>
                    <span className="sm:hidden">
                      {series.category.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{totalReadTime} min total</span>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">
                        {formatNumber(series.analytics?.totalViews || 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">
                        {formatNumber(series.analytics?.subscribers || 0)}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span className="font-medium">
                        {formatNumber(series.analytics?.likes || 0)}
                      </span>
                    </div>
                    {series.rating !== undefined && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-medium">{series.rating}</span>
                        {series.totalRatings !== undefined && (
                          <span className="opacity-75 hidden lg:inline">
                            ({series.totalRatings})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {series.collaborators?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {series.collaborators.length} collaborator
                        {series.collaborators.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    // Grid View
    return (
      <div
        className="group relative flex flex-col h-full bg-surface border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Image Container */}
        <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-sky-500/10 to-pink-500/10">
          {series.coverImage ? (
            <img
              src={resolveAssetUrl(series.coverImage)}
              alt={series.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-sky-500/20 tracking-widest">SERIES</span>
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

          {/* Floating Badges (Top Left) */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-medium bg-black/40 backdrop-blur-md text-white rounded-full border border-white/10 flex items-center gap-1.5">
                {getTemplateIcon(series.template)}
                <span className="capitalize">{series.template.replace("_", " ")}</span>
              </span>
            </div>
            <span className={`px-2.5 py-1 text-xs font-medium backdrop-blur-md rounded-full border border-white/10 w-fit flex items-center gap-1.5 ${series.difficulty === 'beginner' ? 'bg-green-500/20 text-green-200' :
              series.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-200' :
                'bg-red-500/20 text-red-200'
              }`}>
              {getDifficultyIcon(series.difficulty)}
              <span className="capitalize">{series.difficulty}</span>
            </span>
          </div>

          {/* Premium Badge (Top Right) */}
          {series.visibility === "premium" && (
            <div className="absolute top-4 right-4 z-10">
              <span className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full shadow-lg shadow-orange-500/20 flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                PREMIUM
              </span>
            </div>
          )}

          {/* Progress Bar (Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md p-3 border-t border-white/10">
            <div className="flex items-center justify-between text-[10px] font-medium text-white/90 mb-1.5">
              <span>{publishedEpisodes}/{series.episodes.length} EPISODES</span>
              <span>{progress}% COMPLETE</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-pink-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5 space-y-4">
          <div className="space-y-2 flex-1">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {series.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="text-[10px] font-medium text-text-secondary bg-secondary/50 px-2 py-0.5 rounded border border-border/50">
                  #{tag}
                </span>
              ))}
            </div>

            <h3 className="text-xl font-bold text-text-primary line-clamp-2 group-hover:text-sky-500 transition-colors leading-tight">
              {series.title}
            </h3>
            <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
              {series.summary}
            </p>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-text-secondary">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span className="font-medium max-w-[100px] truncate">{getAuthorName(series)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{totalReadTime}m</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" title="Views">
                <Eye className="w-3.5 h-3.5" />
                <span>{formatNumber(series.analytics?.totalViews || 0)}</span>
              </div>
              {series.collaborators?.length > 0 && (
                <div className="flex items-center gap-1 text-sky-500" title={`${series.collaborators.length} Collaborators`}>
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-medium">{series.collaborators.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 space-y-6 sm:space-y-8">
          <SeriesPageSkeleton viewMode={viewMode} />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full max-w-[1600px] mx-auto space-y-6 sm:space-y-8 lg:space-y-10 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative py-12 sm:py-16 lg:py-20 text-center overflow-hidden rounded-3xl bg-gradient-to-b from-sky-500/5 via-pink-500/5 to-transparent border border-white/10">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
          <div className="relative z-10 space-y-4 px-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-sky-400 via-blue-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
              Discover Series
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Explore curated collections of interconnected content designed to take
              you on a learning journey. From educational courses to story arcs,
              find series that match your interests and skill level.
            </p>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col gap-4 bg-surface/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-[var(--border-color)]">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--light-text-color2)]" />
            <Input
              type="text"
              placeholder="Search series, authors, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search series"
              className="pl-10 sm:pl-11 h-10 sm:h-12 text-sm sm:text-base text-[var(--light-text-color2)] placeholder:text-[var(--light-text-color)]
             focus:outline-none focus:ring-0 focus-visible:ring-0 border border-[var(--border-color)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--light-text-color)] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Actions Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            {/* Sort and Filter Toggle */}
            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                <label
                  htmlFor="sort"
                  className="text-sm text-text-secondary hidden sm:inline"
                >
                  Sort by
                </label>
                <DiscoverSeriesDropDown sortBy={sortBy} setSortBy={setSortBy} />
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex sm:hidden items-center gap-2 px-3 py-2 bg-background rounded-lg border border-[var(--border-color)] text-sm"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* View Mode and Create Button */}
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              {/* View Mode Toggle - Hidden on mobile */}
              <div
                className="hidden sm:flex items-center bg-background rounded-lg p-1 border border-[var(--border-color)]"
                role="tablist"
                aria-label="View mode"
              >
                <button
                  onClick={() => setViewMode("grid")}
                  role="tab"
                  aria-selected={viewMode === "grid"}
                  aria-controls="series-grid"
                  className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${viewMode === "grid"
                    ? "bg-[var(--secondary-btn2)] text-[var(--text-color)] shadow-sm hover:bg-[var(--secondary-btn-hover2)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                    }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  role="tab"
                  aria-selected={viewMode === "list"}
                  aria-controls="series-grid"
                  className={`p-2 cursor-pointer rounded-md transition-all duration-200 ${viewMode === "list"
                    ? "bg-[var(--secondary-btn2)] hover:bg-[var(--secondary-btn-hover2)] text-[var(--text-color)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                    }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <Link to="/create-series">
                <Button className="flex items-center gap-2 h-10 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md cursor-pointer text-sm sm:text-base">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create Series</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters Section - Mobile Collapsible, Desktop Always Visible */}
        <div
          className={`space-y-4 sm:space-y-6 ${showFilters ? "block" : "hidden sm:block"}`}
        >
          {/* Categories */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
              <span className="text-sm sm:text-base font-semibold text-text-primary">
                Categories:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  className={`cursor-pointer transition-all duration-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover)]${selectedCategory === category.id
                    ? " bg-primary-500 text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover)]"
                    : ""
                    }`}
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={selectedCategory === category.id}
                >
                  <span className="hidden sm:inline">{category.name}</span>
                  <span className="sm:hidden">
                    {category.name.replace("Series", "").trim()}
                  </span>
                  <span className="ml-1 opacity-75">({category.count})</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
              <span className="text-sm sm:text-base font-semibold text-text-primary">
                Templates:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <Badge
                  key={template.id}
                  variant={
                    selectedTemplate === template.id ? "default" : "outline"
                  }
                  className={`cursor-pointer transition-all duration-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover2)] ${selectedTemplate === template.id
                    ? " bg-primary-500 text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover2)]"
                    : ""
                    }`}
                  onClick={() => setSelectedTemplate(template.id)}
                  aria-pressed={selectedTemplate === template.id}
                >
                  <span className="hidden sm:inline">{template.name}</span>
                  <span className="sm:hidden">{template.name.split(" ")[0]}</span>
                  <span className="ml-1 opacity-75">({template.count})</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Difficulty Levels */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
              <span className="text-sm sm:text-base font-semibold text-text-primary">
                Difficulty:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((difficulty) => (
                <Badge
                  key={difficulty.id}
                  variant={
                    selectedDifficulty === difficulty.id ? "default" : "outline"
                  }
                  className={`cursor-pointer transition-all duration-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover2)]${selectedDifficulty === difficulty.id
                    ? " bg-primary-500 hover:bg-[var(--secondary-btn-hover2)]"
                    : ""
                    }`}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  aria-pressed={selectedDifficulty === difficulty.id}
                >
                  {difficulty.name}
                  <span className="ml-1 opacity-75">({difficulty.count})</span>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-text-primary mb-2">
              Error Loading Series
            </h3>
            <p className="text-sm sm:text-base text-text-secondary mb-4 sm:mb-6 max-w-md mx-auto px-4">
              {error}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Results Summary */}
        {!error && (
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 sm:py-4 border-b border-[var(--border-color)]"
            aria-live="polite"
          >
            <div className="text-sm sm:text-base text-text-secondary">
              Showing{" "}
              <span className="font-semibold text-text-primary">
                {filteredAndSortedSeries.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-text-primary">
                {series.length}
              </span>{" "}
              series
            </div>
            <div className="text-xs sm:text-sm text-text-secondary">
              Updated {new Date().toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Series Grid */}
        {!isLoading && !error && filteredAndSortedSeries.length > 0 && (
          <div
            className={`grid gap-6 sm:gap-8 ${viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              : "grid-cols-1 max-w-5xl mx-auto"
              }`}
          >
            {filteredAndSortedSeries.map((series) => (
              <SeriesCard
                key={series._id || series.id}
                series={series}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredAndSortedSeries.length === 0 && (
          <div className="text-center py-12 sm:py-16 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
              <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
              No series found
            </h3>
            <p className="text-sm sm:text-base text-text-secondary mb-4 sm:mb-6 max-w-md mx-auto">
              We couldn't find any series matching your search criteria. Try
              adjusting your filters or search terms.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedTemplate("all");
                setSelectedDifficulty("all");
                setSortBy("recent");
                setShowFilters(false);
              }}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default SeriesPage;
