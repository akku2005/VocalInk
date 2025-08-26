import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import EngagementButtons from '../engagement/EngagementButtons';
import { Calendar, Clock, User, Bookmark } from 'lucide-react';

const BlogCard = ({ blog, viewMode = 'grid' }) => {
  const {
    title,
    excerpt,
    author,
    publishedAt,
    readTime,
    tags = [],
    likes = 0,
    comments = 0,
    isBookmarked = false,
  } = blog;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (viewMode === 'list') {
    return (
      <Card className="cursor-pointer group">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-80 aspect-video lg:aspect-square bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 flex items-center justify-center">
            <div className="text-3xl text-primary-500 opacity-30">📝</div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <CardHeader className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <CardTitle className="text-xl lg:text-2xl line-clamp-2 group-hover:text-primary-500 transition-colors">
                    {title}
                  </CardTitle>
                  
                  <p className="text-text-secondary line-clamp-3 text-base leading-relaxed">
                    {excerpt}
                  </p>
                </div>
                
                <button className="p-2 bg-white hover:bg-gray-50 dark:bg-black/80 dark:hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 shadow-sm border border-gray-200 dark:border-gray-700">
                  <Bookmark 
                    className={`w-5 h-5 ${isBookmarked ? 'fill-current text-primary-500' : 'text-black dark:text-white'}`} 
                  />
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-0 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(publishedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{readTime} min read</span>
                  </div>
                </div>
                
                <EngagementButtons
                  blogId={blog.id}
                  initialLikes={likes}
                  initialComments={comments}
                  initialBookmarks={blog.bookmarks || 0}
                  isLiked={blog.isLiked}
                  isBookmarked={blog.isBookmarked}
                />
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer group overflow-hidden">
      {/* Image/Header */}
      <div className="aspect-video bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 flex items-center justify-center relative">
        <div className="text-4xl text-primary-500 opacity-30">📝</div>
        <button className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-50 dark:bg-black/80 dark:hover:bg-black rounded-lg transition-all duration-200 shadow-sm border border-gray-200 dark:border-gray-700">
          <Bookmark 
            className={`w-4 h-4 ${isBookmarked ? 'fill-current text-primary-500' : 'text-black dark:text-white'}`} 
          />
        </button>
      </div>
      
      <CardHeader className="space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs px-2 py-1">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
        
        {/* Title */}
        <CardTitle className="text-xl line-clamp-2 group-hover:text-primary-500 transition-colors leading-tight">
          {title}
        </CardTitle>
        
        {/* Excerpt */}
        <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
          {excerpt}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Author and Date */}
        <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="font-medium">{author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(publishedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{readTime}m</span>
          </div>
        </div>
        
        {/* Engagement */}
        <div className="pt-4 border-t border-border">
          <EngagementButtons
            blogId={blog.id}
            initialLikes={likes}
            initialComments={comments}
            initialBookmarks={blog.bookmarks || 0}
            isLiked={blog.isLiked}
            isBookmarked={blog.isBookmarked}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogCard;
