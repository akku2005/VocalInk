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
  User
} from 'lucide-react';
import CommentForm from './CommentForm';

const Comment = ({ comment, onCommentUpdated, onCommentDeleted, onReplyAdded }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const isAuthor = user?.id === comment.userId?._id || user?.id === comment.userId?.id;
  const isLiked = comment.likedBy?.includes(user?.id);

  const formatDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInHours = Math.floor((now - commentDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return commentDate.toLocaleDateString();
  };

  const handleLike = async () => {
    if (!isAuthenticated || isLiking) return;
    
    setIsLiking(true);
    try {
      // For development, simulate like action
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const updatedLikes = isLiked ? comment.likes - 1 : comment.likes + 1;
      onCommentUpdated(comment._id, { 
        likes: updatedLikes,
        isLiked: !isLiked 
      });
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthor || isDeleting) return;
    
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    setIsDeleting(true);
    try {
      // For development, simulate delete action
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onCommentDeleted(comment._id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReply = (newReply) => {
    setShowReplyForm(false);
    onReplyAdded(comment._id, newReply);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary-600">
            {comment.userId?.displayName?.[0] || comment.userId?.name?.[0] || 'U'}
          </span>
        </div>

        {/* Comment Content */}
        <div className="flex-1 space-y-2">
          <div className="bg-surface border border-border rounded-lg p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">
                  {comment.userId?.displayName || comment.userId?.name || 'Anonymous'}
                </span>
                {comment.isEdited && (
                  <Badge variant="outline" className="text-xs">Edited</Badge>
                )}
                {comment.userId?.verified && (
                  <Badge variant="success" className="text-xs">✓</Badge>
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
                    className="p-1 hover:bg-surface rounded transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4 text-text-secondary" />
                  </button>
                  
                  {showActions && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-background border border-border rounded-lg shadow-lg z-10">
                      {isAuthor ? (
                        <>
                          <button
                            onClick={() => setShowActions(false)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full px-3 py-2 text-left text-sm text-error hover:bg-error/10 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowActions(false)}
                          className="w-full px-3 py-2 text-left text-sm text-warning hover:bg-warning/10 flex items-center gap-2"
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
              <div className="mt-2 p-2 bg-primary-50 border-l-4 border-primary-500 rounded">
                <p className="text-sm text-primary-700">
                  <span className="font-medium">Referenced text:</span> "{comment.inlineRef}"
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={handleLike}
              disabled={!isAuthenticated || isLiking}
              className={`flex items-center gap-1 transition-colors ${
                isLiked 
                  ? 'text-error' 
                  : 'text-text-secondary hover:text-error'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likes || 0}</span>
            </button>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-text-secondary hover:text-primary-500 transition-colors"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>

            {/* Show/Hide Replies Toggle */}
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-text-secondary hover:text-primary-500 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {showReplies ? 'Hide' : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="ml-8">
              <CommentForm
                blogId={comment.blogId}
                parentId={comment._id}
                onCommentAdded={handleReply}
                placeholder={`Reply to ${comment.userId?.displayName || comment.userId?.name}...`}
              />
            </div>
          )}

          {/* Replies - Hidden by default, shown when clicked */}
          {comment.replies && comment.replies.length > 0 && showReplies && (
            <div className="ml-8 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
              {comment.replies.map((reply) => (
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
      </div>
    </div>
  );
};

export default Comment; 