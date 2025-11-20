import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  MessageCircle,
  Heart,
  MoreHorizontal,
  Reply,
  Edit,
  Trash2,
  Flag,
  Clock,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import CommentForm from './CommentForm';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import '../../styles/comment-animations.css';

const Comment = ({ comment, onCommentUpdated, onCommentDeleted, onReplyAdded }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const isAuthor = user?.id === comment.userId?._id || user?.id === comment.userId?.id;
  const isLiked = comment.likedBy?.includes(user?.id);
  const hasReplies = comment.replies && comment.replies.length > 0;

  const formatDate = (date) => {
    if (!date) return 'Just now';

    const now = new Date();
    const commentDate = new Date(date);
    const diffInMs = now - commentDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;

    return commentDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: commentDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleLike = async () => {
    if (!isAuthenticated || isLiking) return;

    setIsLiking(true);
    setJustLiked(true);

    try {
      // Like/unlike comment via API
      const response = await apiService.post(`/blogs/comments/${comment._id}/like`);

      // Update with actual data from server
      const updatedComment = response.data?.data || response.data;
      onCommentUpdated(comment._id, {
        likes: updatedComment.likes,
        likedBy: updatedComment.likedBy,
        isLiked: updatedComment.likedBy?.includes(user?.id)
      });
    } catch (error) {
      console.error('Error liking comment:', error);
      addToast({
        type: 'error',
        message: 'Failed to like comment. Please try again.'
      });
    } finally {
      setIsLiking(false);
      setTimeout(() => setJustLiked(false), 500);
    }
  };

  const handleDelete = async () => {
    if (!isAuthor || isDeleting) return;

    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      // Delete comment via API
      await apiService.delete(`/blogs/comments/${comment._id}`);

      addToast({ type: 'success', message: 'Comment deleted successfully!' });
      onCommentDeleted(comment._id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      addToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to delete comment. Please try again.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReply = (newReply) => {
    setShowReplyForm(false);
    onReplyAdded(comment._id, newReply);
  };

  return (
    <div className="space-y-3 comment-card">
      <div className="flex gap-3">
        {/* Avatar with hover effect */}
        <div className="avatar-wrapper">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-400 to-primary-600 shadow-md">
            <span className="text-sm font-bold text-white">
              {comment.userId?.displayName?.[0] || comment.userId?.name?.[0] || 'U'}
            </span>
          </div>
        </div>

        {/* Comment Content */}
        <div className="flex-1 space-y-2">
          <div className="bg-gradient-to-br from-surface to-surface-alt border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary">
                  {comment.userId?.displayName || comment.userId?.name || 'Anonymous'}
                </span>
                {comment.isEdited && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">Edited</Badge>
                )}
                {comment.userId?.verified && (
                  <Badge variant="success" className="text-xs px-1.5 py-0.5">✓</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(comment.createdAt)}
                </span>

                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-1.5 hover:bg-surface/50 rounded-lg transition-all duration-200 hover:scale-110"
                  >
                    <MoreHorizontal className="w-4 h-4 text-text-secondary" />
                  </button>

                  {showActions && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-background border border-border rounded-lg shadow-xl z-10 overflow-hidden animate-fadeSlideIn">
                      {isAuthor ? (
                        <>
                          <button
                            onClick={() => setShowActions(false)}
                            className="w-full px-3 py-2.5 text-left text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-2 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full px-3 py-2.5 text-left text-sm text-error hover:bg-error/10 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowActions(false)}
                          className="w-full px-3 py-2.5 text-left text-sm text-warning hover:bg-warning/10 flex items-center gap-2 transition-colors"
                        >
                          <Flag className="w-4 h-4" />
                          Report
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="text-text-primary leading-relaxed">{comment.content}</p>

            {/* Inline Reference */}
            {comment.inlineRef && (
              <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 rounded-r-lg">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  <span className="font-semibold">Referenced text:</span> "{comment.inlineRef}"
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 text-sm px-1">
            <button
              onClick={handleLike}
              disabled={!isAuthenticated || isLiking}
              className={`flex items-center gap-1.5 transition-all duration-200 ${isLiked
                  ? 'text-error'
                  : 'text-text-secondary hover:text-error'
                } ${justLiked ? 'like-button-clicked' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{comment.likes || 0}</span>
            </button>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1.5 text-text-secondary hover:text-primary-500 transition-all duration-200 hover:scale-105"
            >
              <Reply className="w-4 h-4" />
              <span className="font-medium">Reply</span>
            </button>

            {/* Show/Hide Replies Toggle */}
            {hasReplies && (
              <button
                onClick={() => setShowAllReplies(!showAllReplies)}
                className="flex items-center gap-1.5 text-text-secondary hover:text-primary-500 transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">
                  {showAllReplies ? 'Hide' : `${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                </span>
                {showAllReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="ml-4 pt-2 animate-fadeSlideIn">
              <CommentForm
                blogId={comment.blogId}
                parentId={comment._id}
                onCommentAdded={handleReply}
                placeholder={`Reply to ${comment.userId?.displayName || comment.userId?.name}...`}
              />
            </div>
          )}

          {/* Replies - Show first reply inline, rest on click */}
          {hasReplies && (
            <div className="ml-4 space-y-3 border-l-2 border-primary-200 dark:border-primary-800 pl-4 mt-2">
              {/* Always show first reply */}
              <Comment
                key={comment.replies[0]._id}
                comment={comment.replies[0]}
                onCommentUpdated={onCommentUpdated}
                onCommentDeleted={onCommentDeleted}
                onReplyAdded={onReplyAdded}
              />

              {/* Show remaining replies when expanded */}
              {showAllReplies && comment.replies.length > 1 && (
                <div className="space-y-3 animate-fadeSlideIn">
                  {comment.replies.slice(1).map((reply) => (
                    <Comment
                      key={reply._id}
                      comment={reply}
                      onCommentUpdated={onCommentUpdated}
                      onCommentDeleted={onCommentDeleted}
                      onReplyAdded={onReplyAdded}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment; 