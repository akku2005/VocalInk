import {
  Heart,
  MessageCircle,
  Users,
  Award,
  TrendingUp,
  BookOpen,
  Zap,
  Bell,
  User,
  Gift,
  Star,
} from "lucide-react";

/**
 * Get icon and color for notification type
 * @param {string} type - Notification type
 * @returns {Object} Icon component and color classes
 */
export const getNotificationStyle = (type) => {
  const styles = {
    like: {
      icon: Heart,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    comment: {
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    reply: {
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    follow: {
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    unfollow: {
      icon: Users,
      color: "text-gray-500",
      bgColor: "bg-gray-50",
    },
    badge_earned: {
      icon: Award,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    level_up: {
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    blog_published: {
      icon: BookOpen,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
    },
    blog_featured: {
      icon: Star,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    mention: {
      icon: User,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50",
    },
    system: {
      icon: Bell,
      color: "text-gray-500",
      bgColor: "bg-gray-50",
    },
    achievement: {
      icon: Gift,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
    },
    comment_liked: {
      icon: Heart,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    comment_replied: {
      icon: MessageCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
  };

  return styles[type] || styles.system;
};

/**
 * Format notification time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatNotificationTime = (date) => {
  const now = new Date();
  const notifDate = new Date(date);
  const seconds = Math.floor((now - notifDate) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
};

/**
 * Get action URL from notification data
 * @param {Object} notification - Notification object
 * @returns {string} Action URL
 */
export const getNotificationActionUrl = (notification) => {
  if (notification.data?.actionUrl) {
    return notification.data.actionUrl;
  }

  // Fallback URL generation based on type and data
  switch (notification.type) {
    case 'like':
    case 'comment':
    case 'blog_published':
    case 'blog_featured':
      return notification.data?.blogId ? `/article/${notification.data.blogId}` : null;
    
    case 'follow':
    case 'unfollow':
    case 'mention':
      return notification.data?.fromUserId ? `/profile/${notification.data.fromUserId}` : null;
    
    case 'badge_earned':
      return notification.data?.badgeId ? `/badges/${notification.data.badgeId}` : '/badges';
    
    case 'level_up':
    case 'achievement':
      return '/profile/me';
    
    default:
      return null;
  }
};

/**
 * Get readable notification type name
 * @param {string} type - Notification type
 * @returns {string} Readable type name
 */
export const getNotificationTypeName = (type) => {
  const names = {
    like: 'Likes',
    comment: 'Comments',
    reply: 'Replies',
    follow: 'Follows',
    unfollow: 'Unfollows',
    badge_earned: 'Badges',
    level_up: 'Level Ups',
    blog_published: 'Blog Posts',
    blog_featured: 'Featured',
    mention: 'Mentions',
    system: 'System',
    achievement: 'Achievements',
    comment_liked: 'Comment Likes',
    comment_replied: 'Comment Replies',
  };

  return names[type] || type;
};
