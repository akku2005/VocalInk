import { useState, useEffect } from "react";
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
} from "lucide-react";

const SearchPage = () => {
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

  // Handle search when component mounts or search params change
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch();
    }
  }, [searchParams]);

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

  // Mock search results
  const mockResults = [
    {
      id: 1,
      title: "The Future of AI in Content Creation",
      excerpt:
        "Discover how artificial intelligence is revolutionizing the way we create, edit, and distribute content across various platforms. From automated writing assistants to intelligent content optimization...",
      author: "Sarah Johnson",
      authorAvatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
      publishedAt: "2024-01-15",
      readTime: 8,
      tags: ["AI", "Technology", "Content Creation"],
      mood: "technical",
      language: "en",
      likes: 124,
      comments: 23,
      views: 1542,
      relevance: 95,
    },
    {
      id: 2,
      title: "Building a Successful Blog Series: A Complete Guide",
      excerpt:
        "Learn the strategies and techniques needed to create engaging blog series that keep readers coming back for more. This comprehensive guide covers everything from planning to execution...",
      author: "Michael Chen",
      authorAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      publishedAt: "2024-01-12",
      readTime: 12,
      tags: ["Blogging", "Content Strategy", "Writing"],
      mood: "educational",
      language: "en",
      likes: 89,
      comments: 15,
      views: 892,
      relevance: 88,
    },
    {
      id: 3,
      title: "Voice-to-Text: The Next Big Thing in Writing",
      excerpt:
        "Explore how speech recognition technology is changing the landscape of content creation and making writing more accessible to everyone. Discover the latest tools and techniques...",
      author: "Emily Rodriguez",
      authorAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
      publishedAt: "2024-01-10",
      readTime: 6,
      tags: ["Voice Technology", "Accessibility", "Innovation"],
      mood: "technical",
      language: "en",
      likes: 156,
      comments: 31,
      views: 2341,
      relevance: 92,
    },
    {
      id: 4,
      title: "Gamification in Learning: Making Education Fun",
      excerpt:
        "How game mechanics and rewards systems are transforming the way we learn and retain information. This post explores the psychology behind gamification and its applications...",
      author: "David Kim",
      authorAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      publishedAt: "2024-01-08",
      readTime: 10,
      tags: ["Education", "Gamification", "Learning"],
      mood: "educational",
      language: "en",
      likes: 203,
      comments: 42,
      views: 3456,
      relevance: 85,
    },
    {
      id: 5,
      title: "The Psychology of Social Media Engagement",
      excerpt:
        "Understanding what makes content go viral and how to create posts that truly resonate with your audience. Deep dive into the psychological principles that drive engagement...",
      author: "Lisa Thompson",
      authorAvatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face",
      publishedAt: "2024-01-05",
      readTime: 9,
      tags: ["Psychology", "Social Media", "Marketing"],
      mood: "thoughtful",
      language: "en",
      likes: 178,
      comments: 28,
      views: 2890,
      relevance: 90,
    },
    {
      id: 6,
      title: "Sustainable Living: Small Changes, Big Impact",
      excerpt:
        "Practical tips and strategies for reducing your environmental footprint through everyday choices and habits. Learn how small changes can lead to significant positive impact...",
      author: "Alex Green",
      authorAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
      publishedAt: "2024-01-03",
      readTime: 7,
      tags: ["Sustainability", "Lifestyle", "Environment"],
      mood: "inspirational",
      language: "en",
      likes: 145,
      comments: 19,
      views: 1876,
      relevance: 87,
    },
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Filter results based on search query and filters
      let filtered = mockResults.filter((result) => {
        const matchesQuery =
          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          );

        const matchesMood = !filters.mood || result.mood === filters.mood;
        const matchesLanguage =
          !filters.language || result.language === filters.language;
        const matchesReadTime =
          !filters.readTime ||
          (filters.readTime === "0-5" && result.readTime <= 5) ||
          (filters.readTime === "5-10" &&
            result.readTime > 5 &&
            result.readTime <= 10) ||
          (filters.readTime === "10-15" &&
            result.readTime > 10 &&
            result.readTime <= 15) ||
          (filters.readTime === "15+" && result.readTime > 15);

        return (
          matchesQuery && matchesMood && matchesLanguage && matchesReadTime
        );
      });

      // Sort results
      switch (filters.sortBy) {
        case "newest":
          filtered.sort(
            (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
          );
          break;
        case "oldest":
          filtered.sort(
            (a, b) => new Date(a.publishedAt) - new Date(b.publishedAt)
          );
          break;
        case "popular":
          filtered.sort((a, b) => b.likes - a.likes);
          break;
        case "trending":
          filtered.sort((a, b) => b.views - a.views);
          break;
        case "readTime":
          filtered.sort((a, b) => a.readTime - b.readTime);
          break;
        default:
          filtered.sort((a, b) => b.relevance - a.relevance);
      }

      setSearchResults(filtered);
    } catch (error) {
      console.error("Search error:", error);
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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-text-primary">
          Search VocalInk
        </h1>
        <p className="text-lg text-text-secondary">
          Discover amazing content from our community
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="p-6 hover:shadow-none">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative hover:shadow-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary " />
              <Input
                type="text"
                placeholder="Search for posts, authors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 h-12 text-lg glassmorphism backdrop-blur-sm "
              />
              <Button
                type="submit"
                className="absolute bg-[var(--secondary-btn2)] text-[var(--text-color)]  hover:bg-[var(--secondary-btn-hover2)] cursor-pointer right-2 top-1/2 transform -translate-y-1/2 h-8"
                loading={loading}
              >
                Search
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
                    className="px-3 py-1 text-sm bg-secondary-100 text-text-secondary rounded-full hover:bg-secondary-200 transition-colors cursor-pointer"
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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

          <div className="flex items-center bg-background rounded-lg p-1 border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all duration-200 ${
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            <Card>
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
                        className={`p-2 rounded-lg border-2 transition-all duration-200 text-left ${
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
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
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

        {/* Results */}
        <div className={`${showFilters ? "lg:col-span-3" : "lg:col-span-4"}`}>
          {searchResults.length > 0 ? (
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {searchResults.map((result) => (
                <Card
                  key={result.id}
                  className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={result.authorAvatar}
                            alt={result.author}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <div className="font-medium text-text-primary">
                              {result.author}
                            </div>
                            <div className="text-sm text-text-secondary">
                              {new Date(
                                result.publishedAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge
                          className={
                            moods.find((m) => m.id === result.mood)?.color
                          }
                        >
                          {moods.find((m) => m.id === result.mood)?.icon}{" "}
                          {moods.find((m) => m.id === result.mood)?.name}
                        </Badge>
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className="font-semibold text-text-primary text-lg mb-2 leading-tight">
                          {result.title}
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed mb-3">
                          {result.excerpt}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {result.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {result.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{result.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-text-secondary">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {result.readTime} min read
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {result.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {result.comments}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {result.views.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchQuery && !loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  No results found
                </h3>
                <p className="text-text-secondary mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Trending Topics */}
      {!searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Trending Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {trendingTopics.map((topic, index) => (
                <div
                  key={index}
                  className="p-4 border border-border rounded-lg hover:bg-surface transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">
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
                    className="text-sm text-primary-500 hover:text-primary-600"
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
