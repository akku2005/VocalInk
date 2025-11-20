import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../components/context/NotificationContext";
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
  Settings,
  Check,
  Trash2,
  Filter,
  Search,
  X,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import notificationService from "../services/notificationService";
import {
  getNotificationStyle,
  formatNotificationTime,
  getNotificationActionUrl,
  getNotificationTypeName,
} from "../utils/notificationHelpers";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { updateUnreadCount } = useNotification();
  
  // State management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  
  // Type counts from backend
  const [typeCounts, setTypeCounts] = useState({});
  
  const ITEMS_PER_PAGE = 20;

  // Fetch notifications
  const fetchNotifications = async (page = 1, type = filter) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: ITEMS_PER_PAGE,
      };

      if (type !== "all") {
        params.type = type;
      }

      const response = await notificationService.getNotifications(params);

      if (response.success) {
        setNotifications(response.data.notifications);
        
        // Update pagination data
        const pagination = response.data.pagination;
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalNotifications(pagination.totalNotifications);
        setUnreadCount(pagination.unreadCount);
        setHasNext(pagination.hasNext);
        setHasPrev(pagination.hasPrev);
        
        // Update type counts from backend
        if (response.data.typeCounts) {
          setTypeCounts(response.data.typeCounts);
        }
        
        // Sync navbar unread count
        updateUnreadCount(pagination.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications(1, filter);
  }, [filter]);

  // Build notification types with counts from backend
  // typeCounts always contains counts for ALL notification types
  // totalNotifications is the count for the current filter
  const notificationTypes = [
    { id: "all", name: "All", count: typeCounts.all || Object.values(typeCounts).reduce((a, b) => a + b, 0) },
    { id: "like", name: getNotificationTypeName("like"), count: typeCounts.like || 0 },
    { id: "comment", name: getNotificationTypeName("comment"), count: typeCounts.comment || 0 },
    { id: "follow", name: getNotificationTypeName("follow"), count: typeCounts.follow || 0 },
    { id: "badge_earned", name: getNotificationTypeName("badge_earned"), count: typeCounts.badge_earned || 0 },
    { id: "level_up", name: getNotificationTypeName("level_up"), count: typeCounts.level_up || 0 },
    { id: "system", name: getNotificationTypeName("system"), count: typeCounts.system || 0 },
  ];

  // Filter notifications by search query (client-side)
  const filteredNotifications = notifications.filter((notification) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      notification.title?.toLowerCase().includes(searchLower) ||
      notification.content?.toLowerCase().includes(searchLower)
    );
  });

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Find the notification to check if it's unread
      const notification = notifications.find(n => n._id === notificationId);
      const wasUnread = notification && !notification.read;
      
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      
      // Update unread count only if it was unread
      if (wasUnread) {
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        // Sync navbar unread count
        updateUnreadCount(newCount);
      }
      
      // Refresh data to ensure consistency
      setTimeout(() => {
        fetchNotifications(currentPage, filter);
      }, 300);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      
      // Sync navbar unread count immediately
      updateUnreadCount(0);
      
      // Refresh data to ensure consistency
      setTimeout(() => {
        fetchNotifications(1, filter);
      }, 300);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      // Find the notification to check if it's unread
      const notification = notifications.find(n => n._id === notificationId);
      const wasUnread = notification && !notification.read;
      
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setTotalNotifications(prev => Math.max(0, prev - 1));
      
      // Update unread count if it was unread
      if (wasUnread) {
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        // Sync navbar unread count
        updateUnreadCount(newCount);
      }
      
      // Remove from selection
      const newSelected = new Set(selectedNotifications);
      newSelected.delete(notificationId);
      setSelectedNotifications(newSelected);
      
      // Refresh data to ensure consistency
      setTimeout(() => {
        fetchNotifications(currentPage, filter);
      }, 300);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Delete selected notifications
  const deleteSelected = async () => {
    try {
      const idsToDelete = Array.from(selectedNotifications);
      
      // Count unread notifications being deleted
      const unreadDeleted = notifications.filter(
        n => selectedNotifications.has(n._id) && !n.read
      ).length;
      
      // Delete each notification
      await Promise.all(
        idsToDelete.map(id => notificationService.deleteNotification(id))
      );
      
      // Update local state
      setNotifications((prev) =>
        prev.filter((n) => !selectedNotifications.has(n._id))
      );
      setTotalNotifications(prev => Math.max(0, prev - idsToDelete.length));
      
      // Update unread count
      if (unreadDeleted > 0) {
        const newCount = Math.max(0, unreadCount - unreadDeleted);
        setUnreadCount(newCount);
        // Sync navbar unread count
        updateUnreadCount(newCount);
      }
      
      setSelectedNotifications(new Set());
      setBulkMode(false);
      
      // Refresh data to ensure consistency
      setTimeout(() => {
        fetchNotifications(currentPage, filter);
      }, 300);
    } catch (err) {
      console.error('Error deleting notifications:', err);
    }
  };

  // Mark selected as read
  const markSelectedAsRead = async () => {
    try {
      const idsToMark = Array.from(selectedNotifications);
      
      // Mark each as read
      await Promise.all(
        idsToMark.map(id => notificationService.markAsRead(id))
      );
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => 
          selectedNotifications.has(n._id) 
            ? { ...n, read: true, readAt: new Date().toISOString() } 
            : n
        )
      );
      
      // Update unread count
      const unreadSelected = notifications.filter(
        n => selectedNotifications.has(n._id) && n.read === false
      ).length;
      const newCount = Math.max(0, unreadCount - unreadSelected);
      setUnreadCount(newCount);
      // Sync navbar unread count immediately
      updateUnreadCount(newCount);
      
      setSelectedNotifications(new Set());
      
      // Refresh data to ensure consistency
      setTimeout(() => {
        fetchNotifications(currentPage, filter);
      }, 300);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  // Toggle selection
  const toggleSelection = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  // Select all visible
  const selectAll = () => {
    const allIds = new Set(filteredNotifications.map((n) => n._id));
    setSelectedNotifications(allIds);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedNotifications(new Set());
  };

  // Handle notification click
  const handleNotificationAction = (notification) => {
    if (bulkMode) return;

    // Mark as read
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate to action URL
    const actionUrl = getNotificationActionUrl(notification);
    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchNotifications(page, filter);
    }
  };

  // Loading state
  if (loading && notifications.length === 0) {
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

  // Error state
  if (error && notifications.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Failed to Load Notifications
            </h3>
            <p className="text-text-secondary mb-4">{error}</p>
            <Button onClick={() => fetchNotifications(1, filter)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
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
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (bulkMode) {
                  // If already in bulk mode, toggle select all
                  if (selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0) {
                    deselectAll();
                  } else {
                    selectAll();
                  }
                } else {
                  // Enter bulk mode and select all
                  setBulkMode(true);
                  selectAll();
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm ${
                bulkMode ? "bg-primary-100 text-primary-700" : ""
              }`}
              title={bulkMode && selectedNotifications.size === filteredNotifications.length ? "Deselect all" : "Select all"}
            >
              {bulkMode && selectedNotifications.size === filteredNotifications.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {bulkMode && selectedNotifications.size > 0 
                  ? `${selectedNotifications.size} selected` 
                  : "Select"}
              </span>
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <Check className="w-4 h-4" />
              Mark all as read
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-xs sm:text-sm sm:hidden"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>


          <Button
            variant="outline"
            onClick={() => navigate('/settings/notifications')}
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden xs:inline">Settings</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className={`${showFilters ? "block" : "hidden sm:block"}`}>
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
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg text-sm sm:text-base border border-border-color focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-background text-text-primary"
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

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              <Filter className="w-4 h-4 text-text-secondary flex-shrink-0" />
              <div className="flex gap-1 sm:gap-2 min-w-max">
                {notificationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setFilter(type.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      filter === type.id
                        ? "bg-primary-500 text-white shadow-sm"
                        : "bg-surface hover:bg-surface-hover text-text-secondary"
                    }`}
                  >
                    {type.name} ({type.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile close button */}
            <div className="sm:hidden flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
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
                {selectedNotifications.size} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markSelectedAsRead}
                  className="flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Mark as read
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelected}
                  className="flex items-center gap-1 text-red-500 hover:text-red-600"
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
      <div className="space-y-2 sm:space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const style = getNotificationStyle(notification.type);
            const Icon = style.icon;
            const isSelected = selectedNotifications.has(notification._id);

            return (
              <Card
                key={notification._id}
                className={`transition-all duration-200 ${
                  !notification.read
                    ? "border-primary-200 bg-primary-50/50"
                    : ""
                } ${
                  isSelected
                    ? "ring-2 ring-primary-500 border-primary-500"
                    : "hover:shadow-md"
                } ${
                  bulkMode ? "cursor-default" : "cursor-pointer"
                }`}
                onClick={() => {
                  if (bulkMode) {
                    toggleSelection(notification._id);
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
                            toggleSelection(notification._id);
                          }}
                          className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-border rounded"
                        />
                      )}
                      <div className={`p-2 sm:p-2.5 rounded-full ${style.bgColor}`}>
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${style.color}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary mb-1">
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 inline-block w-2 h-2 bg-primary-500 rounded-full"></span>
                            )}
                          </h3>
                          <p className="text-sm text-text-secondary mb-2 leading-relaxed">
                            {notification.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-text-secondary">
                            <span>{formatNotificationTime(notification.createdAt)}</span>
                            <Badge variant="outline" className="text-xs">
                              {getNotificationTypeName(notification.type)}
                            </Badge>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="text-primary-500"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="text-red-500 hover:text-red-600"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                Page {currentPage} of {totalPages} ({totalNotifications} total)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPrev || loading}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNext || loading}
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading overlay for page changes */}
      {loading && notifications.length > 0 && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
