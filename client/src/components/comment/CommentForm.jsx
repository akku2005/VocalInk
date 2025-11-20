import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Send, Smile, User, Lock, Sparkles } from 'lucide-react';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import '../../styles/comment-animations.css';

const CommentForm = ({ blogId, parentId = null, onCommentAdded, placeholder = "Write a comment..." }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleSignIn = () => {
    navigate('/login', {
      state: {
        from: location.pathname,
        message: 'Please sign in to leave a comment'
      }
    });
  };

  const handleSignUp = () => {
    navigate('/register', {
      state: {
        from: location.pathname,
        message: 'Please create an account to leave a comment'
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      // Submit comment to API
      const payload = {
        content: content.trim(),
        parentId: parentId || null
      };

      const response = await apiService.post(`/blogs/${blogId}/comments`, payload);

      // Handle different response structures
      const newComment = response.data?.data || response.data;

      setContent('');
      addToast({ type: 'success', message: 'Comment posted successfully!' });

      if (onCommentAdded && newComment) {
        onCommentAdded(newComment);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      addToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to post comment. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = content.length;
  const isNearLimit = charCount > 800;
  const isOverLimit = charCount > 1000;

  if (!isAuthenticated) {
    return (
      <div className="p-8 rounded-2xl border-2 border-dashed border-border text-center bg-gradient-to-br from-surface to-surface-alt">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
        </div>
        <h4 className="text-xl font-bold text-text-primary mb-2">
          Join the conversation!
        </h4>
        <p className="text-text-secondary mb-6">
          Please sign in to leave a comment and join the discussion.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleSignIn}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
          >
            <User className="w-4 h-4" />
            Sign In
          </Button>
          <Button
            onClick={handleSignUp}
            variant="outline"
            className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="avatar-wrapper">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary-400 to-primary-600 shadow-md">
            <span className="text-sm font-bold text-white">
              {user?.displayName?.[0] || user?.name?.[0] || 'U'}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className={`relative rounded-xl border-2 transition-all duration-300 ${isFocused
              ? 'border-primary-500 shadow-lg shadow-primary-500/20'
              : 'border-border hover:border-primary-300'
            }`}>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-surface rounded-xl resize-none focus:outline-none text-text-primary placeholder-text-secondary comment-textarea"
              maxLength={1000}
              rows={1}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <button
                type="button"
                className="p-2 hover:bg-surface rounded-lg transition-all duration-200 hover:scale-110"
                title="Add emoji"
              >
                <Smile className="w-4 h-4 text-text-secondary" />
              </button>
              <span className={`font-medium transition-colors ${isOverLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-text-secondary'
                }`}>
                {charCount}/1000
              </span>
            </div>

            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting || isOverLimit}
              loading={isSubmitting}
              size="sm"
              className={`flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md transition-all duration-200 ${content.trim() && !isOverLimit ? 'send-button-active hover:scale-105' : ''
                }`}
            >
              {!isSubmitting && <Send className="w-4 h-4" />}
              {parentId ? 'Reply' : 'Comment'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm; 