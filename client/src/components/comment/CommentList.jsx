import { useState, useEffect } from 'react';
import Comment from './Comment';
import CommentForm from './CommentForm';
import { MessageCircle, Loader2, AlertCircle } from 'lucide-react';

const CommentList = ({ blogId, blogTitle }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [blogId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      
      // For development, use mock comments
      const mockComments = [
        {
          _id: 'comment_1',
          blogId,
          userId: {
            _id: 1,
            name: 'John Doe',
            avatar: null
          },
          content: 'This is a great article! Really enjoyed reading it.',
          parentId: null,
          status: 'active',
          likes: 5,
          likedBy: [],
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          replies: [
            {
              _id: 'comment_2',
              blogId,
              userId: {
                _id: 2,
                name: 'Jane Smith',
                avatar: null
              },
              content: 'I agree! The insights are very valuable.',
              parentId: 'comment_1',
              status: 'active',
              likes: 2,
              likedBy: [],
              createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
              updatedAt: new Date(Date.now() - 43200000).toISOString()
            }
          ]
        },
        {
          _id: 'comment_3',
          blogId,
          userId: {
            _id: 3,
            name: 'Mike Johnson',
            avatar: null
          },
          content: 'Interesting perspective on remote work. Looking forward to more content like this.',
          parentId: null,
          status: 'active',
          likes: 3,
          likedBy: [],
          createdAt: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
          updatedAt: new Date(Date.now() - 21600000).toISOString()
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setComments(mockComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
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
      // Add new root comment
      setComments(prevComments => [newComment, ...prevComments]);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="ml-2 text-text-secondary">Loading comments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-center">
        <AlertCircle className="w-8 h-8 text-warning mx-auto mb-2" />
        <p className="text-text-secondary">{error}</p>
        <button
          onClick={fetchComments}
          className="mt-2 text-primary-500 hover:text-primary-600 underline"
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
          <MessageCircle className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-text-primary">
            Comments ({comments.length})
          </h3>
        </div>
        
        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="text-sm text-primary-500 hover:text-primary-600 font-medium"
        >
          {showCommentForm ? 'Cancel' : 'Add Comment'}
        </button>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="mb-6">
          <CommentForm
            blogId={blogId}
            onCommentAdded={handleCommentAdded}
            placeholder={`Share your thoughts on "${blogTitle}"...`}
          />
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-text-secondary mx-auto mb-3" />
          <h4 className="text-lg font-medium text-text-primary mb-2">No comments yet</h4>
          <p className="text-text-secondary mb-4">
            Be the first to share your thoughts on this post!
          </p>
          <button
            onClick={() => setShowCommentForm(true)}
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Write a comment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <Comment
              key={comment._id}
              comment={comment}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentList; 