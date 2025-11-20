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
    <Card
      className="cursor-pointer group overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col"
      onClick={() => navigate(`/article/${blog.slug || blogId}`)}
    >
      {/* Image/Header */}
      <div className="aspect-video relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-indigo-500/60 to-gray-500/60">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/images/default-cover.png";
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-white/70 font-semibold tracking-wide">
            BLOG
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
      </div>

      <CardHeader className="space-y-4 sm:space-y-3 flex-1 flex flex-col">
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
        <CardTitle className="text-xl line-clamp-2 group-hover:text-primary-500 transition-colors leading-tight font-medium">
          {title}
        </CardTitle>

        {/* Excerpt */}
        <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed flex-1">
          {excerpt}
        </p>
      </CardHeader>

      <CardContent className="pt-0 mt-auto flex-shrink-0">
        {/* Author and Date */}
        <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="font-medium">{authorName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(publishedAt || createdAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{readTime}m</span>
          </div>
        </div>

        {/* Engagement */}
        <div className="pt-4 border-t border-border flex justify-center items-center">
          <div className="flex gap-4 justify-center items-center">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogCard;
