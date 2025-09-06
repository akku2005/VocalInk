import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Send, Smile, User, Lock } from 'lucide-react';

const CommentForm = ({ blogId, parentId = null, onCommentAdded, placeholder = "Write a comment..." }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      // For development, create a mock comment response
      const mockComment = {
        _id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        blogId,
        userId: {
          _id: user?.id || 1,
          name: user?.name || 'Demo User',
          avatar: null
        },
        content: content.trim(),
        parentId: parentId || null,
        status: 'active',
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setContent('');
      onCommentAdded(mockComment);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 glassmorphism-card text-center theme-transition">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)' }}>
            <MessageCircle className="w-6 h-6" style={{ color: 'rgb(var(--color-primary))' }} />
          </div>
        </div>
        <h4 className="text-lg font-medium text-text-primary mb-2">
          Join the conversation!
        </h4>
        <p className="text-text-secondary mb-4">
          Please sign in to leave a comment and join the discussion.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleSignIn}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Sign In
          </Button>
          <Button
            onClick={handleSignUp}
            variant="outline"
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
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary-600">
            {user?.displayName?.[0] || user?.name?.[0] || 'U'}
          </span>
        </div>
        
        <div className="flex-1 space-y-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[80px] resize-none"
            multiline
            maxLength={1000}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <button
                type="button"
                className="p-1 hover:bg-surface rounded transition-colors"
                title="Add emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
              <span>{content.length}/1000</span>
            </div>
            
            <Button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              loading={isSubmitting}
              size="sm"
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {parentId ? 'Reply' : 'Comment'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm; 