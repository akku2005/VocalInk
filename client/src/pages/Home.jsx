import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import { TrendingUp, Users, BookOpen, Zap, ArrowRight } from "lucide-react";
import blogService from "../services/blogService";
import statsService from "../services/statsService";
import { getCleanExcerpt } from "../utils/textUtils";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBlogs: 0,
    totalUsers: 0,
    totalSeries: 0,
    aiGenerations: 0,
    growth: {
      blogs: 0,
      users: 0,
      series: 0,
      ai: 0
    }
  });
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data at once
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch both stats and blogs in parallel
        const [statsData, blogsData] = await Promise.all([
          statsService.getPlatformStats().catch(err => {
            console.error('Error fetching stats:', err);
            return {
              totalBlogs: 0,
              totalUsers: 0,
              totalSeries: 0,
              aiGenerations: 0,
              growth: { blogs: 0, users: 0, series: 0, ai: 0 }
            };
          }),
          blogService.getBlogs({ 
            status: 'published',
            limit: 6,
            sort: 'createdAt',
            order: 'desc'
          }).catch(err => {
            console.error('Error fetching blogs:', err);
            return [];
          })
        ]);

        // Update state with fetched data
        setStats(statsData);
        setFeaturedBlogs(blogsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        // Only show content after everything is loaded
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8 lg:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
            Welcome to{" "}
            <span className="text-primary-500 bg-gradient-to-r from-indigo-500 to-indigo-700 bg-clip-text text-transparent">
              VocalInk
            </span>
          </h1>
          <p className="text-lg lg:text-xl text-text-secondary mb-8 leading-relaxed">
            Create, discover, and experience content like never before with
            AI-powered blogging, text-to-speech, and gamified social features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center ">
            {isAuthenticated ? (
              <>
                <Link to="/create-blog">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow duration-300  text-white cursor-pointer bg-indigo-500 hover:bg-indigo-600"
                  >
                    Create New Post
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full sm:w-auto hover:bg-primary-50 transition-all duration-300 cursor-pointer bg-[var(--secondary-btn)] backdrop-blur-2xl hover:bg-[var(--secondary-btn-hover)]"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow duration-300 text-white cursor-pointer bg-indigo-500 hover:bg-indigo-600"
                  >
                    Get Started
                  </Button>
                </Link>
                <Link to="/blogs">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full sm:w-auto bg-[var(--secondary-btn)] backdrop-blur-2xl hover:bg-[var(--secondary-btn-hover)] transition-all duration-300 cursor-pointer outline-none "
                  >
                    Explore Blogs
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary-500 transition-colors">
              Total Blogs
            </CardTitle>
            <BookOpen className="h-4 w-4 text-text-secondary group-hover:text-primary-500 transition-colors" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-primary-500">
                  {stats.totalBlogs.toLocaleString()}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {stats.growth?.blogs > 0 ? '+' : ''}{stats.growth?.blogs}% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary-500 transition-colors">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-text-secondary group-hover:text-primary-500 transition-colors" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-primary-500">
                  {stats.totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {stats.growth?.users > 0 ? '+' : ''}{stats.growth?.users}% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary-500 transition-colors">
              Series Created
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-text-secondary group-hover:text-primary-500 transition-colors" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-primary-500">
                  {stats.totalSeries.toLocaleString()}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {stats.growth?.series > 0 ? '+' : ''}{stats.growth?.series}% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-primary-500 transition-colors">
              AI Generations
            </CardTitle>
            <Zap className="h-4 w-4 text-text-secondary group-hover:text-primary-500 transition-colors" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-300 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-primary-500">
                  {stats.aiGenerations.toLocaleString()}
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {stats.growth?.ai > 0 ? '+' : ''}{stats.growth?.ai}% from last month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Featured Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
              Featured Content
            </h2>
            <p className="text-text-secondary">
              Discover the latest and most popular content from our community
            </p>
          </div>
          <Link to="/blogs">
            <Button
              variant="outline"
              className="hidden lg:flex items-center gap-2 cursor-pointer"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-md animate-pulse">
                <div className="h-48 bg-gray-300 rounded-t-lg mb-4"></div>
                <CardHeader className="pb-2">
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : featuredBlogs.length > 0 ? (
            // Real blogs
            featuredBlogs.map((blog) => (
              <Link key={blog._id} to={`/article/${blog._id}`}>
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 shadow-md ">
                  {blog.coverImage ? (
                    <img 
                      src={blog.coverImage} 
                      alt={blog.title}
                      className="h-48 w-full object-cover rounded-t-lg mb-4"
                    />
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-indigo-500 to-gray-500 rounded-t-lg mb-4"></div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="group-hover:text-primary-500 transition-colors font-medium text-lg line-clamp-2">
                      {blog.title}
                    </CardTitle>
                    <p className="text-sm text-text-secondary leading-relaxed text-[var(text-color)] line-clamp-2">
                      {getCleanExcerpt(blog, 150)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-text-secondary">
                      <div 
                        className={`flex items-center space-x-2 ${blog.author?._id ? 'cursor-pointer hover:opacity-80' : ''}`}
                        onClick={(e) => {
                          if (blog.author?._id) {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/profile/${blog.author._id}`);
                          }
                        }}
                      >
                        {blog.author?.avatar ? (
                          <img 
                            src={blog.author.avatar} 
                            alt={blog.author?.displayName || 'Author'}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-600">
                              {blog.author ? (blog.author.displayName || blog.author.firstName || blog.author.username || 'A').charAt(0) : 'A'}
                            </span>
                          </div>
                        )}
                        <span className={`truncate max-w-[100px] ${blog.author?._id ? 'hover:underline' : ''}`}>
                          {blog.author ? (
                            blog.author.displayName || 
                            (blog.author.firstName || blog.author.lastName ? 
                              `${blog.author.firstName || ''} ${blog.author.lastName || ''}`.trim() : 
                              blog.author.username || 
                              blog.author.email?.split('@')[0] || 
                              'Anonymous')
                          ) : 'Anonymous'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {blog.readingTime && <span>{blog.readingTime} min read</span>}
                        <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            // No blogs found
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-text-secondary">No featured blogs available yet.</p>
              {isAuthenticated && (
                <Link to="/create-blog">
                  <Button className="mt-4 bg-indigo-500 hover:bg-indigo-600">
                    Create the First Blog
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
        <div className="text-center lg:hidden">
          <Link to="/blogs">
            <Button
              variant="outline"
              className="flex items-center gap-2 mx-auto"
            >
              View All Blogs
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
            {isAuthenticated
              ? "Your VocalInk Dashboard"
              : "Discover VocalInk Features"}
          </h2>
          <p className="text-text-secondary">
            {isAuthenticated
              ? "Access your personalized tools and insights"
              : "Explore the powerful tools and features that make VocalInk unique"}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isAuthenticated ? (
            <>
              <Link to="/analytics">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group text-center p-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                    <TrendingUp className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Analytics
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Track your content performance and audience insights
                  </p>
                </Card>
              </Link>

              <Link to="/rewards">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group text-center p-6">
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-warning-200 transition-colors">
                    <BookOpen className="w-6 h-6 text-warning-600" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Rewards
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Earn badges, XP, and rewards for your engagement
                  </p>
                </Card>
              </Link>

              <Link to="/create-blog">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group text-center p-6">
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-success-200 transition-colors">
                    <Users className="w-6 h-6 text-success-600" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Create Content
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Start writing and publishing your next blog post
                  </p>
                </Card>
              </Link>

              <Link to="/settings">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group text-center p-6">
                  <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-200 transition-colors">
                    <Zap className="w-6 h-6 text-accent-600" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Settings
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Customize your profile and preferences
                  </p>
                </Card>
              </Link>
            </>
          ) : (
            <>
              <Link to="/register">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group text-center p-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors">
                    <TrendingUp className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Join Community
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Create an account and start your journey
                  </p>
                </Card>
              </Link>

              <Link to="/blogs">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group text-center p-6">
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-warning-200 transition-colors">
                    <BookOpen className="w-6 h-6 text-warning-600" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Explore Content
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Discover amazing blogs and stories
                  </p>
                </Card>
              </Link>

              <Link to="/leaderboard">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group text-center p-6">
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-success-200 transition-colors">
                    <Users className="w-6 h-6 text-success-600" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Leaderboard
                  </h3>
                  <p className="text-sm text-text-secondary">
                    See top creators and trending content
                  </p>
                </Card>
              </Link>

              <Link to="/search">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group text-center p-6">
                  <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-200 transition-colors">
                    <Zap className="w-6 h-6 text-accent-600" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Smart Search
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Find content with AI-powered search and filters
                  </p>
                </Card>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
