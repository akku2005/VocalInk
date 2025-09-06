import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { Heart, Bookmark, Share2, MessageCircle } from "lucide-react";
import LoginPromptModal from "../auth/LoginPromptModal";

const EngagementButtons = ({
  blogId,
  initialLikes = 0,
  initialBookmarks = 0,
  initialComments = 0,
  isLiked = false,
  isBookmarked = false,
  onEngagementUpdate,
  onCommentClick,
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
    try {
      // For now, simulate the API call
      console.log("Liking blog:", blogId);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newIsLiked = !isLikedState;
      setIsLikedState(newIsLiked);
      setLikes((prev) => (newIsLiked ? prev + 1 : prev - 1));

      if (onEngagementUpdate) {
        onEngagementUpdate("likes", newIsLiked);
      }

      showSuccess(newIsLiked ? "Post liked!" : "Post unliked!");
      console.log("Like successful:", newIsLiked);
    } catch (error) {
      showError("Failed to like post. Please try again.");
      console.error("Error liking blog:", error);
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
    try {
      // For now, simulate the API call
      console.log("Bookmarking blog:", blogId);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newIsBookmarked = !isBookmarkedState;
      setIsBookmarkedState(newIsBookmarked);
      setBookmarks((prev) => (newIsBookmarked ? prev + 1 : prev - 1));

      if (onEngagementUpdate) {
        onEngagementUpdate("bookmarks", newIsBookmarked);
      }

      showSuccess(
        newIsBookmarked ? "Post bookmarked!" : "Post removed from bookmarks!"
      );
      console.log("Bookmark successful:", newIsBookmarked);
    } catch (error) {
      showError("Failed to bookmark post. Please try again.");
      console.error("Error bookmarking blog:", error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = document.title;

    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        // Use LinkedIn's feed share URL which works better
        shareUrl = `https://www.linkedin.com/feed/?shareActive=true&shareUrl=${encodeURIComponent(url)}`;
        break;
      case "copy":
        try {
          await navigator.clipboard.writeText(url);
          showSuccess("Link copied to clipboard!");
          console.log("URL copied to clipboard");
          setShowShareMenu(false);
          return;
        } catch (error) {
          showError("Failed to copy link to clipboard");
          console.error("Failed to copy URL:", error);
        }
        break;
      default:
        return;
    }

    if (shareUrl) {
      try {
        // Try to open in new tab first
        const newWindow = window.open(
          shareUrl,
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
    <div className="flex items-center justify-center gap-2.5 pl-1">
      {/* Like Button */}
      <button
        onClick={handleLike}
        className={`flex items-center  gap-2  py-2 rounded-lg transition-all duration-200 cursor-pointer ${
          isLikedState
            ? "bg-error/10"
            : "hover:bg-error/10"
        }`}
        style={{ 
          color: isLikedState ? 'rgb(var(--color-error))' : 'var(--text-color)',
          backgroundColor: isLikedState ? 'rgba(var(--color-error), 0.1)' : 'transparent'
        }}
        title={isAuthenticated ? "Like this post" : "Sign in to like"}
      >
        <Heart className={`w-4 h-4 ${isLikedState ? "fill-current" : ""}`} />
        <span className="font-normal text-xs">{likes}</span>
      </button>

      {/* Comment Button */}
      <button
        onClick={handleComment}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-all duration-200 cursor-pointer"
        style={{ color: 'var(--text-color)' }}
        title="View comments"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium text-xs">{comments}</span>
      </button>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
          isBookmarkedState
            ? "bg-primary/10"
            : "hover:bg-primary/10"
        }`}
        style={{ 
          color: isBookmarkedState ? 'rgb(var(--color-primary))' : 'var(--text-color)',
          backgroundColor: isBookmarkedState ? 'rgba(var(--color-primary), 0.1)' : 'transparent'
        }}
        title={isAuthenticated ? "Bookmark this post" : "Sign in to bookmark"}
      >
        <Bookmark
          className={`w-4 h-4 flex flex-col ${isBookmarkedState ? "fill-current" : ""}`}
        />
        <span className="font-medium text-xs">{bookmarks}</span>
      </button>

      {/* Share Button */}
      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 transition-all duration-200 cursor-pointer"
          style={{ color: 'var(--text-color)' }}
          title="Share this post"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
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
          {console.log('Modal should be visible, action:', loginAction)}
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
