import { useState, useEffect } from 'react';
import Comment from './Comment';
import CommentForm from './CommentForm';
import { MessageCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { apiService } from '../../services/api';
import '../../styles/comment-animations.css';

const CommentList = ({ blogId, blogTitle }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [blogId]);

  // Helper function to calculate total comment count including replies
  const getTotalCommentCount = (comments) => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  const fetchComments = async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // Fetch comments from API with pagination
      const response = await apiService.get(`/blogs/${blogId}/comments?page=${pageNum}&limit=20`);

      // Handle different response structures
      const responseData = response.data?.data || response.data || {};
      const commentsData = responseData.comments || responseData || [];
      const pagination = responseData.pagination || {};

      // Organize comments with replies
      const rootComments = commentsData.filter(comment => !comment.parentId);
      const commentMap = rootComments.map(comment => ({
        ...comment,
        replies: commentsData.filter(reply => reply.parentId === comment._id)
      }));

      if (append) {
        setComments(prev => [...prev, ...commentMap]);
      } else {
        setComments(commentMap);
      }

      setHasMore(pagination.hasNext || false);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching comments:', error);
      // If API fails, show empty state instead of error for 404
      if (error.response?.status === 404) {
        setComments([]);
      } else {
        setError(error.response?.data?.message || 'Failed to load comments');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreComments = () => {
    if (!loadingMore && hasMore) {
      fetchComments(page + 1, true);
    }
  };

  const handleCommentAdded = (newComment) => {
    if (newComment.parentId) {
      // Add reply to existing comment
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment._id === newComment.parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newComment]
            };
          }
          return comment;
        })
      );
    } else {
      // Add new root comment with optimistic update
      const optimisticComment = {
        ...newComment,
        _id: newComment._id || `temp-${Date.now()}`,
        replies: []
      };
      setComments(prevComments => [optimisticComment, ...prevComments]);
      setShowCommentForm(false); // Close form after adding
    }
  };

  const handleCommentUpdated = (commentId, updates) => {
    setComments(prevComments =>
      prevComments.map(comment => {
        if (comment._id === commentId) {
          return { ...comment, ...updates };
        }
        // Check replies
        if (comment.replies) {
          comment.replies = comment.replies.map(reply => {
            if (reply._id === commentId) {
              return { ...reply, ...updates };
            }
            return reply;
          });
        }
        return comment;
      })
    );
  };

  const handleCommentDeleted = (commentId) => {
    setComments(prevComments =>
      prevComments.filter(comment => {
        if (comment._id === commentId) {
          return false;
        }
        // Check replies
        if (comment.replies) {
          comment.replies = comment.replies.filter(reply => reply._id !== commentId);
        }
        return true;
      })
    );
  };

  const handleReplyAdded = (parentId, newReply) => {
    setComments(prevComments =>
      prevComments.map(comment => {
        if (comment._id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          };
        }
        return comment;
      })
    );
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 animate-fadeSlideIn" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="w-10 h-10 rounded-full skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-24 rounded-xl skeleton" />
            <div className="flex gap-4">
              <div className="h-6 w-16 rounded skeleton" />
              <div className="h-6 w-16 rounded skeleton" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const totalCommentCount = getTotalCommentCount(comments);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
            <h3 className="text-lg font-semibold text-text-primary">
              Loading comments...
            </h3>
          </div>
        </div>
        <SkeletonLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-warning mx-auto mb-3" />
        <h4 className="text-lg font-medium text-text-primary mb-2">Oops! Something went wrong</h4>
        <p className="text-text-secondary mb-4">{error}</p>
        <button
          onClick={() => fetchComments()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg shadow-md">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">
            Comments ({totalCommentCount})
          </h3>
        </div>

        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg hover:scale-105"
        >
          {showCommentForm ? 'Cancel' : '+ Add Comment'}
        </button>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="mb-6 animate-fadeSlideIn">
          <CommentForm
            blogId={blogId}
            onCommentAdded={handleCommentAdded}
            placeholder={`Share your thoughts on "${blogTitle}"...`}
          />
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center animate-pulse">
            <MessageCircle className="w-10 h-10 text-primary-600" />
          </div>
          <h4 className="text-xl font-bold text-text-primary mb-2">No comments yet</h4>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Be the first to share your thoughts on this post!
          </p>
          <button
            onClick={() => setShowCommentForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Write a comment
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-6 comment-list">
            {comments.map((comment, index) => (
              <div key={comment._id} style={{ animationDelay: `${index * 0.1}s` }}>
                <Comment
                  comment={comment}
                  onCommentUpdated={handleCommentUpdated}
                  onCommentDeleted={handleCommentDeleted}
                  onReplyAdded={handleReplyAdded}
                />
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={loadMoreComments}
                disabled={loadingMore}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  'Load More Comments'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentList; 