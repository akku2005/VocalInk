import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import EngagementButtons from "../engagement/EngagementButtons";
import { Calendar, Clock, User, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCleanExcerpt, formatDate as formatDateUtil } from "../../utils/textUtils";
import { resolveAssetUrl } from "../../constants/apiConfig";

const BlogCard = ({ blog, viewMode = "grid" }) => {
  const navigate = useNavigate();

  const {
    title,
    author,
    publishedAt,
    createdAt,
    readingTime,
    tags = [],
    likes = 0,
    bookmarks = 0,
    likedBy = [],
    bookmarkedBy = [],
    _id,
    id,
  } = blog;

  // Get clean excerpt using utility function
  const excerpt = getCleanExcerpt(blog, 150);

  const readTime = readingTime || blog.readTime || 5;
  const blogId = _id || id;

  // Extract author name properly
  let authorName = 'Anonymous';
  if (typeof author === 'string') {
    authorName = author;
  } else if (author && typeof author === 'object') {
    if (author.displayName) {
      authorName = author.displayName;
    } else if (author.firstName || author.lastName) {
      authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim();
    } else if (author.username) {
      authorName = author.username;
    } else if (author.email) {
      authorName = author.email.split('@')[0];
    }
  }

  const isBookmarked = blog.isBookmarked || false;
  const isLiked = blog.isLiked || false;
  const coverSrc = resolveAssetUrl(blog.coverImage || blog.cover?.url || blog.coverImageUrl);

  const handleCommentClick = () => {
    // Navigate to the full article page where comments are displayed
    // Add a hash to scroll to comments section
    navigate(`/article/${blog.slug || blogId}#comments`);
  };

  const formatDate = (date) => {
    return formatDateUtil(date);
  };

  if (viewMode === "list") {
    return (
      <Card
        className="cursor-pointer group overflow-hidden"
        onClick={() => navigate(`/article/${blog.slug || blogId}`)}
      >
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-80 aspect-video lg:aspect-square relative flex-shrink-0 overflow-hidden rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none bg-gradient-to-br from-indigo-600/60 to-gray-600/60">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/images/default-cover.png";
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tracking-wide text-white/70">
                BLOG
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/55 to-transparent" />
          </div>

          <div className="flex-1 flex flex-col">
            <CardHeader className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs px-2 py-1"
                      >
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

                <button className="p-2 bg-[var(--secondary-btn)]    rounded-lg transition-colors flex-shrink-0 shadow-sm  dark:border-gray-700">
                  <Bookmark
                    className={`w-5 h-5 ${isBookmarked ? "fill-current text-primary-500" : ""}`}
                  />
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-0 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{authorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(publishedAt || createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{readTime} min read</span>
                  </div>
                </div>

                <EngagementButtons
                  blogId={blogId}
                  initialLikes={likes}
                  initialComments={0}
                  initialBookmarks={bookmarks}
                  isLiked={isLiked}
                  isBookmarked={isBookmarked}
                  onCommentClick={handleCommentClick}
                />
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div
      className="group relative flex flex-col h-full bg-surface border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1 cursor-pointer"
      onClick={() => navigate(`/article/${blog.slug || blogId}`)}
    >
      {/* Image Container */}
      <div className="aspect-[16/10] relative overflow-hidden bg-gradient-to-br from-sky-500/10 to-pink-500/10">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/images/default-cover.png";
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-sky-500/20 tracking-widest">BLOG</span>
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

        {/* Floating Tags */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
          {tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2.5 py-1 text-xs font-medium bg-black/40 backdrop-blur-md text-white rounded-full border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 space-y-4">
        <div className="space-y-2 flex-1">
          <h3 className="text-xl font-bold text-text-primary line-clamp-2 group-hover:text-sky-500 transition-colors leading-tight">
            {title}
          </h3>
          <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
            {excerpt}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span className="font-medium max-w-[100px] truncate">{authorName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{readTime}m</span>
            </div>
          </div>

          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <EngagementButtons
              blogId={blogId}
              initialLikes={likes}
              initialComments={0}
              initialBookmarks={bookmarks}
              isLiked={isLiked}
              isBookmarked={isBookmarked}
              onCommentClick={handleCommentClick}
              compact={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
