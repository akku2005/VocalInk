import { useState } from "react";
import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react";
import LoginPromptModal from "../auth/LoginPromptModal";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import blogService from "../../services/blogService";
import { buildAbsoluteUrl } from "../../utils/siteUrl";

const EngagementButtons = ({
  blogId,
  initialLikes = 0,
  initialBookmarks = 0,
  initialComments = 0,
  isLiked = false,
  isBookmarked = false,
  onEngagementUpdate,
  onCommentClick,
  compact = false,
  // Share metadata
  shareTitle,
  shareDescription,
  shareImage,
  shareUrl,
  shareContent,
}) => {
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [comments] = useState(initialComments);
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [isBookmarkedState, setIsBookmarkedState] = useState(isBookmarked);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAction, setLoginAction] = useState('interact');

  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();

  const handleLike = async () => {
    if (!isAuthenticated) {
      setLoginAction('like');
      setShowLoginModal(true);
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    const previousState = isLikedState;
    const previousLikes = likes;
    try {
      const optimisticLiked = !isLikedState;
      setIsLikedState(optimisticLiked);
      setLikes((prev) => (optimisticLiked ? prev + 1 : Math.max(prev - 1, 0)));

      const result = await blogService.likeBlog(blogId);

      setIsLikedState(result.liked);
      setLikes(result.likes ?? 0);

      if (onEngagementUpdate) {
        onEngagementUpdate("likes", {
          active: result.liked,
          count: result.likes ?? 0,
        });
      }

      showSuccess(result.liked ? "Post liked!" : "Post unliked!");
    } catch (error) {
      setIsLikedState(previousState);
      setLikes(previousLikes);
      showError(error.response?.data?.message || "Failed to like post. Please try again.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    // Always show comments, regardless of authentication status
    if (onCommentClick) {
      onCommentClick();
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setLoginAction('bookmark');
      setShowLoginModal(true);
      return;
    }

    if (isBookmarking) return;

    setIsBookmarking(true);
    const previousState = isBookmarkedState;
    const previousBookmarks = bookmarks;
    try {
      const optimisticBookmarked = !isBookmarkedState;
      setIsBookmarkedState(optimisticBookmarked);
      setBookmarks((prev) => (optimisticBookmarked ? prev + 1 : Math.max(prev - 1, 0)));

      const result = await blogService.bookmarkBlog(blogId);

      setIsBookmarkedState(result.bookmarked);
      setBookmarks(result.bookmarks ?? 0);

      if (onEngagementUpdate) {
        onEngagementUpdate("bookmarks", {
          active: result.bookmarked,
          count: result.bookmarks ?? 0,
        });
      }

      showSuccess(
        result.bookmarked ? "Post bookmarked!" : "Post removed from bookmarks!"
      );
    } catch (error) {
      setIsBookmarkedState(previousState);
      setBookmarks(previousBookmarks);
      showError(error.response?.data?.message || "Failed to bookmark post. Please try again.");
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async (platform) => {
    // Use provided share data or fallback to current page
    const url = buildAbsoluteUrl(
      shareUrl ||
      (typeof window !== 'undefined' ? window.location.pathname : '/')
    );
    const title = shareTitle || (typeof document !== 'undefined' ? document.title : '');
    const description = shareDescription || '';
    const image = shareImage || '';

    let shareMessage = '';
    let shareLink = '';

    switch (platform) {
      case "twitter":
        // Twitter: Use title + URL (Twitter will fetch meta tags for preview)
        shareMessage = `${encodeURIComponent(title)}\n\n${encodeURIComponent(url)}`;
        shareLink = `https://twitter.com/intent/tweet?text=${shareMessage}`;
        break;
      case "facebook":
        // Facebook: Simple URL share (Facebook reads OG tags)
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        // LinkedIn: Use feed endpoint to allow pre-filling text (works better for localhost/no-scrape)
        // Include title, content (or description), and URL
        {
          const textParts = [title];

          if (shareContent) {
            // Truncate content to avoid URL length limits (keep it safe around 2000 chars)
            const maxLen = 2000;
            const content = shareContent.length > maxLen
              ? shareContent.substring(0, maxLen) + '...'
              : shareContent;
            textParts.push(content);
          } else if (description) {
            textParts.push(description);
          }

          textParts.push(url);
          shareLink = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(textParts.join('\n\n'))}`;
        }
        break;
      case "copy":
        try {
          await navigator.clipboard.writeText(url);
          showSuccess("Link copied to clipboard!");
          setShowShareMenu(false);
          return;
        } catch (error) {
          showError("Failed to copy link to clipboard");
        }
        break;
      default:
        return;
    }

    if (shareLink) {
      try {
        // Try to open in new tab first
        const newWindow = window.open(
          shareLink,
          "_blank",
          "noopener,noreferrer"
        );

        // Check if popup was blocked
        if (
          !newWindow ||
          newWindow.closed ||
          typeof newWindow.closed === "undefined"
        ) {
          // If popup is blocked, show a more helpful message
          showError(
            "Popup blocked! Please allow popups or use the copy link option."
          );
        } else {
          showSuccess("Share window opened in new tab!");
        }
      } catch (error) {
        console.error("Error opening share window:", error);
        showError(
          "Failed to open share window. Please try copying the link instead."
        );
      }
    }

    setShowShareMenu(false);
  };

  const shareOptions = [
    { name: "Twitter", platform: "twitter", icon: "🐦" },
    { name: "Facebook", platform: "facebook", icon: "📘" },
    { name: "LinkedIn", platform: "linkedin", icon: "💼" },
    { name: "Copy Link", platform: "copy", icon: "📋" },
  ];

  return (
    <div className={`flex items-center justify-center ${compact ? 'gap-1' : 'gap-2.5'} pl-1`}>
      {/* Like Button */}
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'py-2'} rounded-lg transition-all duration-200 cursor-pointer ${isLikedState
          ? "bg-error/10"
          : "hover:bg-error/10"
          }`}
        style={{
          color: isLikedState ? 'rgb(var(--color-error))' : 'var(--text-color)',
          backgroundColor: isLikedState ? 'rgba(var(--color-error), 0.1)' : 'transparent'
        }}
        aria-label={isLikedState ? `Unlike this post (${likes} likes)` : `Like this post (${likes} likes)`}
        title={isAuthenticated ? "Like this post" : "Sign in to like"}
      >
        <Heart className={`w-4 h-4 ${isLikedState ? "fill-current" : ""}`} />
        <span className="font-normal text-xs" aria-hidden="true">{likes}</span>
      </button>

      {/* Comment Button */}
      <button
        onClick={handleComment}
        className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-3 py-2'} rounded-lg hover:bg-primary/10 transition-all duration-200 cursor-pointer`}
        style={{ color: 'var(--text-color)' }}
        aria-label={`View comments (${comments} comments)`}
        title="View comments"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium text-xs" aria-hidden="true">{comments}</span>
      </button>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-3 py-2'} rounded-lg transition-all duration-200 cursor-pointer ${isBookmarkedState
          ? "bg-primary/10"
          : "hover:bg-primary/10"
          }`}
        style={{
          color: isBookmarkedState ? 'rgb(var(--color-primary))' : 'var(--text-color)',
          backgroundColor: isBookmarkedState ? 'rgba(var(--color-primary), 0.1)' : 'transparent'
        }}
        aria-label={isBookmarkedState ? `Remove bookmark (${bookmarks} bookmarks)` : `Bookmark this post (${bookmarks} bookmarks)`}
        title={isAuthenticated ? "Bookmark this post" : "Sign in to bookmark"}
      >
        <Bookmark
          className={`w-4 h-4 flex flex-col ${isBookmarkedState ? "fill-current" : ""}`}
        />
        <span className="font-medium text-xs" aria-hidden="true">{bookmarks}</span>
      </button>

      {/* Share Button */}
      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-3 py-2'} rounded-lg hover:bg-accent/10 transition-all duration-200 cursor-pointer`}
          aria-label="Share this post"
          aria-haspopup="menu"
          aria-expanded={showShareMenu ? "true" : "false"}
          style={{ color: 'var(--text-color)' }}
          title="Share this post"
        >
          <Share2 className="w-4 h-4" />
          {!compact && <span className="text-sm">Share</span>}
        </button>

        {/* Share Menu */}
        {showShareMenu && (
          <div className="absolute bottom-full right-0 mb-1 w-40 backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
            {/* Glassmorphism backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 dark:from-black/5 dark:to-black/10"></div>

            {/* Content */}
            <div className="relative py-1">
              {shareOptions.map((option) => (
                <button
                  key={option.platform}
                  onClick={() => handleShare(option.platform)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-text-primary hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 group "
                >
                  <span className="text-base group-hover:scale-105 transition-transform duration-200">
                    {option.icon}
                  </span>
                  <span className="font-medium text-xs">{option.name}</span>
                </button>
              ))}
            </div>

            {/* Subtle border glow */}
            <div className="absolute inset-0 rounded-lg border border-white/30 dark:border-white/20 pointer-events-none"></div>
          </div>
        )}
      </div>

      {/* Authentication Prompt - Make it clickable */}
      {!isAuthenticated && (
        <button
          onClick={() => {
            setLoginAction('interact');
            setShowLoginModal(true);
          }}
          className="text-xs cursor-pointer transition-colors hover:underline"
          style={{ color: 'var(--text-color)' }}
          onMouseEnter={(e) => e.target.style.color = 'rgb(var(--color-primary))'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-color)'}
          title="Click to sign in"
        >
          Sign in to engage
        </button>
      )}

      {/* Login Prompt Modal */}
      {showLoginModal && (
        <div>
          <LoginPromptModal
            action={loginAction}
            onClose={() => setShowLoginModal(false)}
            onSuccess={() => {
              setShowLoginModal(false);
              if (loginAction === 'like') {
                handleLike();
              } else if (loginAction === 'comment') {
                handleComment();
              } else if (loginAction === 'bookmark') {
                handleBookmark();
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EngagementButtons;
