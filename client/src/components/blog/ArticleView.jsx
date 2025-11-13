import React, { useState, useEffect, useRef } from "react";
import { Volume2, MessageCircle, BookmarkIcon, ShareIcon, Edit, Trash2, MoreVertical } from "lucide-react";
import image3 from "../../assets/images/image3.jpg";
import { useParams, useNavigate } from "react-router-dom";
import IconButton from "../ui/IconButton.jsx";
import Button from "../ui/Button.jsx";
import EngagementButtons from "../engagement/EngagementButtons";
import AudioPlayer from "../audio/AudioPlayer";
import CommentList from "../comment/CommentList";
import { useAuth } from "../../hooks/useAuth";
import blogService from "../../services/blogService";

export default function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const commentsSectionRef = useRef(null);
  
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await blogService.getBlogById(id);
        
        // Handle different response structures
        const blogData = response?.data || response;
        
        if (blogData) {
          // Extract author information properly
          let authorName = 'Anonymous';
          let authorId = null;
          
          if (blogData.author) {
            if (typeof blogData.author === 'object' && blogData.author !== null) {
              // Author is populated object
              // Try to get name from various fields
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
            } else if (typeof blogData.author === 'string') {
              // Author is just an ID string
              authorId = blogData.author;
              authorName = 'User';
            }
          }
          
          setArticle({
            id: blogData._id,
            title: blogData.title,
            content: blogData.content,
            author: authorName,
            authorId: authorId,
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
          });
          
          // Set cached audio URL if available
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

    if (id) {
      fetchBlog();
    }
  }, [id]);

  // Handle hash navigation to comments
  useEffect(() => {
    if (window.location.hash === '#comments') {
      setShowComments(true);
      // Scroll to comments after a short delay to ensure it's rendered
      setTimeout(() => {
        if (commentsSectionRef.current) {
          commentsSectionRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 300);
    }
  }, [id]);

  const handleCommentClick = () => {
    setShowComments(true);
    
    // Auto-scroll to comments section after a short delay to ensure it's rendered
    setTimeout(() => {
      if (commentsSectionRef.current) {
        commentsSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  // Check if current user can edit/delete this blog
  const canModifyBlog = () => {
    if (!user || !article) return false;
    
    // Admin can modify any blog
    if (user.role === 'admin' || userProfile?.role === 'admin') {
      return true;
    }
    
    // Owner can modify their own blog
    const currentUserId = user._id || user.id || userProfile?._id || userProfile?.id;
    const authorId = article.authorId;
    
    return currentUserId && authorId && currentUserId.toString() === authorId.toString();
  };

  const handleEdit = () => {
    navigate(`/edit-blog/${id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await blogService.deleteBlog(id);
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
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const res = await blogService.regenerateSummary(id, { maxLength: 250 });
      const newSummary = res?.data?.summary || res?.summary || 'Summary updated';
      setArticle(prev => ({ ...prev, summary: newSummary }));
    } catch (error) {
      console.error('Error regenerating summary:', error);
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

  const date = article.createdAt ? new Date(article.createdAt) : new Date();
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="m-5.5 mb-0 flex justify-center ">
      <div className="w-full max-w-[780px] flex flex-col gap-3 ">
        <h1
          className="text-3xl md:text-4xl font-bold leading-tight mb-2 p-4 pb-0 pt-0 mt-4 "
          style={{ color: "var(--headings-color)" }}
        >
          {article.title}
        </h1>
        <div className="px-4">
          <span
            className="text-sm"
            style={{ color: "var( --sub-heading-text)" }}
          >
            By{" "}
            <button
              onClick={() => article.authorId && navigate(`/profile/${article.authorId}`)}
              style={{ color: "var( --links-color)" }}
              className="font-medium hover:underline cursor-pointer bg-transparent border-none"
              disabled={!article.authorId}
            >
              {article.author || 'Anonymous'}
            </button>{" "}
            . Published on {formattedDate}
          </span>
        </div>
        
        {/* Edit/Delete Actions for Owner and Admin */}
        {canModifyBlog() && (
          <div className="px-4 flex items-center gap-2 mt-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-transparent border border-red-600 text-red-500 hover:bg-red-900/20 hover:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
        {/* Engagement Buttons */}
        <div className="px-4 py-3 mt-3">
          <EngagementButtons
            blogId={id}
            initialLikes={article.likes || 0}
            initialComments={article.commentCount || 0}
            initialBookmarks={article.bookmarks || 0}
            isLiked={article.isLiked || false}
            isBookmarked={article.isBookmarked || false}
            onCommentClick={handleCommentClick}
          />
        </div>

        {/* AI Summary Controls */}
        <div className="px-4 py-2 flex items-center gap-3">
          <div className="flex-1 text-sm text-text-secondary">
            {article.summary}
          </div>
          <button
            onClick={regenerateSummary}
            disabled={summaryLoading}
            className="px-3 py-1.5 text-sm rounded-md border border-[var(--border-color)] bg-transparent hover:bg-surface disabled:opacity-50"
            aria-label="Regenerate AI summary"
          >
            {summaryLoading ? 'Updating…' : 'Regenerate Summary'}
          </button>
        </div>
        {summaryError && (
          <div className="px-4 text-sm text-red-500">{summaryError}</div>
        )}

        {/* Audio Player */}
        <div className="px-4 py-3">
          <AudioPlayer
            blogId={id}
            blogTitle={article.title}
            initialAudioUrl={audioUrl}
            onAudioGenerated={setAudioUrl}
          />
        </div>

        {/* Cover Image */}
        {article.coverImage && (
          <figure className="my-7">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-fit rounded-xl shadow-md"
            />
          </figure>
        )}

        {/* Blog Content - Render HTML */}
        <div
          style={{ color: "var(--paragraph-text-color)" }}
          className="p-4 pt-0 leading-loose prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Comments Section */}
        <div ref={commentsSectionRef} id="comments" className="mt-8 scroll-mt-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-text-primary">Comments</h3>
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              {showComments ? 'Hide Comments' : 'Show Comments'}
            </button>
          </div>
          
          {showComments && (
            <CommentList
              blogId={id}
              blogTitle={article.title}
            />
          )}
        </div>
      </div>
    </div>
  );
}
