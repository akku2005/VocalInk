import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import {
  TrendingUp,
  Users,
  BookOpen,
  Zap,
  Activity,
  Calendar,
  Clock,
  Star,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats] = useState({
    totalViews: 15420,
    totalLikes: 3240,
    totalComments: 890,
    totalShares: 456,
    weeklyGrowth: 12.5,
    monthlyGrowth: 8.3,
  });

  const [recentActivity] = useState([
    {
      id: 1,
      type: "post",
      title: "New blog post published",
      description: 'Your post "AI in Content Creation" was published',
      time: "2 hours ago",
      icon: BookOpen,
      color: "text-primary-500",
    },
    {
      id: 2,
      type: "like",
      title: "New like received",
      description: "Sarah Johnson liked your post",
      time: "4 hours ago",
      icon: Star,
      color: "text-warning",
    },
    {
      id: 3,
      type: "comment",
      title: "New comment",
      description: "Mike Chen commented on your series",
      time: "6 hours ago",
      icon: Users,
      color: "text-success",
    },
    {
      id: 4,
      type: "ai",
      title: "AI generation completed",
      description: "Your TTS audio is ready",
      time: "1 day ago",
      icon: Zap,
      color: "text-accent",
    },
  ]);

  const [quickActions] = useState([
    {
      name: "Write New Post",
      icon: BookOpen,
      action: () => navigate("/create-blog"),
    },
    {
      name: "Create Series",
      icon: BookOpen,
      action: () => navigate("/series"),
    },
    {
      name: "Generate Audio",
      icon: Zap,
      action: () => navigate("/create-blog"),
    },
    {
      name: "View Analytics",
      icon: Activity,
      action: () => navigate("/analytics"),
    },
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-8 border border-[var(--border-color)] shadow-sm">
        <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-3">
          Welcome back, User! 👋
        </h1>
        <p className="text-text-secondary text-lg">
          Here's what's happening with your VocalInk account today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">
              {stats.totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary">
              +{stats.weeklyGrowth}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Star className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">
              {stats.totalLikes.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary">
              +{stats.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <Users className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">
              {stats.totalComments.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary">+15% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <Activity className="h-4 w-4 text-text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-500">
              {stats.totalShares.toLocaleString()}
            </div>
            <p className="text-xs text-text-secondary">+8% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={action.action}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm text-center leading-tight">
                      {action.name}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-surface transition-colors"
                  >
                    <div
                      className={`p-2 rounded-full bg-surface ${activity.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {activity.title}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {activity.description}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals and Progress */}
      <Card>
        <CardHeader>
          <CardTitle>This Month's Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-primary-500" />
                <span className="text-sm font-medium">Write 8 blog posts</span>
              </div>
              <Badge variant="success">6/8 Completed</Badge>
            </div>

            <div className="w-full bg-secondary-100 rounded-full h-2">
              <div
                className="bg-success h-2 rounded-full"
                style={{ width: "75%" }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">
                  Generate 20 TTS audios
                </span>
              </div>
              <Badge variant="warning">12/20 Completed</Badge>
            </div>

            <div className="w-full bg-secondary-100 rounded-full h-2">
              <div
                className="bg-warning h-2 rounded-full"
                style={{ width: "60%" }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
