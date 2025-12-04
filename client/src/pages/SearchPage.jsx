import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import BlogCard from "../components/blog/BlogCard";
import BlogCardSkeleton from "../components/skeletons/BlogCardSkeleton";
import blogService from "../services/blogService";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Compass,
} from "lucide-react";

// Helper function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text;
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [allBlogs, setAllBlogs] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list");
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

  // Sync query param with local state
  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchQuery(query);
  }, [searchParams]);

  // Fetch all blogs once
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const blogs = await blogService.getBlogs({ status: "published", limit: 100 });
        setAllBlogs(Array.isArray(blogs) ? blogs : []);
      } catch (error) {
        console.error("Search fetch error:", error);
        setAllBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

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

  const recentSearches = [
    "AI storytelling",
    "Voice cloning ethics",
    "Productivity rituals",
    "Playwright tutorials",
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

  const normalize = (text) => (text || "").toString().toLowerCase();

  const getAuthorName = (author) => {
    if (!author) return "";
    if (typeof author === "string") return author;
    return (
      author.displayName ||
      `${author.firstName || ""} ${author.lastName || ""}`.trim() ||
      author.username ||
      author.email?.split("@")[0] ||
      ""
    );
  };

  useEffect(() => {
    const term = normalize(searchQuery.trim());
    const tokens = term ? term.split(/\s+/).filter(Boolean) : [];
    const selectedTags = filters.tags.map((tag) => normalize(tag));

    const matchesDateRange = (blog) => {
      if (!filters.dateRange) return true;
      const published = new Date(blog.publishedAt || blog.createdAt || Date.now());
      const now = Date.now();
      const daysMap = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 };
      const days = daysMap[filters.dateRange];
      if (!days) return true;
      const diffDays = (now - published.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= days;
    };

    const filtered = allBlogs.filter((blog) => {
      const title = normalize(blog.title);
      const summary = normalize(stripHtml(blog.summary));
      const content = normalize(stripHtml(blog.content || blog.excerpt));
      const tags = Array.isArray(blog.tags) ? blog.tags.map((t) => normalize(t)) : [];
      const authorName = normalize(getAuthorName(blog.author));
      const combined = [title, summary, content, tags.join(" "), authorName].join(" ");

      const matchesQuery =
        tokens.length === 0 ||
        tokens.some((token) => combined.includes(token));

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => tags.includes(tag));

      const readTime = blog.readingTime || blog.readTime || 0;
      const matchesReadTime =
        !filters.readTime ||
        (filters.readTime === "0-5" && readTime <= 5) ||
        (filters.readTime === "5-10" && readTime > 5 && readTime <= 10) ||
        (filters.readTime === "10-15" && readTime > 10 && readTime <= 15) ||
        (filters.readTime === "15+" && readTime > 15);

      const matchesLanguage =
        !filters.language ||
        normalize(blog.language) === normalize(filters.language);

      const matchesAuthor =
        !filters.author || authorName.includes(normalize(filters.author));

      const matchesMood =
        !filters.mood || normalize(blog.mood).includes(normalize(filters.mood));

      return (
        matchesQuery &&
        matchesTags &&
        matchesReadTime &&
        matchesLanguage &&
        matchesAuthor &&
        matchesMood &&
        matchesDateRange(blog)
      );
    });

    const scored = filtered.map((blog) => {
      if (!tokens.length) return { blog, score: 0 };
      const title = normalize(blog.title);
      const summary = normalize(stripHtml(blog.summary));
      const content = normalize(stripHtml(blog.content || blog.excerpt));
      const tags = Array.isArray(blog.tags) ? blog.tags.map((t) => normalize(t)) : [];

      let score = 0;
      tokens.forEach((token) => {
        if (title.includes(token)) score += 4;
        if (summary.includes(token)) score += 3;
        if (content.includes(token)) score += 1;
        if (tags.some((t) => t.includes(token))) score += 2;
      });
      return { blog, score };
    });

    const sorted = scored
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "newest":
            return (
              new Date(b.blog.publishedAt || b.blog.createdAt) -
              new Date(a.blog.publishedAt || a.blog.createdAt)
            );
          case "oldest":
            return (
              new Date(a.blog.publishedAt || a.blog.createdAt) -
              new Date(b.blog.publishedAt || b.blog.createdAt)
            );
          case "popular":
            return (b.blog.likes || 0) - (a.blog.likes || 0);
          case "trending":
            return (b.blog.bookmarks || 0) - (a.blog.bookmarks || 0);
          case "readTime":
            return (a.blog.readingTime || 0) - (b.blog.readingTime || 0);
          default:
            if (tokens.length && a.score !== b.score) return b.score - a.score;
            return (
              new Date(b.blog.publishedAt || b.blog.createdAt) -
              new Date(a.blog.publishedAt || a.blog.createdAt)
            );
        }
      })
      .map((item) => item.blog);

    setSearchResults(sorted);
  }, [allBlogs, filters, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setSearchQuery(trimmed);
    setSearchParams(trimmed ? { q: trimmed } : {});
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

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === "sortBy") return count;
      if (Array.isArray(value)) {
        return value.length ? count + 1 : count;
      }
      return value ? count + 1 : count;
    }, 0);
  }, [filters]);

  

  const quickStats = [
    { label: "Matches", value: searchResults.length || 0 },
    { label: "Active Filters", value: activeFilterCount },
    { label: "Suggestions", value: suggestions.length },
  ];

  const handleRecentSearch = (value) => {
    setSearchQuery(value);
    setSearchParams({ q: value });
  };

  const handleTagClick = (tag) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
      <Helmet>
        <title>{searchQuery ? `${searchQuery} - VocalInk Search` : "VocalInk Search"}</title>
        <meta name="description" content={`Search for articles, authors, and more on VocalInk. Find exactly what you're looking for.`} />
        <meta property="og:title" content={searchQuery ? `${searchQuery} - VocalInk Search` : "VocalInk Search"} />
        <meta property="og:description" content={`Search for articles, authors, and more on VocalInk. Find exactly what you're looking for.`} />
        <meta property="og:url" content={`https://vocalink.com/search${searchQuery ? `?q=${searchQuery}`: ""}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={searchQuery ? `${searchQuery} - VocalInk Search` : "VocalInk Search"} />
        <meta name="twitter:description" content={`Search for articles, authors, and more on VocalInk. Find exactly what you're looking for.`} />
      </Helmet>
      <section className="relative rounded-3xl border border-border bg-surface/50 backdrop-blur-sm shadow-lg mb-6">
        <div className="p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 space-y-3">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-text-secondary">
                <Compass className="w-4 h-4" />
                Discover faster
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Search the entire VocalInk library
              </h1>
              <p className="text-sm sm:text-base text-text-secondary max-w-2xl">
                Find essays, guides, and curated collections from our writers. Apply filters, explore moods, and save your favorite discoveries.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 min-w-[220px]">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-surface/80 p-3 text-center"
                >
                  <div className="text-2xl font-semibold text-text-primary">{stat.value}</div>
                  <p className="text-xs uppercase tracking-wide text-text-secondary">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <Input
                  type="text"
                  placeholder="Search articles, authors, moods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 pr-4"
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-6"
                loading={loading}
              >
                Start searching
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="uppercase tracking-wide text-[10px] text-text-secondary">
                Recent
              </span>
              {recentSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleRecentSearch(item)}
                  className="px-3 py-1 rounded-full bg-surface border border-border text-text-primary hover:bg-surface/80 transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>

            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleRecentSearch(suggestion)}
                    className="px-3 py-1 rounded-full bg-surface/50 border border-border text-text-secondary hover:bg-surface transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </section>



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
                className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${viewMode === "grid"
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
                  }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${viewMode === "list"
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
              className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${viewMode === "grid"
                ? "bg-primary-500 text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${viewMode === "list"
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
                      onClick={() => handleTagClick(tag)}
                      className={`px-2 py-1 text-xs rounded-full transition-colors cursor-pointer ${filters.tags.includes(tag)
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
                      onClick={() => handleTagClick(tag)}
                      className={`px-2 py-1 text-xs rounded-full transition-colors cursor-pointer ${filters.tags.includes(tag)
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
        {searchResults.length > 0 || loading ? (
          <div
            className={`grid gap-6 ${viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 w-full"
              }`}
          >
            {loading
              ? Array.from({ length: viewMode === "grid" ? 6 : 3 }).map((_, idx) => (
                <BlogCardSkeleton key={`search-skeleton-${idx}`} viewMode={viewMode} />
              ))
              : searchResults.map((result) => (
                <BlogCard
                  key={result._id || result.id}
                  blog={result}
                  viewMode={viewMode}
                />
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
        ) : (
          !loading && (
            <Card>
              <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-text-secondary mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2">
                  Start exploring
                </h3>
                <p className="text-sm sm:text-base text-text-secondary mb-4 max-w-md mx-auto">
                  Use the search box or filters to browse the full VocalInk library.
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>


    </div>
  );
};

export default SearchPage;
