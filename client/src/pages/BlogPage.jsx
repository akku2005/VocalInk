import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import BlogCard from "../components/blog/BlogCard";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import DropDown from "../components/ui/DropDown";
import BlogCardSkeleton from "../components/skeletons/BlogCardSkeleton";
import blogService from "../services/blogService";
import {
  Search,
  Filter,
  Plus,
  Grid3X3,
  List,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const BlogPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(
    params.get("cat") || "all"
  );
  const [viewMode, setViewMode] = useState(params.get("view") || "grid");
  const [sortBy, setSortBy] = useState(params.get("sort") || "recent");
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [error, setError] = useState(null);

  // Force grid view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        // sm breakpoint
        setViewMode("grid");
      }
    };

    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch blogs from API
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await blogService.getBlogs({ status: 'published' });
        setBlogs(data || []);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Failed to load blogs. Please try again later.');
        setBlogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Generate categories dynamically from blogs with search-aware counts
  const categories = useMemo(() => {
    // Filter blogs based on search query for accurate counts
    const searchText = debouncedQuery.toLowerCase();
    const searchFilteredBlogs = blogs.filter(blog => {
      if (!searchText) return true;
      return (
        blog.title?.toLowerCase().includes(searchText) ||
        blog.summary?.toLowerCase().includes(searchText) ||
        blog.content?.toLowerCase().includes(searchText) ||
        (blog.tags && Array.isArray(blog.tags) && blog.tags.some((tag) =>
          tag.toLowerCase().includes(searchText)
        ))
      );
    });

    const tagCounts = {};
    searchFilteredBlogs.forEach(blog => {
      if (blog.tags && Array.isArray(blog.tags)) {
        blog.tags.forEach(tag => {
          const tagLower = tag.toLowerCase();
          tagCounts[tagLower] = (tagCounts[tagLower] || 0) + 1;
        });
      }
    });

    const categoryList = [
      { id: "all", name: "All Posts", count: searchFilteredBlogs.length }
    ];

    // Add top categories (only show categories with at least 1 blog)
    Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([tag, count]) => {
        if (count > 0) {
          categoryList.push({
            id: tag,
            name: tag.charAt(0).toUpperCase() + tag.slice(1),
            count
          });
        }
      });

    return categoryList;
  }, [blogs, debouncedQuery]);

  const sortOptions = [
    { id: "recent", name: "Most Recent" },
    { id: "popular", name: "Most Popular" },
    { id: "readtime", name: "Read Time" },
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
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const filteredAndSortedBlogs = useMemo(() => {
    const filtered = blogs.filter((blog) => {
      // Handle search query
      const searchText = debouncedQuery.toLowerCase();
      const matchesSearch = !searchText || 
        blog.title?.toLowerCase().includes(searchText) ||
        blog.summary?.toLowerCase().includes(searchText) ||
        blog.content?.toLowerCase().includes(searchText) ||
        (blog.tags && Array.isArray(blog.tags) && blog.tags.some((tag) =>
          tag.toLowerCase().includes(searchText)
        ));

      // Handle category filter
      const matchesCategory =
        selectedCategory === "all" ||
        (blog.tags && Array.isArray(blog.tags) && blog.tags.some((tag) => tag.toLowerCase() === selectedCategory));

      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt);
      }
      if (sortBy === "popular") {
        return (
          (b.likes || 0) +
          (b.bookmarks || 0) -
          ((a.likes || 0) + (a.bookmarks || 0))
        );
      }
      if (sortBy === "readtime") {
        return (a.readingTime || 0) - (b.readingTime || 0);
      }
      return 0;
    });

    return sorted;
  }, [blogs, debouncedQuery, selectedCategory, sortBy]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("recent");
    setShowMobileFilters(false);
    setShowCategories(false);
  };

  const activeFiltersCount = [
    searchQuery,
    selectedCategory !== "all",
    sortBy !== "recent",
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 px-3 sm:px-6">
      {/* Header Section */}
      <div className="text-center space-y-3 sm:space-y-4 pt-4 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent pb-2">
          Blog Posts
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-text-secondary max-w-2xl mx-auto px-4 sm:px-0">
          Discover insights, stories, and knowledge from our community of
          writers and creators
        </p>
      </div>

      {/* Mobile Search Bar */}
      <div className="sm:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--light-text-color)]" />
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 py-3 text-sm border border-[var(--border-color)] rounded-lg w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--light-text-color)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="sm:hidden flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Button
            variant="outline"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm relative ${
              activeFiltersCount > 0
                ? "border-primary-500 text-primary-600"
                : ""
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        <Link to="/create-blog">
          <Button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New Post</span>
            <span className="xs:hidden">New</span>
          </Button>
        </Link>
      </div>

      {/* Desktop Search and Actions Bar */}
      <div className="hidden sm:flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-surface/50 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-[var(--border-color)]">
        <div className="flex-1 relative max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--light-text-color)]" />
          <Input
            type="text"
            placeholder="Search posts, authors, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 text-base border border-[var(--border-color)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--light-text-color)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-primary-500" />
            <label
              htmlFor="sort"
              className="text-sm text-text-secondary whitespace-nowrap"
            >
              Sort by
            </label>
            <DropDown sortBy={sortBy} setSortBy={setSortBy} />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-background rounded-lg p-1 border border-[var(--border-color)]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 cursor-pointer rounded-md transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-[var(--secondary-btn2)] text-[var(--text-color)] shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 cursor-pointer rounded-md transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-[var(--secondary-btn2)] text-[var(--text-color)] shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Link to="/create-blog">
            <Button className="flex items-center gap-2 h-12 px-6 bg-indigo-500 hover:bg-indigo-600">
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Filters Panel */}
      {showMobileFilters && (
        <div className="sm:hidden bg-surface rounded-lg border border-[var(--border-color)] p-4 space-y-4">
          {/* Sort Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">
                Sort by
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`p-3 text-left rounded-lg border transition-all text-sm ${
                    sortBy === option.id
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-[var(--border-color)] hover:bg-surface"
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Section */}
          <div className="space-y-3">
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="flex items-center justify-between w-full text-sm font-medium text-text-primary"
            >
              <span>Categories</span>
              {showCategories ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showCategories && (
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-2 text-left rounded-lg border transition-all text-xs ${
                      selectedCategory === category.id
                        ? " bg-[var(--secondary-btn3)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover3)] shadow-sm"
                        : " bg-[var(--secondary-btn)] hover:bg-[var(--secondary-btn-hover2)] text-text-secondary  "
                    }`}
                  >
                    <div className="font-medium">{category.name}</div>
                    <div className="text-text-secondary">
                      ({category.count})
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Filter Actions */}
          <div className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="flex-1 text-sm py-2"
            >
              Clear All
            </Button>
            <Button
              onClick={() => setShowMobileFilters(false)}
              className="flex-1 text-sm py-2 bg-indigo-500 hover:bg-indigo-600"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Categories Section */}
      <div className="hidden sm:block space-y-4">
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
              className={`cursor-pointer transition-all duration-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-[var(--border-color)] hover:bg-[var(--secondary-btn-hover)] ${
                selectedCategory === category.id
                  ? "bg-[var(--secondary-btn3)] text-[var(--text-color)] hover:bg-primary-600"
                  : "text-[var(--text-color)]"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}{" "}
              <span className="ml-1 opacity-75">({category.count})</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Active Filters Summary (Mobile) */}
      {(searchQuery || selectedCategory !== "all" || sortBy !== "recent") && (
        <div className="sm:hidden bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-primary-700 dark:text-primary-300">
              Active filters:
              {searchQuery && (
                <span className="ml-1 font-medium">"{searchQuery}"</span>
              )}
              {selectedCategory !== "all" && (
                <span className="ml-1 font-medium">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </span>
              )}
              {sortBy !== "recent" && (
                <span className="ml-1 font-medium">
                  {sortOptions.find((s) => s.id === sortBy)?.name}
                </span>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-primary-600 hover:text-primary-800 text-sm underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 py-3 sm:py-4 border-b border-[var(--border-color)]">
        <div className="text-text-secondary text-sm sm:text-base">
          Showing{" "}
          <span className="font-semibold text-text-primary">
            {filteredAndSortedBlogs.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-text-primary">
            {blogs.length}
          </span>{" "}
          posts
        </div>
        <div className="text-xs sm:text-sm text-text-secondary">
          Updated {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12 sm:py-16">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
            <X className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-text-primary mb-2">
            Error Loading Blogs
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

      {/* Loading State */}
      {isLoading && (
        <div
          className={`grid gap-4 sm:gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <BlogCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* Blog Grid */}
      {!isLoading && !error && filteredAndSortedBlogs.length > 0 && (
        <div
          id="blog-grid"
          className={`grid gap-4 sm:gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 max-w-4xl mx-auto"
          }`}
        >
          {filteredAndSortedBlogs.map((blog, index) => (
            <BlogCard key={blog._id || blog.id || index} blog={blog} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredAndSortedBlogs.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-text-primary mb-2">
            No posts found
          </h3>
          <p className="text-sm sm:text-base text-text-secondary mb-4 sm:mb-6 max-w-md mx-auto px-4">
            We couldn't find any posts matching your search criteria. Try
            adjusting your filters or search terms.
          </p>
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Floating Create Button (Mobile) */}
      <Link to="/create-blog" className="sm:hidden fixed bottom-6 right-4 z-40">
        <Button className="w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
          <Plus className="w-6 h-6 text-white" />
        </Button>
      </Link>
    </div>
  );
};

export default BlogPage;
