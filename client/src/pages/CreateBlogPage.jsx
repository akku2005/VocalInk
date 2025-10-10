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
          const resp = await apiService.upload('/uploads/image', file);
          const url = resp.data.url.startsWith('http') ? resp.data.url : `/api${resp.data.url}`;
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
        localStorage.removeItem('createBlogDraft');
        addToast({ type: 'success', message: 'Blog published successfully!' });
        
        // Navigate to the article page after successful publish
        if (res.data && res.data.data && res.data.data._id) {
          navigate(`/article/${res.data.data._id}`);
        } else if (res.data && res.data._id) {
          navigate(`/article/${res.data._id}`);
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
    if (formData.tags.length === 0) e.push("Add at least one tag");
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
    try {
      localStorage.setItem("createBlogDraft", JSON.stringify(data));
      setLastSavedAt(new Date());
    } catch (e) {
      console.warn("Persist draft failed", e);
    }
  }, 800);

  // Effect to load draft from local storage on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("createBlogDraft");
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Editor Column */}
          <div className="lg:col-span-8 space-y-6">
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

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Mood Card */}
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Palette className="w-5 h-5 text-primary" />
                  Mood
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => handleInputChange("mood", mood.id)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left hover:scale-105 ${
                        formData.mood === mood.id
                          ? "border-primary bg-primary-50 shadow-sm"
                          : "border-border hover:border-primary-300"
                      }`}
                    >
                      <div className="text-2xl mb-1">{mood.icon}</div>
                      <div className="text-xs font-medium text-text-primary">
                        {mood.name}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Language Card */}
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Globe className="w-5 h-5 text-primary" />
                  Language
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <CustomDropdown
                  value={formData.language}
                  onChange={(val) => handleInputChange("language", val)}
                  options={languages}
                  optionLabelKey="name"
                  optionValueKey="code"
                />
              </CardContent>
            </Card>

            {/* Tags Card */}
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Tag className="w-5 h-5 text-primary" />
                  Tags
                  <span className="ml-auto text-xs font-normal text-text-secondary">
                    {formData.tags.length}/5
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Type and press Enter..."
                      value={tagQuery}
                      onChange={(e) => setTagQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const tag = tagQuery.trim();
                          if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
                            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                            setTagQuery('');
                            addToast({ type: 'success', message: `Tag added` });
                          } else if (formData.tags.length >= 5) {
                            addToast({ type: 'warning', message: 'Max 5 tags' });
                          }
                        }
                      }}
                      className="flex-1 text-sm"
                      disabled={formData.tags.length >= 5}
                    />
                    <Button
                      onClick={() => {
                        const tag = tagQuery.trim();
                        if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
                          setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                          setTagQuery('');
                          addToast({ type: 'success', message: `Tag added` });
                        } else if (formData.tags.length >= 5) {
                          addToast({ type: 'warning', message: 'Max 5 tags' });
                        }
                      }}
                      size="sm"
                      disabled={formData.tags.length >= 5 || !tagQuery.trim()}
                  >
                    Add
                  </Button>
                </div>

                  {/* Selected Tags */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="default"
                          className="flex items-center gap-1 text-xs"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-error"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Suggested Tags */}
                  {formData.tags.length < 5 && (
                    <div>
                      <p className="text-xs text-text-secondary mb-2">Suggested:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedTags.slice(0, 6).filter(t => !formData.tags.includes(t)).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              if (formData.tags.length < 5) {
                                setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                                addToast({ type: 'success', message: `Tag added` });
                              }
                            }}
                            className="text-xs px-2 py-1 bg-secondary-100 text-text-secondary rounded-full hover:bg-primary-100 hover:text-primary transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Series Card */}
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Series
                  <span className="ml-auto text-xs font-normal text-text-secondary">Optional</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Input
                  type="text"
                  placeholder="Add to a series..."
                  value={formData.series}
                  onChange={(e) => handleInputChange("series", e.target.value)}
                  className="text-sm"
                />
              </CardContent>
            </Card>

            {/* Settings Card */}
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Globe className="w-5 h-5 text-primary" />
                  Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    handleInputChange("isPublic", e.target.checked)
                  }
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <span className="text-sm text-text-primary group-hover:text-primary transition-colors">
                  Make this post public
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.allowComments}
                  onChange={(e) =>
                    handleInputChange("allowComments", e.target.checked)
                  }
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <span className="text-sm text-text-primary group-hover:text-primary transition-colors">
                  Allow comments
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.generateTTS}
                  onChange={(e) =>
                    handleInputChange("generateTTS", e.target.checked)
                  }
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <span className="text-sm text-text-primary group-hover:text-primary transition-colors">
                  Generate audio version
                </span>
              </label>
            </CardContent>
          </Card>

            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
              <CardHeader className="border-b border-primary-200">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Publishing Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="space-y-2 text-xs sm:text-sm text-text-primary">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Use a compelling title</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Add relevant tags</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Choose the right mood</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">✓</span>
                    <span>Enable TTS for accessibility</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

      {/* Publish Modal */}
      <Modal
        isOpen={showPublish}
        onClose={() => setShowPublish(false)}
        title="Publish story"
      >
        <div className="space-y-4">
          {errors.length > 0 && (
            <div className="p-3 rounded border border-error/40 text-error text-sm">
              <ul className="list-disc pl-5">
                {errors.map((er) => (
                  <li key={er}>{er}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Add a title"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">
              Tags (up to 5)
            </label>
            <div className="flex gap-2">
              <Input
                value={currentTag}
                className="border border-[var(--border-color)] text-[var(--text-color)] "
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button
                size="sm"
                onClick={handleAddTag}
                className="border-none text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover2)] bg-[var(--secondary-btn2)]"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="default"
                  className="flex items-center gap-1"
                >
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
          </div>
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Cover image</label>
            <div className="flex gap-2">
              <Input
                value={formData.coverImage}
                onChange={(e) =>
                  handleInputChange("coverImage", e.target.value)
                }
                className="text-[var(--text-color)] border border-[var(--border-color)] "
                placeholder="Paste image URL"
              />
              <Button
                variant="outline"
                className=" border-none text-[var(--text-color)] hover:bg-[var(--secondary-btn-hover2)] bg-[var(--secondary-btn2)] py-1"
                onClick={handleCoverUpload}
              >
                Upload
              </Button>
            </div>
            {formData.coverImage && (
              <img
                src={formData.coverImage}
                alt="Cover"
                className="mt-2 w-full rounded border border-border"
              />
            )}
          </div>
          <div className="space-y-2">
            <CustomDropdown
              label="Visibility"
              value={formData.isPublic ? "public" : "private"}
              onChange={(val) =>
                handleInputChange("isPublic", val === "public")
              }
              options={visibilityOptions}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setShowPublish(false)}
            className="hover:bg-[var(--secondary-btn-hover2)] bg-[var(--secondary-btn2)] border-none"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmPublish}
            disabled={loading}
            loading={loading}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            Publish
          </Button>
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