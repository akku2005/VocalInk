import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import { TrendingUp, Users, BookOpen, Zap, ArrowRight } from "lucide-react";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [stats] = useState({
    totalBlogs: 1250,
    totalUsers: 850,
    totalSeries: 120,
    aiGenerations: 3400,
  });

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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <>
                <Link to="/create-blog">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    Create New Post
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full sm:w-auto hover:bg-primary-50 transition-all duration-300"
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
            <div className="text-2xl font-bold text-primary-500">
              {stats.totalBlogs.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              +12% from last month
            </p>
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
            <div className="text-2xl font-bold text-primary-500">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              +8% from last month
            </p>
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
            <div className="text-2xl font-bold text-primary-500">
              {stats.totalSeries.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              +15% from last month
            </p>
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
            <div className="text-2xl font-bold text-primary-500">
              {stats.aiGenerations.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              +25% from last month
            </p>
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
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Link key={item} to={`/article/${item}`}>
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 shadow-md ">
                <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100 rounded-t-lg mb-4"></div>
                <CardHeader className="pb-2">
                  <CardTitle className="group-hover:text-primary-500 transition-colors text-lg">
                    Sample Blog Post {item}
                  </CardTitle>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Discover the future of content creation with AI-powered
                    features and innovative storytelling techniques...
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          JD
                        </span>
                      </div>
                      <span>John Doe</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>5 min read</span>
                      <span>2 days ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
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
