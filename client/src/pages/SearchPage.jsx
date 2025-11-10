import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import blogService from "../services/blogService";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Heart,
  MessageCircle,
  BookOpen,
  Clock,
  User,
  Tag,
  Sparkles,
  TrendingUp,
  Star,
  MapPin,
  Calendar,
  Zap,
  Palette,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [filters, setFilters] = useState({
    mood: "",
    author: "",
    tags: [],
    dateRange: "",
    readTime: "",
    sortBy: "relevance",
    language: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Handle search when component mounts or search params change
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch();
    }
  }, [searchParams]);

  // Force grid view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setViewMode("grid");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const moods = [
    {
      id: "motivational",
      name: "Motivational",
      icon: "🚀",
      color: "bg-orange-100 text-orange-800",
    },
    {
      id: "thoughtful",
      name: "Thoughtful",
      icon: "🤔",
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "humorous",
      name: "Humorous",
      icon: "😄",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "educational",
      name: "Educational",
      icon: "📚",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "inspirational",
      name: "Inspirational",
      icon: "✨",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "technical",
      name: "Technical",
      icon: "⚙️",
      color: "bg-gray-100 text-gray-800",
    },
  ];

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "popular", label: "Most Popular" },
    { value: "trending", label: "Trending" },
    { value: "readTime", label: "Read Time" },
  ];

  const readTimeOptions = [
    { value: "", label: "Any length" },
    { value: "0-5", label: "0-5 minutes" },
    { value: "5-10", label: "5-10 minutes" },
    { value: "10-15", label: "10-15 minutes" },
    { value: "15+", label: "15+ minutes" },
  ];

  const dateRangeOptions = [
    { value: "", label: "Any time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This week" },
    { value: "month", label: "This month" },
    { value: "year", label: "This year" },
  ];

  const languages = [
    { code: "", name: "All languages" },
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
  ];


  const popularTags = [
    "Technology",
    "AI",
    "Programming",
    "Design",
    "Business",
    "Marketing",
    "Health",
    "Fitness",
    "Travel",
    "Food",
    "Lifestyle",
    "Education",
    "Science",
    "Environment",
    "Politics",
    "Entertainment",
    "Sports",
  ];

  const trendingTopics = [
    { topic: "AI Content Creation", trend: "+45%" },
    { topic: "Voice Technology", trend: "+32%" },
    { topic: "Sustainable Living", trend: "+28%" },
    { topic: "Remote Work", trend: "+23%" },
    { topic: "Mental Health", trend: "+19%" },
  ];

  useEffect(() => {
    // Simulate search suggestions
    if (searchQuery.length > 2) {
      const suggestions = [
        `${searchQuery} tips`,
        `${searchQuery} guide`,
        `${searchQuery} examples`,
        `${searchQuery} best practices`,
        `${searchQuery} tutorial`,
      ];
      setSuggestions(suggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Fetch blogs from API
      const blogs = await blogService.getBlogs({ 
        status: 'published',
        limit: 50 
      });

      // Filter results based on search query and filters
      let filtered = (blogs || []).filter((blog) => {
        const matchesQuery =
          blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blog.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blog.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (blog.tags && Array.isArray(blog.tags) && blog.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          ));

        const matchesReadTime =
          !filters.readTime ||
          (filters.readTime === "0-5" && (blog.readingTime || 0) <= 5) ||
          (filters.readTime === "5-10" &&
            (blog.readingTime || 0) > 5 &&
            (blog.readingTime || 0) <= 10) ||
          (filters.readTime === "10-15" &&
            (blog.readingTime || 0) > 10 &&
            (blog.readingTime || 0) <= 15) ||
          (filters.readTime === "15+" && (blog.readingTime || 0) > 15);

        return matchesQuery && matchesReadTime;
      });

      // Sort results
      switch (filters.sortBy) {
        case "newest":
          filtered.sort(
            (a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt)
          );
          break;
        case "oldest":
          filtered.sort(
            (a, b) => new Date(a.publishedAt || a.createdAt) - new Date(b.publishedAt || b.createdAt)
          );
          break;
        case "popular":
          filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          break;
        case "trending":
          filtered.sort((a, b) => (b.bookmarks || 0) - (a.bookmarks || 0));
          break;
        case "readTime":
          filtered.sort((a, b) => (a.readingTime || 0) - (b.readingTime || 0));
          break;
        default:
          filtered.sort(
            (a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt)
          );
      }

      setSearchResults(filtered);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const clearFilters = () => {
    setFilters({
      mood: "",
      author: "",
      tags: [],
      dateRange: "",
      readTime: "",
      sortBy: "relevance",
      language: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== ""
  );

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-2 sm:space-y-4 pt-2 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary">
          Search VocalInk
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-text-secondary max-w-2xl mx-auto px-2 sm:px-0">
          Discover amazing content from our community
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-text-secondary" />
              <Input
                type="text"
                placeholder="Search for posts, authors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-11 pr-20 sm:pr-24 h-10 sm:h-12 text-sm sm:text-base lg:text-lg glassmorphism backdrop-blur-sm"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 sm:h-9 px-3 sm:px-4 text-sm sm:text-base bg-[var(--secondary-btn2)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover2)]"
                loading={loading}
              >
                <span className="hidden sm:inline">Search</span>
                <span className="sm:hidden">Go</span>
              </Button>
            </div>

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setSearchParams({ q: suggestion });
                    }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-secondary-100 text-text-secondary rounded-full hover:bg-secondary-200 transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Filters and Results Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Mobile Filter Toggle */}
        <div className="flex items-center justify-between sm:hidden">
          <Button
            variant="outline"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2 border-[var(--border-color)] text-sm px-3 py-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="default" className="ml-1 text-xs">
                {
                  Object.values(filters).filter((v) =>
                    Array.isArray(v) ? v.length > 0 : v !== ""
                  ).length
                }
              </Badge>
            )}
            {mobileFiltersOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-error hover:text-error cursor-pointer text-sm px-3 py-2"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Desktop Filters and Actions */}
        <div className="hidden sm:flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border-[var(--border-color)]"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="default" className="ml-1">
                  {
                    Object.values(filters).filter((v) =>
                      Array.isArray(v) ? v.length > 0 : v !== ""
                    ).length
                  }
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-error hover:text-error cursor-pointer"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-text-secondary">
              {searchResults.length > 0 &&
                `${searchResults.length} results found`}
            </div>

            {/* Desktop View Mode Toggle */}
            <div className="flex items-center bg-background rounded-lg p-1 border border-[var(--border-color)]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${
                  viewMode === "list"
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View Mode Toggle */}
        <div className="flex items-center justify-between sm:hidden">
          <div className="text-sm text-text-secondary">
            {searchResults.length > 0 &&
              `${searchResults.length} results found`}
          </div>
          <div className="flex items-center bg-background rounded-lg p-1 border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${
                viewMode === "list"
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {mobileFiltersOpen && (
        <div className="sm:hidden">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary-500" />
                  Filters
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Mood Filter */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Mood
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          mood: prev.mood === mood.id ? "" : mood.id,
                        }))
                      }
                      className={`p-2 rounded-lg border-2 transition-all duration-200 text-left cursor-pointer ${
                        filters.mood === mood.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-border hover:border-primary-200"
                      }`}
                    >
                      <div className="text-sm mb-1">{mood.icon}</div>
                      <div className="text-xs font-medium text-text-primary">
                        {mood.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Sort by
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-border rounded-lg bg-background text-text-primary text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Read Time */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Read time
                </label>
                <select
                  value={filters.readTime}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      readTime: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-border rounded-lg bg-background text-text-primary text-sm"
                >
                  {readTimeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Language
                </label>
                <select
                  value={filters.language}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-border rounded-lg bg-background text-text-primary text-sm"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Popular Tags */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Popular tags
                </label>
                <div className="flex flex-wrap gap-1">
                  {popularTags.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        const newTags = filters.tags.includes(tag)
                          ? filters.tags.filter((t) => t !== tag)
                          : [...filters.tags, tag];
                        setFilters((prev) => ({ ...prev, tags: newTags }));
                      }}
                      className={`px-2 py-1 text-xs rounded-full transition-colors cursor-pointer ${
                        filters.tags.includes(tag)
                          ? "bg-primary-500 text-white"
                          : "bg-secondary-100 text-text-secondary hover:bg-secondary-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Desktop Filters Sidebar */}
      {showFilters && (
        <div className="hidden lg:block lg:col-span-1">
          <Card className="sidebar-scroll max-h-[calc(100vh-200px)] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-500" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Mood Filter */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Mood
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          mood: prev.mood === mood.id ? "" : mood.id,
                        }))
                      }
                      className={`p-2 rounded-lg border-2 transition-all duration-200 text-left cursor-pointer ${
                        filters.mood === mood.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-border hover:border-primary-200"
                      }`}
                    >
                      <div className="text-sm mb-1">{mood.icon}</div>
                      <div className="text-xs font-medium text-text-primary">
                        {mood.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Sort by
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Read Time */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Read time
                </label>
                <select
                  value={filters.readTime}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      readTime: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                >
                  {readTimeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Language
                </label>
                <select
                  value={filters.language}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Popular Tags */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Popular tags
                </label>
                <div className="flex flex-wrap gap-1">
                  {popularTags.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        const newTags = filters.tags.includes(tag)
                          ? filters.tags.filter((t) => t !== tag)
                          : [...filters.tags, tag];
                        setFilters((prev) => ({ ...prev, tags: newTags }));
                      }}
                      className={`px-2 py-1 text-xs rounded-full transition-colors cursor-pointer ${
                        filters.tags.includes(tag)
                          ? "bg-primary-500 text-white"
                          : "bg-secondary-100 text-text-secondary hover:bg-secondary-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Grid */}
      <div className={`${showFilters ? "hidden lg:block lg:col-span-3" : ""}`}>
        {searchResults.length > 0 ? (
          <div
            className={`grid gap-4 sm:gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                : "grid-cols-1 max-w-4xl mx-auto"
            }`}
          >
            {searchResults.map((result) => (
              <Card
                key={result._id || result.id}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/article/${result._id || result.id}`)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                          {result.author?.displayName?.[0] || result.author?.username?.[0] || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-text-primary text-sm sm:text-base truncate">
                            {typeof result.author === 'string' ? result.author : result.author?.displayName || result.author?.username || 'Anonymous'}
                          </div>
                          <div className="text-xs sm:text-sm text-text-secondary">
                            {new Date(
                              result.publishedAt
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={`text-xs sm:text-sm ${
                          moods.find((m) => m.id === result.mood)?.color
                        }`}
                      >
                        <span className="hidden sm:inline">
                          {moods.find((m) => m.id === result.mood)?.icon}{" "}
                        </span>
                        {moods.find((m) => m.id === result.mood)?.name}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-semibold text-text-primary text-base sm:text-lg mb-2 leading-tight line-clamp-2">
                        {result.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-3 line-clamp-3">
                        {result.summary || result.excerpt || result.content?.substring(0, 150) || 'No description available'}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {(result.tags || []).slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs px-2 py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {(result.tags || []).length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          +{(result.tags || []).length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-text-secondary">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {result.readingTime || 5} min read
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                          {result.likes || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchQuery && !loading ? (
          <Card>
            <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-text-secondary mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2">
                No results found
              </h3>
              <p className="text-sm sm:text-base text-text-secondary mb-4 max-w-md mx-auto">
                Try adjusting your search terms or filters
              </p>
              <Button variant="outline" onClick={clearFilters} className="text-sm">
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Trending Topics */}
      {!searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
              Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              {trendingTopics.map((topic, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 border border-border rounded-lg hover:bg-surface transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary text-sm sm:text-base">
                      {topic.topic}
                    </span>
                    <Badge variant="success" className="text-xs">
                      {topic.trend}
                    </Badge>
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery(topic.topic);
                      setSearchParams({ q: topic.topic });
                    }}
                    className="text-xs sm:text-sm text-primary-500 hover:text-primary-600 cursor-pointer"
                  >
                    Search this topic →
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchPage;
