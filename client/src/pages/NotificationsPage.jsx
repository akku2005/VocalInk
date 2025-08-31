import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import {
  Bell,
  Heart,
  MessageCircle,
  Users,
  Award,
  Star,
  BookOpen,
  Zap,
  Settings,
  Check,
  Trash2,
  Filter,
  Search,
  MoreHorizontal,
  User,
  TrendingUp,
  Gift,
} from "lucide-react";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setNotifications([
        {
          id: 1,
          type: "like",
          title: "New like on your post",
          message:
            'Sarah Johnson liked your post "The Future of AI in Content Creation"',
          time: "2 minutes ago",
          read: false,
          icon: Heart,
          color: "text-red-500",
          bgColor: "bg-red-50",
          action: "view_post",
          postId: 123,
        },
        {
          id: 2,
          type: "comment",
          title: "New comment on your post",
          message:
            'Mike Chen commented: "Great insights! This really helped me understand..."',
          time: "15 minutes ago",
          read: false,
          icon: MessageCircle,
          color: "text-blue-500",
          bgColor: "bg-blue-50",
          action: "view_comment",
          postId: 123,
          commentId: 456,
        },
        {
          id: 3,
          type: "follow",
          title: "New follower",
          message: "Emily Rodriguez started following you",
          time: "1 hour ago",
          read: false,
          icon: Users,
          color: "text-green-500",
          bgColor: "bg-green-50",
          action: "view_profile",
          userId: 789,
        },
        {
          id: 4,
          type: "badge",
          title: "Badge earned!",
          message:
            'Congratulations! You earned the "AI Pioneer" badge for using AI features 50+ times',
          time: "2 hours ago",
          read: false,
          icon: Award,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50",
          action: "view_badge",
          badgeId: 4,
        },
        {
          id: 5,
          type: "level_up",
          title: "Level up!",
          message:
            "Congratulations! You reached level 8. Keep up the great work!",
          time: "3 hours ago",
          read: true,
          icon: TrendingUp,
          color: "text-purple-500",
          bgColor: "bg-purple-50",
          action: "view_profile",
        },
        {
          id: 6,
          type: "series",
          title: "Series update",
          message:
            'Your series "AI in Content Creation" has reached 1,000 total views',
          time: "5 hours ago",
          read: true,
          icon: BookOpen,
          color: "text-indigo-500",
          bgColor: "bg-indigo-50",
          action: "view_series",
          seriesId: 101,
        },
        {
          id: 7,
          type: "ai",
          title: "AI generation complete",
          message:
            'Your TTS audio for "Building a Successful Blog Series" is ready',
          time: "1 day ago",
          read: true,
          icon: Zap,
          color: "text-orange-500",
          bgColor: "bg-orange-50",
          action: "view_audio",
          postId: 124,
        },
        {
          id: 8,
          type: "reward",
          title: "Reward unlocked!",
          message: "You unlocked 500 XP for publishing 10 posts this month",
          time: "2 days ago",
          read: true,
          icon: Gift,
          color: "text-pink-500",
          bgColor: "bg-pink-50",
          action: "view_rewards",
        },
        {
          id: 9,
          type: "mention",
          title: "You were mentioned",
          message:
            'David Kim mentioned you in their post "Collaborative Writing Tips"',
          time: "3 days ago",
          read: true,
          icon: User,
          color: "text-cyan-500",
          bgColor: "bg-cyan-50",
          action: "view_post",
          postId: 125,
        },
        {
          id: 10,
          type: "system",
          title: "Welcome to VocalInk!",
          message:
            "We're excited to have you join our community. Start by creating your first post!",
          time: "1 week ago",
          read: true,
          icon: Bell,
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          action: "create_post",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const notificationTypes = [
    { id: "all", name: "All", count: notifications.length },
    {
      id: "like",
      name: "Likes",
      count: notifications.filter((n) => n.type === "like").length,
    },
    {
      id: "comment",
      name: "Comments",
      count: notifications.filter((n) => n.type === "comment").length,
    },
    {
      id: "follow",
      name: "Follows",
      count: notifications.filter((n) => n.type === "follow").length,
    },
    {
      id: "badge",
      name: "Badges",
      count: notifications.filter((n) => n.type === "badge").length,
    },
    {
      id: "system",
      name: "System",
      count: notifications.filter((n) => n.type === "system").length,
    },
  ];

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter = filter === "all" || notification.type === filter;
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const deleteSelected = () => {
    setNotifications((prev) =>
      prev.filter((n) => !selectedNotifications.has(n.id))
    );
    setSelectedNotifications(new Set());
  };

  const toggleSelection = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleNotificationAction = (notification) => {
    markAsRead(notification.id);
    // Handle different action types
    switch (notification.action) {
      case "view_post":
        console.log("Navigate to post:", notification.postId);
        break;
      case "view_comment":
        console.log("Navigate to comment:", notification.commentId);
        break;
      case "view_profile":
        console.log("Navigate to profile:", notification.userId);
        break;
      case "view_badge":
        console.log("Navigate to badge:", notification.badgeId);
        break;
      case "view_series":
        console.log("Navigate to series:", notification.seriesId);
        break;
      case "view_audio":
        console.log("Play audio for post:", notification.postId);
        break;
      case "view_rewards":
        console.log("Navigate to rewards");
        break;
      case "create_post":
        console.log("Navigate to create post");
        break;
      default:
        console.log("Unknown action:", notification.action);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Notifications
          </h1>
          <p className="text-text-secondary">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="flex items-center gap-2 cursor-pointer border border-[var(--border-color)] text-[var(--text-color)]  hover:bg-[var(--secondary-btn-hover)]"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </Button>
          )}
          <Button
            variant="outline"
            className="flex items-center gap-2 cursor-pointer border border-[var(--border-color)] text-[var(--text-color)]  hover:bg-[var(--secondary-btn-hover)]"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2  glassmorphism backdrop-blur-sm rounded-lg placeholder:text-[var(--light-text-color)] text-[var(--text-color)] "
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-secondary" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 cursor-pointer border border-[var(--border-color)] text-[var(--text-color)] rounded-lg bg-background text-text-primary"
              >
                {notificationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-700">
                {selectedNotifications.size} notification
                {selectedNotifications.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    selectedNotifications.forEach((id) => markAsRead(id));
                    setSelectedNotifications(new Set());
                  }}
                  className="flex items-center gap-1 cursor-pointer border border-[var(--border-color)] text-[var(--text-color)]  hover:bg-[var(--secondary-btn-hover)]"
                >
                  <Check className="w-4 h-4" />
                  Mark as read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelected}
                  className="flex items-center gap-1 text-error hover:text-error cursor-pointer border border-[var(--border-color)] text-[var(--text-color)]  hover:bg-[var(--secondary-btn-hover)]"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <Card
                key={notification.id}
                className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
                  !notification.read
                    ? "border-primary-200 bg-primary-50/50"
                    : ""
                }`}
                onClick={() => handleNotificationAction(notification)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.has(notification.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelection(notification.id);
                        }}
                        className="h-4 w-4 text-primary-500 focus:ring--500 border-border cursor-pointer rounded"
                      />
                      <div
                        className={`p-2 rounded-full cursor-pointer ${notification.bgColor}`}
                      >
                        <Icon className={`w-5 h-5 ${notification.color}`} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-text-primary mb-1">
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 inline-block w-2 h-2 bg-primary-500 rounded-full"></span>
                            )}
                          </h3>
                          <p className="text-sm  mb-2 leading-relaxed font-normal  text-[var(--text-color)] ">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-text-secondary">
                            <span>{notification.time}</span>
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-primary-500  cursor-pointer hover:bg-[var(--secondary-btn-hover)]"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-error hover:text-error cursor-pointer hover:bg-[var(--secondary-btn-hover)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No notifications found
              </h3>
              <p className="text-text-secondary">
                {searchQuery || filter !== "all"
                  ? "Try adjusting your search or filters"
                  : "You're all caught up! New notifications will appear here."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
