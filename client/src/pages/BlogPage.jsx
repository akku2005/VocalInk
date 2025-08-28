import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import BlogCard from "../components/blog/BlogCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import DropDown from "../components/ui/DropDown";
import BlogCardSkeleton from "../components/skeletons/BlogCardSkeleton";
import {
  Search,
  Filter,
  Plus,
  Grid3X3,
  List,
  X,
  ArrowUpDown,
} from "lucide-react";

const BlogPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    params.get("cat") || "all"
  );
  const [viewMode, setViewMode] = useState(params.get("view") || "grid");
  const [sortBy, setSortBy] = useState(params.get("sort") || "recent");
  const [isLoading, setIsLoading] = useState(false);

  // Sample blog data
  const sampleBlogs = [
    {
      id: "1",
      title: "The Future of AI in Content Creation",
      excerpt:
        "Discover how artificial intelligence is revolutionizing the way we create, edit, and distribute content across various platforms.",
      author: "Sarah Johnson",
      publishedAt: "2024-01-15",
      readTime: 8,
      tags: ["AI", "Technology", "Content Creation"],
      likes: 124,
      comments: 23,
      isLiked: false,
      isBookmarked: false,
      bookmarks: 15,
    },
    {
      id: "2",
      title: "Building a Successful Blog Series: A Complete Guide",
      excerpt:
        "Learn the strategies and techniques needed to create engaging blog series that keep readers coming back for more.",
      author: "Michael Chen",
      publishedAt: "2024-01-12",
      readTime: 12,
      tags: ["Blogging", "Content Strategy", "Writing"],
      likes: 89,
      comments: 15,
      isLiked: true,
      isBookmarked: true,
      bookmarks: 23,
    },
    {
      id: "3",
      title: "Voice-to-Text: The Next Big Thing in Writing",
      excerpt:
        "Explore how speech recognition technology is changing the landscape of content creation and making writing more accessible.",
      author: "Emily Rodriguez",
      publishedAt: "2024-01-10",
      readTime: 6,
      tags: ["Voice Technology", "Accessibility", "Innovation"],
      likes: 156,
      comments: 31,
      isLiked: false,
      isBookmarked: false,
      bookmarks: 18,
    },
    {
      id: "4",
      title: "Gamification in Learning: Making Education Fun",
      excerpt:
        "How game mechanics and rewards systems are transforming the way we learn and retain information.",
      author: "David Kim",
      publishedAt: "2024-01-08",
      readTime: 10,
      tags: ["Education", "Gamification", "Learning"],
      likes: 203,
      comments: 42,
      isLiked: false,
      isBookmarked: false,
      bookmarks: 31,
    },
    {
      id: "5",
      title: "The Psychology of Social Media Engagement",
      excerpt:
        "Understanding what makes content go viral and how to create posts that truly resonate with your audience.",
      author: "Lisa Thompson",
      publishedAt: "2024-01-05",
      readTime: 9,
      tags: ["Psychology", "Social Media", "Marketing"],
      likes: 178,
      comments: 28,
      isLiked: false,
      isBookmarked: true,
      bookmarks: 27,
    },
    {
      id: "6",
      title: "Sustainable Living: Small Changes, Big Impact",
      excerpt:
        "Practical tips and strategies for reducing your environmental footprint through everyday choices and habits.",
      author: "Alex Green",
      publishedAt: "2024-01-03",
      readTime: 7,
      tags: ["Sustainability", "Lifestyle", "Environment"],
      likes: 145,
      comments: 19,
      isLiked: false,
      isBookmarked: false,
      bookmarks: 12,
    },
  ];

  const categories = [
    { id: "all", name: "All Posts", count: sampleBlogs.length },
    { id: "technology", name: "Technology", count: 2 },
    { id: "lifestyle", name: "Lifestyle", count: 1 },
    { id: "education", name: "Education", count: 1 },
    { id: "marketing", name: "Marketing", count: 1 },
    { id: "sustainability", name: "Sustainability", count: 1 },
  ];

  // URL sync
  useEffect(() => {
    const q = searchQuery ? `q=${encodeURIComponent(searchQuery)}` : "";
    const cat =
      selectedCategory && selectedCategory !== "all"
        ? `&cat=${encodeURIComponent(selectedCategory)}`
        : "";
    const view =
      viewMode !== "grid" ? `&view=${encodeURIComponent(viewMode)}` : "";
    const sort =
      sortBy !== "recent" ? `&sort=${encodeURIComponent(sortBy)}` : "";
    const query = [q, cat, view, sort].filter(Boolean).join("");
    const url = query ? `/blogs?${query.replace(/^&/, "")}` : "/blogs";
    navigate(url, { replace: true });
  }, [searchQuery, selectedCategory, viewMode, sortBy, navigate]);

  // Debounced search
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Simulated loading when filters/search change
  useEffect(() => {
    setIsLoading(true);
    const id = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(id);
  }, [debouncedQuery, selectedCategory, sortBy, viewMode]);

  const filteredAndSortedBlogs = useMemo(() => {
    const filtered = sampleBlogs.filter((blog) => {
      const matchesSearch =
        blog.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        blog.tags.some((tag) =>
          tag.toLowerCase().includes(debouncedQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" ||
        blog.tags.some((tag) => tag.toLowerCase() === selectedCategory);

      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      }
      if (sortBy === "popular") {
        return (
          b.likes +
          b.comments +
          (b.bookmarks || 0) -
          (a.likes + a.comments + (a.bookmarks || 0))
        );
      }
      if (sortBy === "readtime") {
        return a.readTime - b.readTime;
      }
      return 0;
    });

    return sorted;
  }, [sampleBlogs, debouncedQuery, selectedCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent pb-2">
          Blog Posts
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Discover insights, stories, and knowledge from our community of
          writers and creators
        </p>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-surface/50 backdrop-blur-sm rounded-xl p-6 border border-[var(--border-color)]">
        <div className="flex-1 relative max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--light-text-color2)]" />
          <Input
            type="text"
            placeholder="Search posts, authors, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search posts"
            className="pl-11 h-12 text-base text-[var(--light-text-color2)] placeholder:text-[var(--light-text-color)]
             focus:outline-none focus:ring-0 focus-visible:ring-0   border border-[var(--border-color)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--light-text-color)]  cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-primary-500" />
            <label htmlFor="sort" className="text-sm text-text-secondary">
              Sort by
            </label>
            <DropDown sortBy={sortBy} setSortBy={setSortBy} />
          </div>

          {/* View Mode Toggle */}
          <div
            className="flex items-center bg-background rounded-lg p-1 border border-[var(--border-color)]"
            role="tablist"
            aria-label="View mode"
          >
            <button
              onClick={() => setViewMode("grid")}
              role="tab"
              aria-selected={viewMode === "grid"}
              aria-controls="blog-grid"
              className={`p-2 rounded-md transition-all duration-200 cursor-pointer ${
                viewMode === "grid"
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
              aria-controls="blog-grid"
              className={`p-2 cursor-pointer rounded-md transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-[var(--secondary-btn2)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover2)]"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface "
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Link to="/create-blog">
            <Button className="flex items-center gap-2 h-12 px-6 bg-indigo-500 hover:bg-indigo-600 cursor-pointer">
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-4 z-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary-500" />
            <span className="text-base font-medium text-text-primary">
              Categories:
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={`cursor-pointer transition-all duration-200 px-4 py-2 text-sm font-medium border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover)]${
                selectedCategory === category.id
                  ? "bg-primary-500  hover:bg-[var(--secondary-btn-hover)]"
                  : ""
              }`}
              onClick={() => setSelectedCategory(category.id)}
              aria-pressed={selectedCategory === category.id}
            >
              {category.name}{" "}
              <span className="ml-1 opacity-75">({category.count})</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      <div
        className="flex items-center justify-between py-4 border-b border-[var(--border-color)]"
        aria-live="polite"
      >
        <div className="text-text-secondary">
          Showing{" "}
          <span className="font-semibold text-text-primary">
            {filteredAndSortedBlogs.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-text-primary">
            {sampleBlogs.length}
          </span>{" "}
          posts
        </div>
        <div className="text-sm text-text-secondary">
          Updated {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <BlogCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* Blog Grid */}
      {!isLoading && filteredAndSortedBlogs.length > 0 && (
        <div
          id="blog-grid"
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {filteredAndSortedBlogs.map((blog, index) => (
            <BlogCard key={index} blog={blog} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedBlogs.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-2">
            No posts found
          </h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            We couldn't find any posts matching your search criteria. Try
            adjusting your filters or search terms.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSortBy("recent");
            }}
            className="px-6 py-3"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
