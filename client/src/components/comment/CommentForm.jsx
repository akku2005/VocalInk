import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { MessageCircle, Send, Smile } from 'lucide-react';

const CommentForm = ({ blogId, parentId = null, onCommentAdded, placeholder = "Write a comment..." }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();

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
      <div className="p-4 bg-surface border border-border rounded-lg text-center">
        <MessageCircle className="w-8 h-8 text-text-secondary mx-auto mb-2" />
        <p className="text-text-secondary mb-3">Please sign in to leave a comment</p>
        <Button variant="outline" size="sm">
          Sign In
        </Button>
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