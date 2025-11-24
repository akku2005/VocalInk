import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import blogService from '../services/blogService';
import { apiService } from '../services/api';
import { resolveAssetUrl } from '../constants/apiConfig';
import { useToast } from '../hooks/useToast';
import AdvancedRichTextEditor from '../components/ui/AdvancedRichTextEditor';
import '../styles/edit-blog-animations.css';
import {
  Save,
  Eye,
  Zap,
  Mic,
  Volume2,
  Globe,
  Tag,
  BookOpen,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Languages,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Trash2,
  History,
  Share,
  MessageCircle,
  Share2,
  X
} from 'lucide-react';

const EditBlogPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [ttsGenerating, setTtsGenerating] = useState(false);
  const [ttsJobId, setTtsJobId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const { addToast } = useToast();

  const moods = [
    { id: 'motivational', name: 'Motivational', icon: '🚀', color: 'bg-orange-100 text-orange-800' },
    { id: 'thoughtful', name: 'Thoughtful', icon: '🤔', color: 'bg-blue-100 text-blue-800' },
    { id: 'humorous', name: 'Humorous', icon: '😄', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'educational', name: 'Educational', icon: '📚', color: 'bg-green-100 text-green-800' },
    { id: 'inspirational', name: 'Inspirational', icon: '✨', color: 'bg-purple-100 text-purple-800' },
    { id: 'technical', name: 'Technical', icon: '⚙️', color: 'bg-gray-100 text-gray-800' }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
  ];

  const suggestedTags = [
    'Technology', 'AI', 'Programming', 'Design', 'Business', 'Marketing',
    'Health', 'Fitness', 'Travel', 'Food', 'Lifestyle', 'Education',
    'Science', 'Environment', 'Politics', 'Entertainment', 'Sports'
  ];

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await blogService.getBlogById(id);
        const blog = response?.data || response;

        if (!blog) {
          setLoadError('Blog not found.');
          setFormData(null);
          return;
        }

        setFormData({
          id: blog._id || id,
          slug: blog.slug || id, // Store slug for navigation
          title: blog.title || '',
          content: blog.content || '',
          summary: blog.summary || '',
          tags: Array.isArray(blog.tags) ? blog.tags : [],
          mood: blog.mood || '',
          language: blog.language || blog.languageCode || 'en',
          series: blog.series?.title || blog.series?.name || '',
          isPublic: blog.status ? blog.status === 'published' : true,
          allowComments: blog.allowComments ?? true,
          generateTTS: Boolean(blog.ttsUrl),
          publishedAt: blog.publishedAt || blog.createdAt || new Date().toISOString(),
          lastModified: blog.updatedAt || blog.createdAt || new Date().toISOString(),
          views: Number(blog.views ?? blog.viewCount ?? 0),
          likes: Number(blog.likes ?? (Array.isArray(blog.likedBy) ? blog.likedBy.length : 0)),
          comments: Number(blog.commentCount ?? (Array.isArray(blog.comments) ? blog.comments.length : 0)),
          shares: Number(blog.shares ?? 0), // Add shares
          coverImage: blog.coverImage || '',
        });
      } catch (error) {
        console.error('Error loading blog:', error);
        setLoadError(error?.response?.data?.message || 'Failed to load blog details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (!formData) return;
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleCoverUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        addToast({ type: 'error', message: 'Cover image must be smaller than 5MB.' });
        return;
      }

      setCoverUploading(true);
      try {
        const response = await apiService.upload('/images/upload', file);
        const url = resolveAssetUrl(response.data?.url || response.data?.data?.url);
        if (url) {
          setFormData(prev => ({ ...prev, coverImage: url }));
          addToast({ type: 'success', message: 'Cover image updated.' });
        } else {
          throw new Error('Upload response missing URL');
        }
      } catch (error) {
        console.error('Cover upload failed:', error);
        addToast({ type: 'error', message: error?.response?.data?.message || 'Failed to upload cover image.' });
      } finally {
        setCoverUploading(false);
      }
    };
    input.click();
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const generateAISummary = async () => {
    if (!formData?.content?.trim()) {
      addToast({ type: 'warning', message: 'Please write some content before generating a summary.' });
      return;
    }

    setAiGenerating(true);
    try {
      const response = await blogService.regenerateSummary(id, { maxLength: 220 });
      const newSummary = response?.summary || response?.data?.summary || response?.message;
      if (newSummary) {
        setFormData(prev => ({ ...prev, summary: newSummary }));
        addToast({ type: 'success', message: 'AI summary updated.' });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      addToast({ type: 'error', message: error?.response?.data?.message || 'Failed to generate summary.' });
    } finally {
      setAiGenerating(false);
    }
  };

  const generateTTS = async () => {
    if (!formData?.content?.trim()) {
      addToast({ type: 'warning', message: 'Please add some content before generating audio.' });
      return;
    }

    setTtsGenerating(true);
    setTtsJobId(null);
    try {
      const result = await blogService.generateTTS(id, { provider: 'elevenlabs' });
      
      // Store job ID for cancellation if available
      const jobId = result?.jobId || result?.result?.jobId;
      if (jobId) {
        setTtsJobId(jobId);
      }
      
      addToast({ type: 'success', message: 'Audio regeneration started. Refresh the article to listen once ready.' });
    } catch (error) {
      console.error('Error generating TTS:', error);
      
      // Don't show error if it was cancelled
      if (error.message !== 'TTS generation was cancelled') {
        addToast({ type: 'error', message: error?.response?.data?.message || 'Failed to generate TTS audio.' });
      } else {
        addToast({ type: 'warning', message: 'TTS generation was cancelled.' });
      }
    } finally {
      setTtsGenerating(false);
      setTtsJobId(null);
    }
  };

  const cancelTTS = async () => {
    try {
      await blogService.cancelTTSGeneration(id, ttsJobId);
      addToast({ type: 'info', message: 'TTS generation cancelled.' });
    } catch (error) {
      console.error('Error cancelling TTS:', error);
      addToast({ type: 'error', message: 'Failed to cancel TTS generation.' });
    }
  };

  const handleSave = async (publish = false) => {
    if (!formData?.title?.trim() || !formData?.content?.trim()) {
      addToast({ type: 'warning', message: 'Title and content are required.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content,
        summary: formData.summary,
        tags: formData.tags,
        mood: formData.mood,
        language: formData.language,
        series: formData.series,
        allowComments: formData.allowComments,
        isPublic: formData.isPublic,
        status: publish ? 'published' : 'draft',
        coverImage: formData.coverImage,
      };

      if (formData.generateTTS) {
        payload.generateTTS = true;
      }

      const updated = await blogService.updateBlog(id, payload);

      setFormData(prev => ({
        ...prev,
        title: updated?.title ?? prev.title,
        content: updated?.content ?? prev.content,
        summary: updated?.summary ?? prev.summary,
        tags: Array.isArray(updated?.tags) ? updated.tags : prev.tags,
        mood: updated?.mood ?? prev.mood,
        language: updated?.language ?? prev.language,
        series: updated?.series?.title || updated?.series || prev.series,
        lastModified: updated?.updatedAt || new Date().toISOString(),
        publishedAt: updated?.publishedAt || prev.publishedAt,
        likes: Number(updated?.likes ?? prev.likes),
        comments: Number(updated?.commentCount ?? prev.comments),
        views: Number(updated?.views ?? prev.views),
      }));

      addToast({
        type: 'success',
        message: publish ? 'Blog updated and published.' : 'Draft saved successfully.',
      });

      if (publish) {
        navigate(`/article/${formData.slug || id}`);
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      addToast({ type: 'error', message: error?.response?.data?.message || 'Failed to save blog.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await blogService.deleteBlog(id);
      addToast({ type: 'success', message: 'Blog deleted.' });
      navigate('/blogs');
    } catch (error) {
      console.error('Error deleting blog:', error);
      addToast({ type: 'error', message: error?.response?.data?.message || 'Failed to delete blog.' });
    } finally {
      setDeleting(false);
    }
  };

  const wordCount = formData?.content
    ? formData.content.split(/\s+/).filter(word => word.length > 0).length
    : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200)); // Average reading speed

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto p-10 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-text-primary">Unable to load blog</h2>
        <p className="text-text-secondary">{loadError}</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          <Button onClick={() => navigate('/blogs')}>Browse Blogs</Button>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Blog post not found</h2>
        <p className="text-text-secondary mb-4">The blog post you're looking for doesn't exist or you don't have permission to edit it.</p>
        <Button onClick={() => navigate('/blogs')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blogs
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background page-load-animation">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/article/${formData.slug || formData.id}`)}
                className="hover:scale-105 transition-transform"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Post
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Edit Blog Post</h1>
                <p className="text-sm text-text-secondary mt-1">
                  Last modified: {new Date(formData.lastModified).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2 gradient-hover"
                size="sm"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">{previewMode ? 'Edit' : 'Preview'}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 gradient-hover"
                size="sm"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                loading={saving}
                className="flex items-center gap-2"
                size="sm"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button
                onClick={() => handleSave(true)}
                loading={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all"
                size="sm"
              >
                <BookOpen className="w-4 h-4" />
                Update
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Stats Overview - Enhanced with Glassmorphism */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glassmorphism-card p-6 hover:shadow-xl transition-all duration-300 cursor-pointer stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold gradient-text">
                    {formData.views.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-text-secondary mt-1">Views</div>
                </div>
                <div className="w-12 h-12 rounded-xl icon-gradient flex items-center justify-center shadow-lg">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="glassmorphism-card p-6 hover:shadow-xl transition-all duration-300 cursor-pointer stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold gradient-text">{formData.likes}</div>
                  <div className="text-sm font-medium text-text-secondary mt-1">Likes</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-error to-error/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-white text-xl">❤️</span>
                </div>
              </div>
            </div>
            <div className="glassmorphism-card p-6 hover:shadow-xl transition-all duration-300 cursor-pointer stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold gradient-text">{formData.comments}</div>
                  <div className="text-sm font-medium text-text-secondary mt-1">Comments</div>
                </div>
                <div className="w-12 h-12 rounded-xl icon-gradient flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="glassmorphism-card p-6 hover:shadow-xl transition-all duration-300 cursor-pointer stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold gradient-text">{formData.shares || 0}</div>
                  <div className="text-sm font-medium text-text-secondary mt-1">Shares</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Title *
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your blog title..."
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="text-lg font-semibold"
                      />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {readTime} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {wordCount} words
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        Published {new Date(formData.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Content *</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateAISummary}
                        loading={aiGenerating}
                        className="flex items-center gap-1"
                      >
                        <Sparkles className="w-4 h-4" />
                        AI Summary
                      </Button>
                      {ttsGenerating ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={cancelTTS}
                          className="flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancel TTS
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateTTS}
                          loading={ttsGenerating}
                          className="flex items-center gap-1"
                        >
                          <Volume2 className="w-4 h-4" />
                          Generate TTS
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!previewMode ? (
                    <div className="p-4 sm:p-6">
                      <AdvancedRichTextEditor
                        value={formData.content}
                        onChange={(html) => handleInputChange('content', html)}
                        className="min-h-[420px]"
                      />
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6">
                      <div
                        className="article-content bg-[var(--secondary-btn3)] rounded-xl p-5"
                        dangerouslySetInnerHTML={{
                          __html:
                            formData.content?.trim() ||
                            "<p class='text-text-secondary italic'>No content yet. Start writing to preview.</p>"
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Summary */}
              {formData.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-500" />
                      AI-Generated Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-text-primary leading-relaxed">{formData.summary}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm text-success">Summary generated successfully</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cover Image - Enhanced */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg shadow-md">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    Cover Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div
                    className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-border hover:border-primary-400 transition-colors cursor-pointer group"
                    onClick={formData.coverImage ? undefined : handleCoverUpload}
                  >
                    {formData.coverImage ? (
                      <>
                        <img
                          src={resolveAssetUrl(formData.coverImage)}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity cover-overlay">
                          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleCoverUpload(); }}
                              className="bg-white/90 text-black hover:bg-white"
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Replace
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleInputChange('coverImage', ''); }}
                              className="text-white border-white hover:bg-white/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-text-secondary bg-gradient-to-br from-surface to-surface-alt">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                        <p className="font-medium text-text-primary">Click or drag image here</p>
                        <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  {!formData.coverImage && (
                    <div className="flex justify-center">
                      <Button
                        onClick={handleCoverUpload}
                        loading={coverUploading}
                        className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transition-all"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mood Selection - Enhanced */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg shadow-md">
                      <Palette className="w-5 h-5 text-white" />
                    </div>
                    Mood
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-3">
                    {moods.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => handleInputChange('mood', mood.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${formData.mood === mood.id
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 shadow-lg shadow-primary-500/20'
                          : 'border-border hover:border-primary-300 hover:shadow-md'
                          }`}
                      >
                        <div className="text-2xl mb-2">{mood.icon}</div>
                        <div className="text-sm font-semibold text-text-primary">{mood.name}</div>
                        {formData.mood === mood.id && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg mood-selected-badge">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Language Selection - Enhanced */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg shadow-md">
                      <Languages className="w-5 h-5 text-white" />
                    </div>
                    Language
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full p-3 border-2 border-border rounded-xl bg-background text-text-primary hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary-500" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Add a tag..."
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-1"
                      />
                      <Button onClick={handleAddTag} size="sm">Add</Button>
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="default" className="flex items-center gap-1">
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-error cursor-pointer"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-text-secondary mb-2">Suggested tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestedTags.slice(0, 8).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              if (!formData.tags.includes(tag)) {
                                setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                              }
                            }}
                            className="text-xs px-2 py-1 bg-secondary-100 text-text-secondary rounded hover:bg-secondary-200 transition-colors cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Series */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary-500" />
                    Series (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Input
                    type="text"
                    placeholder="Add to a series..."
                    value={formData.series}
                    onChange={(e) => handleInputChange('series', e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary-500" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-border rounded"
                    />
                    <span className="text-sm text-text-primary">Make this post public</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.allowComments}
                      onChange={(e) => handleInputChange('allowComments', e.target.checked)}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-border rounded"
                    />
                    <span className="text-sm text-text-primary">Allow comments</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.generateTTS}
                      onChange={(e) => handleInputChange('generateTTS', e.target.checked)}
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-border rounded"
                    />
                    <span className="text-sm text-text-primary">Generate audio version</span>
                  </label>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-error">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-error">
                    <AlertCircle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-text-primary mb-2">Delete Post</h3>
                      <p className="text-sm text-text-secondary mb-4">
                        Permanently delete this blog post. This action cannot be undone.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleDelete}
                        loading={deleting}
                        className="text-error border-error hover:bg-error hover:text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Post
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBlogPage;
