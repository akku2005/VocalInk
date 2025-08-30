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
  X,
  CheckSquare,
  Square,
} from "lucide-react";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

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
    // Remove from selection if it was selected
    const newSelected = new Set(selectedNotifications);
    newSelected.delete(notificationId);
    setSelectedNotifications(newSelected);
  };

  const deleteSelected = () => {
    setNotifications((prev) =>
      prev.filter((n) => !selectedNotifications.has(n.id))
    );
    setSelectedNotifications(new Set());
    setBulkMode(false);
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

  const selectAll = () => {
    const allIds = new Set(filteredNotifications.map(n => n.id));
    setSelectedNotifications(allIds);
  };

  const deselectAll = () => {
    setSelectedNotifications(new Set());
  };

  const handleNotificationAction = (notification) => {
    if (bulkMode) return; // Prevent navigation when in bulk select mode
    
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
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 sm:h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary">
              Notifications
            </h1>
            <p className="text-sm sm:text-base text-text-secondary mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : "All caught up!"}
            </p>
          </div>
          
          {/* Mobile action menu */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBulkMode(!bulkMode)}
              className={`flex items-center gap-2 px-3 py-2 text-sm ${
                bulkMode ? 'bg-primary-100 text-primary-700' : ''
              }`}
            >
              {bulkMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              <span className="hidden sm:inline">Select</span>
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-xs sm:text-sm px-3 py-2 border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover)]"
            >
              <Check className="w-4 h-4" />
              <span className="hidden xs:inline">Mark all as read</span>
              <span className="xs:hidden">Mark all</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-xs sm:text-sm px-3 py-2 border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover)] sm:hidden"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2 text-xs sm:text-sm px-3 py-2 border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover)]"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden xs:inline">Settings</span>
            <span className="xs:hidden">Config</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className={`${showFilters ? 'block' : 'hidden sm:block'}`}>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 glassmorphism backdrop-blur-sm rounded-lg placeholder:text-[var(--light-text-color)] text-[var(--text-color)] text-sm sm:text-base border border-[var(--border-color)] focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Filter Tabs - Mobile horizontal scroll */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Filter className="w-4 h-4 text-text-secondary flex-shrink-0" />
              <div className="flex gap-1 sm:gap-2 min-w-max">
                {notificationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFilter(type.id)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      filter === type.id
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type.name} ({type.count})
                  </button>
                ))}
              </div>
            </div>
            
            {/* Mobile close filters button */}
            <div className="sm:hidden flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="text-text-secondary"
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {(selectedNotifications.size > 0 || bulkMode) && (
        <Card className="bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-primary-700 dark:text-primary-300">
                  {selectedNotifications.size > 0 
                    ? `${selectedNotifications.size} selected`
                    : 'Bulk select mode'
                  }
                </span>
                {filteredNotifications.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs text-primary-600 hover:text-primary-800 underline"
                    >
                      Select all
                    </button>
                    {selectedNotifications.size > 0 && (
                      <button
                        onClick={deselectAll}
                        className="text-xs text-primary-600 hover:text-primary-800 underline"
                      >
                        Deselect all
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {selectedNotifications.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        selectedNotifications.forEach((id) => markAsRead(id));
                        setSelectedNotifications(new Set());
                      }}
                      className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-2"
                    >
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline">Mark read</span>
                      <span className="sm:hidden">Read</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deleteSelected}
                      className="flex items-center gap-1 text-error hover:text-error text-xs sm:text-sm px-2 sm:px-3 py-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                      <span className="sm:hidden">Del</span>
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedNotifications(new Set());
                  }}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-2"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-2 sm:space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const Icon = notification.icon;
            const isSelected = selectedNotifications.has(notification.id);
            
            return (
              <Card
                key={notification.id}
                className={`transition-all duration-200 ${
                  !notification.read
                    ? "border-primary-200 bg-primary-50/50 dark:bg-primary-900/10 dark:border-primary-800"
                    : ""
                } ${
                  isSelected 
                    ? "ring-2 ring-primary-500 border-primary-500" 
                    : "hover:shadow-md"
                } ${
                  bulkMode ? "cursor-default" : "cursor-pointer hover:shadow-lg"
                }`}
                onClick={() => {
                  if (bulkMode) {
                    toggleSelection(notification.id);
                  } else {
                    handleNotificationAction(notification);
                  }
                }}
              >
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-start gap-3">
                    {/* Selection and Icon */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      {(bulkMode || isSelected) && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelection(notification.id);
                          }}
                          className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-border rounded flex-shrink-0"
                        />
                      )}
                      <div
                        className={`p-2 sm:p-2.5 rounded-full ${notification.bgColor} flex-shrink-0`}
                      >
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${notification.color}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-2">
                        {/* Title and unread indicator */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <h3 className="font-semibold text-text-primary text-sm sm:text-base leading-tight flex-1">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></span>
                            )}
                          </div>
                          
                          {/* Action buttons */}
                          {!bulkMode && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-900/30 p-1.5 sm:p-2"
                                  title="Mark as read"
                                >
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-error hover:bg-red-100 dark:hover:bg-red-900/30 p-1.5 sm:p-2"
                                title="Delete notification"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Message */}
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-2 sm:line-clamp-none">
                          {notification.message}
                        </p>

                        {/* Meta info */}
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 text-xs text-text-secondary">
                          <span className="flex-shrink-0">{notification.time}</span>
                          <Badge 
                            variant="outline" 
                            className="text-xs w-fit px-2 py-0.5"
                          >
                            {notification.type}
                          </Badge>
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
            <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
              <Bell className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-text-secondary mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2">
                No notifications found
              </h3>
              <p className="text-sm sm:text-base text-text-secondary max-w-md mx-auto">
                {searchQuery || filter !== "all"
                  ? "Try adjusting your search or filters"
                  : "You're all caught up! New notifications will appear here."}
              </p>
              {(searchQuery || filter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                    setShowFilters(false);
                  }}
                  className="mt-4 text-sm"
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;