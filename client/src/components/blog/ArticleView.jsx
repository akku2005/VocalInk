import React, { useState, useEffect, useRef } from "react";
import { Volume2, MessageCircle, BookmarkIcon, ShareIcon, Edit, Trash2, MoreVertical, Sparkles, RefreshCw, ChevronDown, User, Tag } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import IconButton from "../ui/IconButton.jsx";
import Button from "../ui/Button.jsx";
import EngagementButtons from "../engagement/EngagementButtons";
import AudioPlayer from "../audio/AudioPlayer";
import CommentList from "../comment/CommentList";
import LoginPromptModal from "../auth/LoginPromptModal";
import RelatedBlogs from "./RelatedBlogs";
import SEOHead from "../seo/SEOHead";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { buildQuotaToastPayload } from "../../utils/quotaToast";
import blogService from "../../services/blogService";
import { resolveAssetUrl } from "../../constants/apiConfig";

const normalizeArticleContent = (html) => {
  if (!html || typeof html !== 'string') return '';
  let normalized = html
    .replaceAll('src="/api/uploads/', 'src="/uploads/')
    .replace(/(src|href)\s*=\s*(['"])image\/([a-zA-Z0-9+]+);base64,/gi, (match, attr, quote, type) => {
      return `${attr}=${quote}data:image/${type};base64,`;
    })
    .replace(/url\((['"]?)\s*image\/([a-zA-Z0-9+]+);base64,/gi, (match, quote, type) => {
      return `url(${quote}data:image/${type};base64,`;
    });

  // Add data-tts-segment attribute to spans that have TTS IDs
  normalized = normalized.replace(/<span\s+id="(tts-seg-\d+)"([^>]*)>/gi, (match, id, attrs) => {
    return `<span id="${id}" data-tts-segment="${id}"${attrs}>`;
  });

  // Add data-tts-segment attribute to paragraphs that have TTS IDs
  normalized = normalized.replace(/<p\s+id="(tts-seg-\d+)"([^>]*)>/gi, (match, id, attrs) => {
    return `<p id="${id}" data-tts-segment="${id}"${attrs}>`;
  });

  return normalized;
};

export default function ArticleView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, isAuthenticated } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [toc, setToc] = useState([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const commentsSectionRef = useRef(null);
  const { showInfo, showError } = useToast();

  // TTS Highlighting Logic
  const handleSegmentChange = (segmentData) => {
    // Handle both string (legacy) and object (new) format
    const segmentId = typeof segmentData === 'string' ? segmentData : segmentData?.segmentId;

    // Remove highlight from all segments
    const allSegments = document.querySelectorAll('[data-tts-segment]');
    allSegments.forEach(el => {
      el.classList.remove('tts-highlighted');
    });

    // If no segmentId (audio paused/stopped), just clear and return
    if (!segmentId) {
      return;
    }

    // Add highlight to active segment - try multiple methods
    let element = document.getElementById(segmentId);

    if (!element) {
      element = document.querySelector(`[data-tts-segment="${segmentId}"]`);
    }

    if (!element && !segmentId.startsWith('tts-seg-')) {
      element = document.getElementById(`tts-seg-${segmentId}`);
    }

    if (!element && !segmentId.startsWith('tts-seg-')) {
      element = document.querySelector(`[data-tts-segment="tts-seg-${segmentId}"]`);
    }

    if (element) {
      // Apply highlight class
      element.classList.add('tts-highlighted');

      // Smooth scroll to element
      setTimeout(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 100);

    } else {
      console.warn('TTS: Segment not found -', segmentId);
    }
  };

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await blogService.getBlogBySlug(slug);
        const blogData = response?.data || response;

        if (blogData) {
          // Extract author information properly
          let authorName = 'Anonymous';
          let authorId = null;
          let authorBio = null;
          let authorAvatar = null;

          if (blogData.author) {
            if (typeof blogData.author === 'object' && blogData.author !== null) {
              if (blogData.author.displayName) {
                authorName = blogData.author.displayName;
              } else if (blogData.author.firstName || blogData.author.lastName) {
                authorName = `${blogData.author.firstName || ''} ${blogData.author.lastName || ''}`.trim();
              } else if (blogData.author.username) {
                authorName = blogData.author.username;
              } else if (blogData.author.email) {
                authorName = blogData.author.email.split('@')[0];
              }

              authorId = blogData.author._id || blogData.author.id;
              authorBio = blogData.author.bio;
              authorAvatar = blogData.author.avatar;
            } else if (typeof blogData.author === 'string') {
              authorId = blogData.author;
              authorName = 'User';
            }
          }

          setArticle({
            id: blogData._id,
            slug: blogData.slug || slug, // Store slug
            title: blogData.title,
            content: blogData.content,
            author: authorName,
            authorId: authorId,
            authorBio: authorBio,
            authorAvatar: authorAvatar,
            summary: blogData.summary,
            tags: blogData.tags || [],
            mood: blogData.mood,
            coverImage: blogData.coverImage,
            createdAt: blogData.createdAt,
            updatedAt: blogData.updatedAt,
            publishedAt: blogData.publishedAt,
            likes: blogData.likes || 0,
            commentCount: blogData.commentCount || 0,
            bookmarks: blogData.bookmarks || 0,
            isLiked: blogData.isLiked || false,
            isBookmarked: blogData.isBookmarked || false,
            ttsUrl: blogData.ttsUrl || null,
            audioDuration: blogData.audioDuration || null,
            audioSegments: blogData.audioSegments || [],
          });

          if (blogData.ttsUrl) {
            setAudioUrl(blogData.ttsUrl);
          }
        } else {
          setError('Blog not found');
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError(err.response?.data?.message || 'Failed to load blog');
      } finally {
        setLoading(false);
      }
    };

    if (!slug) {
      setError('No article specified');
      setLoading(false);
      return;
    }

    fetchBlog();
  }, [slug]);

  // Parse Table of Contents
  useEffect(() => {
    if (article?.content) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(article.content, 'text/html');
      const headings = Array.from(doc.querySelectorAll('h2, h3'));
      const tocItems = headings.map((heading, index) => {
        const id = heading.id || `heading-${index}`;
        // We need to ensure the actual rendered HTML has these IDs. 
        // Since we use dangerouslySetInnerHTML, we can't easily inject IDs into the DOM *before* render without modifying the HTML string.
        // For now, we'll assume the content might not have IDs and we'll just use the text for display. 
        // To make scrolling work, we'd need to modify the HTML content to include IDs.
        return {
          id,
          text: heading.textContent,
          level: heading.tagName.toLowerCase()
        };
      });
      setToc(tocItems);
    }
  }, [article]);

  // Handle hash navigation
  useEffect(() => {
    if (window.location.hash === '#comments') {
      setShowComments(true);
      setTimeout(() => {
        if (commentsSectionRef.current) {
          commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [slug]);

  const handleCommentClick = () => {
    setShowComments(true);
    setTimeout(() => {
      if (commentsSectionRef.current) {
        commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleQuotaToast = (usage, type, isError = false) => {
    const payload = buildQuotaToastPayload({ usage, type, isError });
    if (!payload) return;
    const show = isError ? showError : showInfo;
    show(payload.message, {
      title: payload.title,
      countdownExpiresAt: payload.countdownExpiresAt,
      duration: isError ? 6000 : 5000,
    });
  };

  const canModifyBlog = () => {
    if (!user || !article) return false;
    if (user.role === 'admin' || userProfile?.role === 'admin') return true;
    const currentUserId = user._id || user.id || userProfile?._id || userProfile?.id;
    const authorId = article.authorId;
    return currentUserId && authorId && currentUserId.toString() === authorId.toString();
  };

  const handleEdit = () => navigate(`/edit-blog/${article.id}`);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await blogService.deleteBlog(article.id);
      alert('Blog deleted successfully!');
      navigate('/blogs');
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert(error.response?.data?.message || 'Failed to delete blog');
    } finally {
      setDeleting(false);
    }
  };

  const regenerateSummary = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const res = await blogService.regenerateSummary(article.id, { maxLength: 250 });
      const newSummary = res?.data?.summary || res?.summary || 'Summary updated';
      const usage = res?.usage || res?.data?.usage;
      handleQuotaToast(usage, 'summary');
      setArticle(prev => ({ ...prev, summary: newSummary }));
    } catch (error) {
      console.error('Error regenerating summary:', error);
      const usage = error?.response?.data?.usage;
      if (usage) handleQuotaToast(usage, 'summary', error?.response?.status === 429);
      setSummaryError(error?.response?.data?.message || 'Failed to regenerate summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Article not found!</h2>
          <p className="text-gray-600">{error || 'The blog you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  const formattedDate = article.createdAt ? new Date(article.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  }) : '';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* SEO Meta Tags */}
      <SEOHead
        title={article.title}
        description={article.summary || (article.content?.substring(0, 160) + '...')}
        keywords={article.tags}
        image={article.coverImage}
        url={`${window.location.origin}/blog/${article.slug}`}
        type="article"
        author={article.author}
        publishedTime={article.publishedAt}
        modifiedTime={article.updatedAt}
        tags={article.tags}
        article={{
          author: article.author,
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
          tags: article.tags,
          category: article.mood,
        }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main Content Column */}
          <div className="lg:col-span-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6 text-text-primary">
                {article.title}
              </h1>

              {/* Tags and Category Section */}
              {(article.tags?.length > 0 || article.mood) && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  {article.mood && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-medium rounded-full border border-primary-500/20">
                      <Tag className="w-4 h-4" />
                      {article.mood}
                    </span>
                  )}
                  {article.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-hover text-text-secondary text-sm font-medium rounded-full border border-[var(--border-color)] hover:border-primary-500/30 hover:text-primary-500 cursor-pointer transition-colors"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Mobile Author Info (visible only on small screens) */}
              <div className="lg:hidden flex items-center gap-3 mb-6 pb-6 border-b border-[var(--border-color)]">
                <div className="w-10 h-10 rounded-full bg-surface-hover overflow-hidden">
                  {article.authorAvatar ? (
                    <img src={resolveAssetUrl(article.authorAvatar)} alt={article.author} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-500/10 text-primary-500">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-text-primary">{article.author}</div>
                  <div className="text-sm text-text-secondary">{formattedDate}</div>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            {article.coverImage && (
              <figure className="mb-8 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={resolveAssetUrl(article.coverImage)}
                  alt={article.title}
                  className="w-full h-auto object-cover"
                />
              </figure>
            )}

            {/* AI Summary */}
            <div className="mb-8 relative overflow-hidden rounded-xl border border-primary-500/20 bg-primary-500/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-primary-500">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">AI Summary</span>
                </div>
                <button
                  onClick={regenerateSummary}
                  disabled={summaryLoading}
                  className="group flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-primary-500 bg-primary-500/5 hover:bg-primary-500/10 active:bg-primary-500/20 active:scale-95 transition-all duration-200 rounded-lg border border-primary-500/20 hover:border-primary-500/40 cursor-pointer shadow-sm hover:shadow"
                  title="Regenerate Summary"
                >
                  <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${summaryLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                  <span>{summaryLoading ? 'Regenerating...' : 'Regenerate'}</span>
                </button>
              </div>
              <div
                className="text-text-secondary leading-relaxed [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-text-primary [&>h2]:mb-2 [&>p]:mb-3 [&>*:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: normalizeArticleContent(article.summary || '') }}
              />
              {summaryError && <div className="mt-2 text-sm text-red-500">{summaryError}</div>}
            </div>

            {/* Audio Player */}
            <div className="mb-8">
              <AudioPlayer
                blogId={article.id}
                blogTitle={article.title}
                initialAudioUrl={audioUrl}
                initialAudioSegments={article.audioSegments}
                onAudioGenerated={(url) => setAudioUrl(url)}
                onSegmentChange={handleSegmentChange}
              />
            </div>

            {/* Blog Content with Read More */}
            <div className="relative mb-12">
              <div
                className={`article-content prose prose-lg max-w-none dark:prose-invert prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-primary-500 hover:prose-a:text-primary-600 prose-strong:text-text-primary prose-code:text-primary-500 ${!isExpanded ? 'max-h-[600px] overflow-hidden' : ''}`}
                dangerouslySetInnerHTML={{ __html: normalizeArticleContent(article.content || '') }}
              />

              {!isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-[rgb(var(--color-background))] via-[rgba(var(--color-background),0.9)] to-transparent flex items-end justify-center pb-8 pointer-events-none">
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="pointer-events-auto flex items-center gap-2 px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium shadow-lg hover:shadow-primary-500/25 transition-all transform hover:-translate-y-1 active:translate-y-0"
                  >
                    <span>Read Full Article</span>
                    <ChevronDown className="w-5 h-5 animate-bounce" />
                  </button>
                </div>
              )}
            </div>

            {/* Engagement & Actions */}
            <div className="flex items-center justify-between py-6 border-t border-b border-[var(--border-color)] mb-12">
              <EngagementButtons
                blogId={article.id}
                initialLikes={article.likes || 0}
                initialComments={article.commentCount || 0}
                initialBookmarks={article.bookmarks || 0}
                isLiked={article.isLiked || false}
                isBookmarked={article.isBookmarked || false}
                onCommentClick={handleCommentClick}
              />

              {canModifyBlog() && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleEdit}
                    className="p-2 text-text-secondary hover:text-primary-500 transition-colors"
                    title="Edit Article"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="p-2 text-text-secondary hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Delete Article"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Comments */}
            <div ref={commentsSectionRef} id="comments" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-text-primary">Comments</h3>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  {showComments ? 'Hide Comments' : 'Show Comments'}
                </button>
              </div>
              {showComments && (
                <CommentList blogId={article.id} blogTitle={article.title} />
              )}
            </div>

            {/* Related Blogs */}
            <RelatedBlogs
              currentBlogId={article.id}
              tags={article.tags}
              category={article.mood}
            />
          </div>

          {/* Sidebar Column */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-8">

              {/* Author Profile Card */}
              <div className="bg-surface rounded-2xl p-6 border border-[var(--border-color)] shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-surface-hover overflow-hidden mb-4 ring-4 ring-surface shadow-md">
                    {article.authorAvatar ? (
                      <img src={resolveAssetUrl(article.authorAvatar)} alt={article.author} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-500/10 text-primary-500">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">{article.author}</h3>
                  <p className="text-sm text-text-secondary mb-6 line-clamp-3 leading-relaxed">
                    {article.authorBio || `Writer at VocalInk. Passionate about sharing stories and insights.`}
                  </p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => article.authorId && navigate(`/profile/${article.authorId}`)}
                      className="flex-1 py-2.5 px-4 bg-surface-hover hover:bg-surface-active text-text-primary rounded-xl font-medium transition-colors text-sm border border-[var(--border-color)]"
                    >
                      View Profile
                    </button>
                    <button className="flex-1 py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors text-sm shadow-lg shadow-primary-500/20">
                      Chat
                    </button>
                  </div>
                </div>
              </div>

              {/* Table of Contents - Enhanced */}
              {toc.length > 0 && (
                <div className="glassmorphism-card p-6 sticky top-6">
                  <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
                    Table of Contents
                  </h3>
                  <nav>
                    <ol className="flex flex-col gap-2 list-none">
                      {toc.map((item, index) => (
                        <li
                          key={index}
                          className={`${item.level === 'h3' ? 'ml-4' : ''} group`}
                        >
                          <a
                            href={`#${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const elements = Array.from(document.querySelectorAll(item.level));
                              const target = elements.find(el => el.textContent === item.text);
                              if (target) {
                                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            className="flex items-start gap-3 p-2 rounded-lg text-text-secondary hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group-hover:translate-x-1"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold flex items-center justify-center group-hover:scale-110 transition-transform">
                              {index + 1}
                            </span>
                            <span className="text-sm leading-relaxed">{item.text}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {showLoginPrompt && (
        <LoginPromptModal
          action="summary"
          title="Sign in to regenerate summaries"
          message="Sign in or create an account to keep generating AI summaries."
          onClose={() => setShowLoginPrompt(false)}
        />
      )}
    </div>
  );
}
