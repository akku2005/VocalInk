import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { apiService } from "../services/api";
import { resolveAssetUrl } from "../constants/apiConfig";
import {
  Save,
  Eye,
  Volume2,
  Globe,
  Tag,
  BookOpen,
  Sparkles,
  Palette,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import CustomDropdown from "../components/ui/CustomDropdown";
import { useToast } from '../hooks/useToast';
import AdvancedRichTextEditor from '../components/ui/AdvancedRichTextEditor';
import { storage } from '../utils/storage';

// Debounce function to limit how often an expensive function is called
const debounce = (fn, delay) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

const CreateBlogPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    tags: [],
    mood: "",
    language: "en",
    series: "",
    isPublic: true,
    allowComments: true,
    generateTTS: false,
    coverImage: "",
  });

  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const [showPublish, setShowPublish] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [canvasTheme, setCanvasTheme] = useState("white"); // 'white' | 'sepia' | 'dark'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tagQuery, setTagQuery] = useState("");

  const suggestedTags = [
    "Technology",
    "AI",
    "Programming",
    "Design",
    "Business",
    "Marketing",
    "Health",
    "Fitness",
    "Travel",
    "Food",
    "Lifestyle",
    "Education",
    "Science",
    "Environment",
    "Politics",
    "Entertainment",
    "Sports",
  ];

  const allTags = suggestedTags;
  const filteredTags = allTags
    .filter((t) => t.toLowerCase().includes(tagQuery.toLowerCase()))
    .filter((t) => !formData.tags.includes(t))
    .slice(0, 6);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    const tagToAdd = currentTag.trim();
    if (tagToAdd && !formData.tags.includes(tagToAdd) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagToAdd]
      }));
      setCurrentTag('');
      addToast({ type: 'success', message: `Tag '${tagToAdd}' added.` });
    } else if (formData.tags.length >= 5) {
      addToast({ type: 'warning', message: 'Maximum 5 tags allowed.' });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
    addToast({ type: 'info', message: `Tag '${tagToRemove}' removed.` });
  };

  const handleCoverUpload = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const resp = await apiService.upload('/images/upload', file);
          const url = resolveAssetUrl(resp.data.url || resp.data.data?.url);
          handleInputChange('coverImage', url);
          addToast({ type: 'success', message: 'Cover image uploaded.' });
        } catch (uploadError) {
          console.error('Cover upload failed', uploadError);
          addToast({ type: 'error', message: 'Failed to upload cover image.' });
        }
      };
      input.click();
    } catch (e) {
      console.error('Cover upload failed', e);
      addToast({ type: 'error', message: 'Failed to upload cover image.' });
    }
  };

  const generateAISummary = async () => {
    if (!formData.content.trim()) {
      addToast({ type: 'warning', message: 'Please write some content first.' });
      return;
    }
    setAiGenerating(true);
    try {
      const response = await apiService.post('/ai/summary', { content: formData.content });
      setFormData(prev => ({ ...prev, summary: response.data.summary }));
      addToast({ type: 'success', message: 'AI summary generated successfully!' });
    } catch (error) {
      console.error('Error generating summary:', error);
      addToast({ type: 'error', message: 'Failed to generate AI summary.' });
    } finally {
      setAiGenerating(false);
    }
  };

  const generateTTS = async () => {
    if (!formData.content.trim()) {
      addToast({ type: 'warning', message: 'Please write some content first.' });
      return;
    }
    setLoading(true);
    try {
      await apiService.post('/tts/generate', { text: formData.content, blogId: 'new-blog-temp-id' });
      addToast({ type: 'success', message: 'Audio version is being generated.' });
    } catch (error) {
      console.error('Error generating TTS:', error);
      addToast({ type: 'error', message: 'Failed to generate TTS audio.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isDraft = false) => {
    setLoading(true);
    try {
      const moodMap = {
        motivational: "Motivational",
        thoughtful: "Thoughtful",
        educational: "Educational",
        humorous: "Humorous",
        inspirational: "Inspirational",
        technical: "Technical",
      };
      const payload = {
        title: formData.title,
        content: formData.content,
        summary: formData.summary,
        tags: formData.tags,
        mood: moodMap[formData.mood] || "Other",
        language: formData.language || "en",
        seriesId: formData.series || undefined,
        status: isDraft ? "draft" : "published",
        coverImage: formData.coverImage || undefined,
      };

      // Debug: Log the payload
      console.log('Publishing blog with payload:', payload);

      const res = await apiService.post("/blogs/addBlog", payload);

      if (!isDraft) {
        if (storage.available) {
          storage.removeItem('createBlogDraft');
        }
        addToast({ type: 'success', message: 'Blog published successfully!' });

        // Navigate to the article page after successful publish
        if (res.data && res.data.data && (res.data.data.slug || res.data.data._id)) {
          navigate(`/article/${res.data.data.slug || res.data.data._id}`);
        } else if (res.data && (res.data.slug || res.data._id)) {
          navigate(`/article/${res.data.slug || res.data._id}`);
        } else {
          // Fallback to blogs page if no ID returned
          navigate('/blogs');
        }
      } else {
        addToast({ type: 'success', message: 'Draft saved successfully!' });
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.errors
        ? error.response.data.errors.map(e => `${e.field}: ${e.message}`).join(', ')
        : error.response?.data?.message || 'Failed to save blog.';
      addToast({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Function to extract plain text and calculate word count/read time
  const plainText = (formData.content || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, ' ')
    .trim();
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 200);

  // Validation function for publishing
  const validateBeforePublish = () => {
    const e = [];
    if (!formData.title.trim()) e.push("Title is required");
    // VALIDATION FIX: Check for meaningful content (at least 10 characters)
    if (!plainText || plainText.trim().length < 10) {
      e.push("Content must be at least 10 characters");
    }
    // Tags are optional - removed requirement
    setErrors(e);
    return e.length === 0;
  };

  const openPublish = () => {
    if (validateBeforePublish()) {
      setShowPublish(true);
    } else {
      addToast({ type: 'error', message: 'Please fix the errors before publishing.' });
    }
  };

  const confirmPublish = async () => {
    if (!validateBeforePublish()) return;
    await handleSave(false);
    setShowPublish(false);
  };

  // Debounced function to save draft to local storage
  const debouncedPersist = debounce((data) => {
    if (!storage.available) return;
    try {
      storage.setItem("createBlogDraft", JSON.stringify(data));
      setLastSavedAt(new Date());
    } catch (e) {
      console.warn("Persist draft failed", e);
    }
  }, 800);

  // Effect to load draft from local storage on component mount
  useEffect(() => {
    if (!storage.available) return;
    try {
      const saved = storage.getItem("createBlogDraft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn("Failed to restore draft", e);
    }
  }, []);

  // Effect to persist draft to local storage on form data change
  useEffect(() => {
    debouncedPersist(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const moods = [
    {
      id: "motivational",
      name: "Motivational",
      icon: "🚀",
      color: "bg-orange-100 text-orange-800",
    },
    {
      id: "thoughtful",
      name: "Thoughtful",
      icon: "🤔",
      color: "bg-blue-100 text-blue-800",
    },
    {
      id: "humorous",
      name: "Humorous",
      icon: "😄",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      id: "educational",
      name: "Educational",
      icon: "📚",
      color: "bg-green-100 text-green-800",
    },
    {
      id: "inspirational",
      name: "Inspirational",
      icon: "✨",
      color: "bg-purple-100 text-purple-800",
    },
    {
      id: "technical",
      name: "Technical",
      icon: "⚙️",
      color: "bg-gray-100 text-gray-800",
    },
  ];
  const visibilityOptions = [
    { id: "public", name: "Public" },
    { id: "private", name: "Private" },
  ];

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
  ];

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                  Create New Blog Post
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                  Share your thoughts with the VocalInk community
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-2 text-sm"
                  size="sm"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">{previewMode ? "Edit" : "Preview"}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSave(true)}
                  loading={loading}
                  className="flex items-center gap-2 text-sm"
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save Draft</span>
                </Button>
                <Button
                  onClick={openPublish}
                  loading={loading}
                  className="flex items-center gap-2 text-sm"
                  size="sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="space-y-6">
            {/* Main Editor Column */}
            <div className="space-y-6">
              {/* Title Card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your blog title..."
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        className="w-full bg-transparent outline-none text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight placeholder:text-text-secondary/40 border-b border-transparent focus:border-primary pb-2 transition-colors"
                      />
                    </div>

                    {/* Stats Bar */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary pt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        {readTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                        {wordCount} words
                      </span>
                      {lastSavedAt && (
                        <span className="text-xs text-success flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Saved {lastSavedAt.toLocaleTimeString()}
                        </span>
                      )}
                      <span className="ml-auto hidden lg:flex items-center gap-2">
                        <span className="text-xs">Theme:</span>
                        <CustomDropdown
                          value={canvasTheme}
                          onChange={setCanvasTheme}
                          options={[
                            { id: "white", name: "Light" },
                            { id: "sepia", name: "Sepia" },
                            { id: "dark", name: "Dark" },
                          ]}
                        />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Content Editor Card */}
              <Card>
                <CardHeader className="border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-lg font-semibold">Content *</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateAISummary}
                        loading={aiGenerating}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span className="hidden sm:inline">AI Summary</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateTTS}
                        loading={loading}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span className="hidden sm:inline">TTS</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!previewMode ? (
                    <div className="p-4 sm:p-6">
                      <AdvancedRichTextEditor
                        value={formData.content}
                        onChange={(html) => handleInputChange("content", html)}
                        className={`${canvasTheme === "white" ? "" : canvasTheme === "sepia" ? "sepia" : "dark"} min-h-[400px] sm:min-h-[500px]`}
                      />
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6">
                      <div
                        className="prose prose-sm sm:prose lg:prose-lg max-w-none"
                        dangerouslySetInnerHTML={{
                          __html:
                            formData.content || "<p class='text-text-secondary italic'>No content yet. Start writing to see preview.</p>",
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* AI Summary Card */}
              {formData.summary && (
                <Card className="bg-primary-50/50 border-primary-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="w-5 h-5 text-primary" />
                      AI-Generated Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <p className="text-text-primary leading-relaxed text-sm sm:text-base">
                      {formData.summary}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-xs sm:text-sm text-success">
                        Summary generated successfully
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

          </div>
        </div>
      </div>


      {/* Publish Modal */}
      <Modal
        isOpen={showPublish}
        onClose={() => setShowPublish(false)}
        title="Story Preview"
        maxWidth="4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Preview */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Preview</label>
              <div className="bg-surface rounded-xl overflow-hidden border border-border shadow-sm">
                <div className="aspect-[16/9] bg-surface-hover relative group cursor-pointer" onClick={handleCoverUpload}>
                  {formData.coverImage ? (
                    <img
                      src={formData.coverImage}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary gap-2">
                      <Palette className="w-8 h-8 opacity-50" />
                      <span className="text-sm">Add a cover image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="pointer-events-none">
                      Change Image
                    </Button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg text-text-primary line-clamp-2">
                    {formData.title || "Untitled Story"}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {formData.summary || plainText.slice(0, 150) || "Write your story to see a summary here..."}
                  </p>
                  <div className="pt-2 text-xs text-text-secondary border-t border-border mt-2">
                    Note: This is how your story will appear in feeds.
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-only settings moved here for better flow on small screens */}
            <div className="md:hidden space-y-4">
              {/* ... mobile settings if needed ... */}
            </div>
          </div>

          {/* Right Column: Metadata */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="font-medium text-text-primary">Publishing Details</h3>
              <p className="text-sm text-text-secondary">
                Add tags and settings so readers can find your story.
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                Topics (Tags) <span className="text-xs font-normal opacity-70">Add up to 5</span>
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={tagQuery}
                    onChange={(e) => setTagQuery(e.target.value)}
                    placeholder="e.g. Technology, Life, Coding"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const tag = tagQuery.trim();
                        if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
                          setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                          setTagQuery('');
                        }
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const tag = tagQuery.trim();
                      if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
                        setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                        setTagQuery('');
                      }
                    }}
                    disabled={!tagQuery.trim() || formData.tags.length >= 5}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[2rem]">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 p-0.5 hover:bg-error/10 hover:text-error rounded-full transition-colors"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </button>
                    </Badge>
                  ))}
                  {formData.tags.length === 0 && (
                    <span className="text-sm text-text-secondary italic">No tags added yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Mood & Language */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Mood</label>
                <CustomDropdown
                  value={formData.mood}
                  onChange={(val) => handleInputChange("mood", val)}
                  options={moods}
                  optionLabelKey="name"
                  optionValueKey="id"
                  placeholder="Select mood"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Language</label>
                <CustomDropdown
                  value={formData.language}
                  onChange={(val) => handleInputChange("language", val)}
                  options={languages}
                  optionLabelKey="name"
                  optionValueKey="code"
                />
              </div>
            </div>

            {/* Series */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Series (Optional)</label>
              <Input
                value={formData.series}
                onChange={(e) => handleInputChange("series", e.target.value)}
                placeholder="Add to a series..."
              />
            </div>

            {/* Settings */}
            <div className="space-y-3 pt-2 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <span className="text-sm text-text-primary">Make this story public</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.allowComments}
                  onChange={(e) => handleInputChange("allowComments", e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <span className="text-sm text-text-primary">Allow comments</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.generateTTS}
                  onChange={(e) => handleInputChange("generateTTS", e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <span className="text-sm text-text-primary">Generate audio version</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                variant="ghost"
                onClick={() => setShowPublish(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmPublish}
                disabled={loading}
                loading={loading}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8"
              >
                Publish Now
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Shortcuts Modal */}
      <Modal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        title="Keyboard shortcuts"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="font-medium mb-1">Formatting</div>
            <ul className="space-y-1">
              <li>Bold: Ctrl/⌘ + B</li>
              <li>Italic: Ctrl/⌘ + I</li>
              <li>Bullet list: Ctrl/⌘ + Shift + 8</li>
              <li>Ordered list: Ctrl/⌘ + Shift + 7</li>
              <li>Code block: Ctrl/⌘ + Alt + C</li>
              <li>Blockquote: Ctrl/⌘ + Shift + 9</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Editing</div>
            <ul className="space-y-1">
              <li>Undo: Ctrl/⌘ + Z</li>
              <li>Redo: Ctrl/⌘ + Shift + Z</li>
              <li>Heading 1/2/3: Ctrl/⌘ + Alt + 1/2/3</li>
              <li>Link: Ctrl/⌘ + K</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => setShowShortcuts(false)}>
            Close
          </Button>
        </div>
      </Modal>
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto p-4 h-full flex flex-col gap-3">
            <div className="flex items-center justify-between mt-20">
              <div className="text-sm text-text-secondary">
                Distraction-free mode
              </div>
              <div className="flex items-center gap-2">
                <CustomDropdown
                  value={canvasTheme}
                  onChange={setCanvasTheme}
                  options={[
                    { id: "white", name: "White" },
                    { id: "sepia", name: "Sepia" },
                    { id: "dark", name: "Dark" },
                  ]}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                >
                  Exit
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="p-2">
                <AdvancedRichTextEditor
                  value={formData.content}
                  onChange={(html) => handleInputChange("content", html)}
                  className={`${canvasTheme === "white" ? "" : canvasTheme === "sepia" ? "sepia" : "dark"} min-h-[70vh]`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateBlogPage;
