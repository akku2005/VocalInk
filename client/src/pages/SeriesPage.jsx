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
import SeriesCardSkeleton from "../components/skeletons/SeriesCardSkeleton";
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
} from "lucide-react";
import DiscoverSeriesDropDown from "../components/ui/DiscoverSeriesDropdown";

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
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Enhanced sample series data with more realistic content
  const sampleSeries = [
    {
      id: "1",
      title: "Complete Web Development Bootcamp",
      description:
        "A comprehensive journey from HTML basics to full-stack development with modern frameworks and best practices.",
      summary:
        "Master web development from scratch with hands-on projects and real-world applications. Learn HTML, CSS, JavaScript, React, Node.js, and deployment strategies.",
      coverImage: "/api/series/1/cover",
      category: "Technology",
      template: "educational_course",
      difficulty: "beginner",
      tags: [
        "Web Development",
        "JavaScript",
        "React",
        "Node.js",
        "HTML",
        "CSS",
      ],
      status: "active",
      visibility: "public",
      publishedAt: "2024-01-15",
      updatedAt: "2024-01-20",
      episodes: [
        {
          title: "Introduction to HTML",
          status: "published",
          order: 1,
          readTime: 12,
          publishedAt: "2024-01-15",
        },
        {
          title: "CSS Fundamentals",
          status: "published",
          order: 2,
          readTime: 15,
          publishedAt: "2024-01-16",
        },
        {
          title: "JavaScript Basics",
          status: "published",
          order: 3,
          readTime: 18,
          publishedAt: "2024-01-17",
        },
        {
          title: "React Fundamentals",
          status: "published",
          order: 4,
          readTime: 22,
          publishedAt: "2024-01-18",
        },
        {
          title: "Backend with Node.js",
          status: "draft",
          order: 5,
          readTime: 25,
          publishedAt: null,
        },
        {
          title: "Database Integration",
          status: "draft",
          order: 6,
          readTime: 20,
          publishedAt: null,
        },
        {
          title: "Deployment Strategies",
          status: "draft",
          order: 7,
          readTime: 16,
          publishedAt: null,
        },
      ],
      author: {
        name: "Sarah Johnson",
        profilePicture: "/api/users/sarah/avatar",
        verified: true,
      },
      analytics: {
        totalViews: 15420,
        totalReads: 8900,
        completionRate: 68,
        subscribers: 1240,
        likes: 892,
        comments: 156,
        bookmarks: 445,
      },
      collaborators: [
        {
          name: "Mike Chen",
          role: "contributor",
          profilePicture: "/api/users/mike/avatar",
        },
        {
          name: "Emily Rodriguez",
          role: "reviewer",
          profilePicture: "/api/users/emily/avatar",
        },
      ],
      isBookmarked: false,
      isSubscribed: false,
      isLiked: false,
      rating: 4.8,
      totalRatings: 234,
    },
    {
      id: "2",
      title: "The Future of AI: A Deep Dive into Machine Learning",
      description:
        "Explore the cutting-edge developments in artificial intelligence and their impact on various industries.",
      summary:
        "Comprehensive analysis of AI trends, technologies, and future implications across healthcare, finance, and technology sectors.",
      coverImage: "/api/series/2/cover",
      category: "Technology",
      template: "research_journey",
      difficulty: "advanced",
      tags: [
        "Artificial Intelligence",
        "Machine Learning",
        "Future Tech",
        "Deep Learning",
        "Neural Networks",
      ],
      status: "active",
      visibility: "premium",
      publishedAt: "2024-01-10",
      updatedAt: "2024-01-19",
      episodes: [
        {
          title: "AI Fundamentals",
          status: "published",
          order: 1,
          readTime: 14,
          publishedAt: "2024-01-10",
        },
        {
          title: "Machine Learning Basics",
          status: "published",
          order: 2,
          readTime: 16,
          publishedAt: "2024-01-11",
        },
        {
          title: "Deep Learning Revolution",
          status: "published",
          order: 3,
          readTime: 20,
          publishedAt: "2024-01-12",
        },
        {
          title: "AI in Healthcare",
          status: "published",
          order: 4,
          readTime: 18,
          publishedAt: "2024-01-13",
        },
        {
          title: "The Future of Work",
          status: "published",
          order: 5,
          readTime: 22,
          publishedAt: "2024-01-14",
        },
        {
          title: "Ethical AI Considerations",
          status: "draft",
          order: 6,
          readTime: 19,
          publishedAt: null,
        },
      ],
      author: {
        name: "Dr. Michael Chen",
        profilePicture: "/api/users/michael/avatar",
        verified: true,
      },
      analytics: {
        totalViews: 8900,
        totalReads: 5600,
        completionRate: 72,
        subscribers: 890,
        likes: 567,
        comments: 89,
        bookmarks: 298,
      },
      collaborators: [
        {
          name: "Prof. Lisa Wang",
          role: "contributor",
          profilePicture: "/api/users/lisa/avatar",
        },
      ],
      isBookmarked: true,
      isSubscribed: true,
      isLiked: true,
      rating: 4.9,
      totalRatings: 178,
    },
    {
      id: "3",
      title: "Sustainable Living Chronicles: A Family's Journey",
      description:
        "A personal journey towards sustainable living with practical tips and real-world experiences.",
      summary:
        "Follow one family's transition to eco-friendly living with actionable advice for reducing environmental impact.",
      coverImage: "/api/series/3/cover",
      category: "Lifestyle",
      template: "story_arc",
      difficulty: "beginner",
      tags: [
        "Sustainability",
        "Lifestyle",
        "Environment",
        "Green Living",
        "Eco-Friendly",
      ],
      status: "active",
      visibility: "public",
      publishedAt: "2024-01-08",
      updatedAt: "2024-01-18",
      episodes: [
        {
          title: "Why We Started This Journey",
          status: "published",
          order: 1,
          readTime: 8,
          publishedAt: "2024-01-08",
        },
        {
          title: "Reducing Plastic Waste",
          status: "published",
          order: 2,
          readTime: 10,
          publishedAt: "2024-01-09",
        },
        {
          title: "Energy Conservation at Home",
          status: "published",
          order: 3,
          readTime: 12,
          publishedAt: "2024-01-10",
        },
        {
          title: "Sustainable Food Choices",
          status: "published",
          order: 4,
          readTime: 9,
          publishedAt: "2024-01-11",
        },
        {
          title: "Community Impact",
          status: "draft",
          order: 5,
          readTime: 11,
          publishedAt: null,
        },
        {
          title: "Our Results After 6 Months",
          status: "draft",
          order: 6,
          readTime: 13,
          publishedAt: null,
        },
      ],
      author: {
        name: "Alex Green",
        profilePicture: "/api/users/alex/avatar",
        verified: false,
      },
      analytics: {
        totalViews: 6700,
        totalReads: 4200,
        completionRate: 85,
        subscribers: 560,
        likes: 423,
        comments: 67,
        bookmarks: 189,
      },
      collaborators: [
        {
          name: "Lisa Green",
          role: "contributor",
          profilePicture: "/api/users/lisa-green/avatar",
        },
        {
          name: "Tom Wilson",
          role: "photographer",
          profilePicture: "/api/users/tom/avatar",
        },
      ],
      isBookmarked: false,
      isSubscribed: false,
      isLiked: false,
      rating: 4.7,
      totalRatings: 145,
    },
    {
      id: "4",
      title: "Digital Marketing Mastery: From Beginner to Expert",
      description:
        "Complete guide to digital marketing covering SEO, social media, content marketing, and analytics.",
      summary:
        "Learn modern digital marketing strategies with hands-on examples and real campaign case studies.",
      coverImage: "/api/series/4/cover",
      category: "Marketing",
      template: "educational_course",
      difficulty: "intermediate",
      tags: [
        "Digital Marketing",
        "SEO",
        "Social Media",
        "Content Marketing",
        "Analytics",
      ],
      status: "active",
      visibility: "public",
      publishedAt: "2024-01-05",
      updatedAt: "2024-01-17",
      episodes: [
        {
          title: "Digital Marketing Fundamentals",
          status: "published",
          order: 1,
          readTime: 15,
          publishedAt: "2024-01-05",
        },
        {
          title: "SEO Best Practices",
          status: "published",
          order: 2,
          readTime: 18,
          publishedAt: "2024-01-06",
        },
        {
          title: "Social Media Strategy",
          status: "published",
          order: 3,
          readTime: 16,
          publishedAt: "2024-01-07",
        },
        {
          title: "Content Marketing Excellence",
          status: "published",
          order: 4,
          readTime: 20,
          publishedAt: "2024-01-08",
        },
        {
          title: "Email Marketing Automation",
          status: "draft",
          order: 5,
          readTime: 17,
          publishedAt: null,
        },
      ],
      author: {
        name: "Maria Rodriguez",
        profilePicture: "/api/users/maria/avatar",
        verified: true,
      },
      analytics: {
        totalViews: 12300,
        totalReads: 7800,
        completionRate: 74,
        subscribers: 980,
        likes: 654,
        comments: 112,
        bookmarks: 321,
      },
      collaborators: [],
      isBookmarked: true,
      isSubscribed: false,
      isLiked: false,
      rating: 4.6,
      totalRatings: 201,
    },
    {
      id: "5",
      title: "Photography Essentials: Capturing Life's Moments",
      description:
        "Master the art of photography from basic techniques to advanced composition and editing.",
      summary:
        "Comprehensive photography course covering camera basics, composition, lighting, and post-processing.",
      coverImage: "/api/series/5/cover",
      category: "Creative",
      template: "educational_course",
      difficulty: "beginner",
      tags: [
        "Photography",
        "Visual Arts",
        "Editing",
        "Composition",
        "Lighting",
      ],
      status: "active",
      visibility: "public",
      publishedAt: "2024-01-03",
      updatedAt: "2024-01-16",
      episodes: [
        {
          title: "Camera Basics and Settings",
          status: "published",
          order: 1,
          readTime: 12,
          publishedAt: "2024-01-03",
        },
        {
          title: "Understanding Light and Exposure",
          status: "published",
          order: 2,
          readTime: 14,
          publishedAt: "2024-01-04",
        },
        {
          title: "Composition Techniques",
          status: "published",
          order: 3,
          readTime: 16,
          publishedAt: "2024-01-05",
        },
        {
          title: "Portrait Photography",
          status: "published",
          order: 4,
          readTime: 18,
          publishedAt: "2024-01-06",
        },
        {
          title: "Landscape Photography",
          status: "draft",
          order: 5,
          readTime: 15,
          publishedAt: null,
        },
        {
          title: "Photo Editing Fundamentals",
          status: "draft",
          order: 6,
          readTime: 20,
          publishedAt: null,
        },
      ],
      author: {
        name: "James Parker",
        profilePicture: "/api/users/james/avatar",
        verified: true,
      },
      analytics: {
        totalViews: 9800,
        totalReads: 6200,
        completionRate: 79,
        subscribers: 720,
        likes: 512,
        comments: 89,
        bookmarks: 267,
      },
      collaborators: [
        {
          name: "Sophie Chen",
          role: "contributor",
          profilePicture: "/api/users/sophie/avatar",
        },
      ],
      isBookmarked: false,
      isSubscribed: true,
      isLiked: true,
      rating: 4.8,
      totalRatings: 167,
    },
    {
      id: "6",
      title: "Personal Finance Mastery: Building Wealth Step by Step",
      description:
        "Complete guide to personal finance, investing, and building long-term wealth.",
      summary:
        "Learn budgeting, investing strategies, and wealth-building techniques from financial experts.",
      coverImage: "/api/series/6/cover",
      category: "Finance",
      template: "step_by_step",
      difficulty: "intermediate",
      tags: [
        "Personal Finance",
        "Investing",
        "Wealth Building",
        "Budgeting",
        "Financial Planning",
      ],
      status: "active",
      visibility: "premium",
      publishedAt: "2024-01-01",
      updatedAt: "2024-01-15",
      episodes: [
        {
          title: "Financial Basics and Budgeting",
          status: "published",
          order: 1,
          readTime: 16,
          publishedAt: "2024-01-01",
        },
        {
          title: "Emergency Fund Strategy",
          status: "published",
          order: 2,
          readTime: 12,
          publishedAt: "2024-01-02",
        },
        {
          title: "Investment Fundamentals",
          status: "published",
          order: 3,
          readTime: 20,
          publishedAt: "2024-01-03",
        },
        {
          title: "Stock Market Basics",
          status: "published",
          order: 4,
          readTime: 18,
          publishedAt: "2024-01-04",
        },
        {
          title: "Real Estate Investing",
          status: "draft",
          order: 5,
          readTime: 22,
          publishedAt: null,
        },
        {
          title: "Retirement Planning",
          status: "draft",
          order: 6,
          readTime: 19,
          publishedAt: null,
        },
      ],
      author: {
        name: "Robert Chang",
        profilePicture: "/api/users/robert/avatar",
        verified: true,
      },
      analytics: {
        totalViews: 14200,
        totalReads: 9100,
        completionRate: 81,
        subscribers: 1150,
        likes: 789,
        comments: 134,
        bookmarks: 456,
      },
      collaborators: [
        {
          name: "Jennifer Lee",
          role: "contributor",
          profilePicture: "/api/users/jennifer/avatar",
        },
      ],
      isBookmarked: true,
      isSubscribed: true,
      isLiked: false,
      rating: 4.9,
      totalRatings: 289,
    },
  ];

  // Dynamic categories based on actual data
  const categories = [
    { id: "all", name: "All Series", count: sampleSeries.length },
    {
      id: "technology",
      name: "Technology",
      count: sampleSeries.filter(
        (s) => s.category.toLowerCase() === "technology"
      ).length,
    },
    {
      id: "lifestyle",
      name: "Lifestyle",
      count: sampleSeries.filter(
        (s) => s.category.toLowerCase() === "lifestyle"
      ).length,
    },
    {
      id: "marketing",
      name: "Marketing",
      count: sampleSeries.filter(
        (s) => s.category.toLowerCase() === "marketing"
      ).length,
    },
    {
      id: "creative",
      name: "Creative",
      count: sampleSeries.filter((s) => s.category.toLowerCase() === "creative")
        .length,
    },
    {
      id: "finance",
      name: "Finance",
      count: sampleSeries.filter((s) => s.category.toLowerCase() === "finance")
        .length,
    },
  ];

  const templates = [
    { id: "all", name: "All Templates", count: sampleSeries.length },
    {
      id: "educational_course",
      name: "Educational Course",
      count: sampleSeries.filter((s) => s.template === "educational_course")
        .length,
    },
    {
      id: "research_journey",
      name: "Research Journey",
      count: sampleSeries.filter((s) => s.template === "research_journey")
        .length,
    },
    {
      id: "story_arc",
      name: "Story Arc",
      count: sampleSeries.filter((s) => s.template === "story_arc").length,
    },
    {
      id: "step_by_step",
      name: "Step by Step",
      count: sampleSeries.filter((s) => s.template === "step_by_step").length,
    },
  ];

  const difficulties = [
    {
      id: "all",
      name: "All Levels",
      count: sampleSeries.length,
      color: "bg-gray-500 text-white hover:bg-gray-600",
    },
    {
      id: "beginner",
      name: "Beginner",
      count: sampleSeries.filter((s) => s.difficulty === "beginner").length,
      color: "bg-indigo-600 text-white hover:bg-indigo-700",
    },
    {
      id: "intermediate",
      name: "Intermediate",
      count: sampleSeries.filter((s) => s.difficulty === "intermediate").length,
      color: "bg-black text-white hover:bg-gray-800",
    },
    {
      id: "advanced",
      name: "Advanced",
      count: sampleSeries.filter((s) => s.difficulty === "advanced").length,
      color: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-100",
    },
  ];

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

  // Debounced search (matching BlogPage pattern)
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Simulated loading when filters/search change (matching BlogPage pattern)
  useEffect(() => {
    setIsLoading(true);
    const id = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(id);
  }, [
    debouncedQuery,
    selectedCategory,
    selectedTemplate,
    selectedDifficulty,
    sortBy,
    viewMode,
  ]);

  // Enhanced filtering and sorting logic
  const filteredAndSortedSeries = useMemo(() => {
    const filtered = sampleSeries.filter((series) => {
      const matchesSearch =
        series.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        series.description
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase()) ||
        series.summary.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        series.tags.some((tag) =>
          tag.toLowerCase().includes(debouncedQuery.toLowerCase())
        ) ||
        series.author.name.toLowerCase().includes(debouncedQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        series.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesTemplate =
        selectedTemplate === "all" || series.template === selectedTemplate;

      const matchesDifficulty =
        selectedDifficulty === "all" ||
        series.difficulty === selectedDifficulty;

      return (
        matchesSearch && matchesCategory && matchesTemplate && matchesDifficulty
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.publishedAt) - new Date(a.publishedAt);
      }
      if (sortBy === "popular") {
        const aScore =
          a.analytics.totalViews + a.analytics.subscribers + a.analytics.likes;
        const bScore =
          b.analytics.totalViews + b.analytics.subscribers + b.analytics.likes;
        return bScore - aScore;
      }
      if (sortBy === "episodes") {
        return b.episodes.length - a.episodes.length;
      }
      if (sortBy === "completion") {
        return b.analytics.completionRate - a.analytics.completionRate;
      }
      if (sortBy === "rating") {
        return b.rating - a.rating;
      }
      return 0;
    });

    return sorted;
  }, [
    sampleSeries,
    debouncedQuery,
    selectedCategory,
    selectedTemplate,
    selectedDifficulty,
    sortBy,
  ]);

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
    switch (difficulty) {
      case "beginner":
        return "bg-green-600 hover:bg-green-700 text-white ";
      case "intermediate":
        return "bg-yellow-600 hover:bg-yellow-700 text-white ";
      case "advanced":
        return "bg-red-600 text-white hover:bg-red-700 ";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700";
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
    return episodes.reduce((total, ep) => total + (ep.readTime || 0), 0);
  };

  const getSeriesProgress = (episodes) => {
    const published = getPublishedEpisodesCount(episodes);
    const total = episodes.length;
    return Math.round((published / total) * 100);
  };

  // SeriesCard component with improved mobile design
  const SeriesCard = ({ series, viewMode }) => {
    const publishedEpisodes = getPublishedEpisodesCount(series.episodes);
    const totalReadTime = getTotalReadTime(
      series.episodes.filter((ep) => ep.status === "published")
    );
    const progress = getSeriesProgress(series.episodes);

    if (viewMode === "list") {
      return (
        <Card className="cursor-pointer group hover:shadow-lg transition-all duration-300 border border-[var(--border-color)]">
          <div className="flex flex-col lg:flex-row">
            {/* Cover Image */}
            <div className="w-full lg:w-80 aspect-video lg:aspect-square bg-gradient-to-br from-indigo-400 rounded-t-lg lg:rounded-l-lg lg:rounded-t-none to-gray-400 flex items-center justify-center relative overflow-hidden">
              <div className="text-4xl opacity-30">📚</div>

              {/* Overlay Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-1 text-white border border-white backdrop-blur-sm"
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
                  <span className="ml-1 capitalize hidden sm:inline">{series.difficulty}</span>
                </Badge>
              </div>

              {/* Premium Badge */}
              {series.visibility === "premium" && (
                <div className="absolute top-3 right-3">
                  <Badge
                    variant="warning"
                    className="text-xs px-2 py-1 border border-[var(--border-color)] backdrop-blur-sm"
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
                      {series.tags.slice(0, window.innerWidth < 640 ? 2 : 3).map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-2 py-1 border border-[var(--border-color)]"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {series.tags.length > (window.innerWidth < 640 ? 2 : 3) && (
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-1 border border-[var(--border-color)]"
                        >
                          +{series.tags.length - (window.innerWidth < 640 ? 2 : 3)}
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
                    <span className="font-medium">{series.author.name}</span>
                    {series.author.verified && (
                      <Shield className="w-2 h-2 sm:w-3 sm:h-3 text-primary-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{series.category}</span>
                    <span className="sm:hidden">{series.category.slice(0, 8)}</span>
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
                        {formatNumber(series.analytics.totalViews)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">
                        {formatNumber(series.analytics.subscribers)}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span className="font-medium">
                        {formatNumber(series.analytics.likes)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">{series.rating}</span>
                      <span className="opacity-75 hidden lg:inline">
                        ({series.totalRatings})
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {series.collaborators.length > 0 && (
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
      <Card className="cursor-pointer group overflow-hidden hover:shadow-lg transition-all duration-300 border border-[var(--border-color)]">
        {/* Cover Image */}
        <div className="aspect-video bg-gradient-to-br from-indigo-400 to-gray-400 flex items-center justify-center relative overflow-hidden">
          <div className="text-3xl sm:text-4xl opacity-30">📚</div>

          {/* Template and Difficulty Badges */}
          {/* Left Side */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge
              variant="outline"
              className="flex items-center text-xs px-2 py-1 text-white border border-white backdrop-blur-sm h-6 w-fit"
            >
              {getTemplateIcon(series.template)}
              <span className="ml-1 capitalize hidden sm:inline">
                {series.template.replace("_", " ")}
              </span>
            </Badge>
            <Badge
              className={`text-xs px-2 py-1 backdrop-blur-sm h-6 w-fit ${getDifficultyColor(
                series.difficulty
              )}`}
            >
              {getDifficultyIcon(series.difficulty)}
              <span className="ml-1 capitalize hidden sm:inline">{series.difficulty}</span>
            </Badge>
          </div>

          {/* Right Side */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {series.visibility === "premium" && (
              <Badge
                variant="warning"
                className="flex items-center text-xs px-2 py-1 backdrop-blur-sm h-6 w-fit"
              >
                <span className="hidden sm:inline">Premium</span>
                <span className="sm:hidden">💎</span>
              </Badge>
            )}
            <button className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 shadow-sm border border-[var(--border-color)] bg-[var(--secondary-btn2)] cursor-pointer">
              <Star
                className={`w-4 h-4 ${
                  series.isBookmarked
                    ? "fill-current text-primary-500"
                    : "text-text-secondary"
                }`}
              />
            </button>
          </div>

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

        <CardHeader className="space-y-4 p-4 sm:p-6">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {series.tags.slice(0, window.innerWidth < 640 ? 2 : 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs px-2 py-1 border border-[var(--border-color)]"
              >
                {tag}
              </Badge>
            ))}
            {series.tags.length > (window.innerWidth < 640 ? 2 : 3) && (
              <Badge
                variant="outline"
                className="text-xs px-2 py-1 border border-[var(--border-color)]"
              >
                +{series.tags.length - (window.innerWidth < 640 ? 2 : 3)}
              </Badge>
            )}
          </div>

          {/* Title */}
          <CardTitle className="text-lg sm:text-xl line-clamp-2 group-hover:text-primary-500 transition-colors leading-tight">
            {series.title}
          </CardTitle>

          {/* Summary */}
          <p className="text-sm text-text-secondary line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {series.summary}
          </p>
        </CardHeader>

        <CardContent className="pt-0 p-4 sm:p-6">
          {/* Author and Category */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-text-secondary mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium">{series.author.name}</span>
              {series.author.verified && (
                <Shield className="w-2 h-2 sm:w-3 sm:h-3 text-primary-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{series.category}</span>
              <span className="sm:hidden">{series.category.slice(0, 8)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{totalReadTime} min</span>
            </div>
          </div>

          {/* Analytics */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-[var(--border-color)]">
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium">
                  {formatNumber(series.analytics.totalViews)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium">
                  {formatNumber(series.analytics.subscribers)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium">{series.rating}</span>
                <span className="opacity-75 hidden lg:inline">
                  ({series.totalRatings})
                </span>
              </div>
            </div>
            <div className="text-xs text-text-secondary">
              {series.collaborators.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {series.collaborators.length}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="text-center space-y-3 sm:space-y-4 py-4 sm:py-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight bg-gradient-to-r from-indigo-500 to-indigo-700 bg-clip-text text-transparent">
          Discover Series
        </h1>
        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto px-4">
          Explore curated collections of interconnected content designed to take
          you on a learning journey. From educational courses to story arcs,
          find series that match your interests and skill level.
        </p>
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
              <label htmlFor="sort" className="text-sm text-text-secondary hidden sm:inline">
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
                aria-controls="series-grid"
                className={`p-2 cursor-pointer rounded-md transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-[var(--secondary-btn2)] hover:bg-[var(--secondary-btn-hover2)] text-[var(--text-color)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Link to="/create-series">
              <Button className="flex items-center gap-2 h-10 sm:h-12 px-4 sm:px-6 bg-indigo-500 hover:bg-indigo-600 cursor-pointer text-sm sm:text-base">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Series</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters Section - Mobile Collapsible, Desktop Always Visible */}
      <div className={`space-y-4 sm:space-y-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
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
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover)]${
                  selectedCategory === category.id
                    ? " bg-primary-500 text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover)]"
                    : ""
                }`}
                onClick={() => setSelectedCategory(category.id)}
                aria-pressed={selectedCategory === category.id}
              >
                <span className="hidden sm:inline">{category.name}</span>
                <span className="sm:hidden">{category.name.replace("Series", "").trim()}</span>
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
                variant={selectedTemplate === template.id ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover2)] ${
                  selectedTemplate === template.id
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
                className={`cursor-pointer transition-all duration-200 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover2)]${
                  selectedDifficulty === difficulty.id
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

      {/* Results Summary */}
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
            {sampleSeries.length}
          </span>{" "}
          series
        </div>
        <div className="text-xs sm:text-sm text-text-secondary">
          Updated {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          className={`grid gap-4 sm:gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" 
              : "grid-cols-1"
          }`}
        >
          {Array.from({ length: 6 }).map((_, idx) => (
            <SeriesCardSkeleton key={idx} />
          ))}
        </div>
      )}

      {/* Series Grid */}
      {!isLoading && filteredAndSortedSeries.length > 0 && (
        <div
          id="series-grid"
          className={`grid gap-4 sm:gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {filteredAndSortedSeries.map((series) => (
            <SeriesCard key={series.id} series={series} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAndSortedSeries.length === 0 && (
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
  );
};

export default SeriesPage;