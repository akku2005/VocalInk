import { useState, useEffect } from "react";
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
  Zap,
  Mic,
  Volume2,
  Globe,
  Tag,
  BookOpen,
  Sparkles,
  Palette,
  Languages,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import RichTextEditor from "../components/ui/RichTextEditor";
import Modal from "../components/ui/Modal";
import CustomDropdown from "../components/ui/CustomDropdown";

const debounce = (fn, delay) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

const CreateBlogPage = () => {
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
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleCoverUpload = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const resp = await apiService.upload("/uploads/image", file);
        const url = resp.data.url.startsWith("http")
          ? resp.data.url
          : `/api${resp.data.url}`;
        handleInputChange("coverImage", url);
      };
      input.click();
    } catch (e) {
      console.error("Cover upload failed", e);
    }
  };

  const generateAISummary = async () => {
    if (!formData.content.trim()) return;
    setAiGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockSummary = `This article explores ${formData.title.toLowerCase()} and provides insights into the latest trends and developments. Readers will discover practical tips and actionable strategies to implement in their own work.`;
      setFormData((prev) => ({ ...prev, summary: mockSummary }));
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setAiGenerating(false);
    }
  };

  const generateTTS = async () => {
    if (!formData.content.trim()) return;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("TTS generated successfully");
    } catch (error) {
      console.error("Error generating TTS:", error);
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
      const res = await apiService.post("/blogs/addBlog", payload);
      console.log("Blog saved:", res.data);
      if (!isDraft) {
        localStorage.removeItem("createBlogDraft");
      }
    } catch (error) {
      console.error("Error saving blog:", error);
    } finally {
      setLoading(false);
    }
  };

  const plainText = (formData.content || "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, " ")
    .trim();
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 200);

  const validateBeforePublish = () => {
    const e = [];
    if (!formData.title.trim()) e.push("Title is required");
    if (!plainText) e.push("Content cannot be empty");
    if (formData.tags.length === 0) e.push("Add at least one tag");
    setErrors(e);
    return e.length === 0;
  };

  const openPublish = () => {
    if (validateBeforePublish()) setShowPublish(true);
    else setShowPublish(true); // still open and show errors
  };

  const confirmPublish = async () => {
    if (!validateBeforePublish()) return;
    await handleSave(false);
    setShowPublish(false);
  };

  const debouncedPersist = debounce((data) => {
    try {
      localStorage.setItem("createBlogDraft", JSON.stringify(data));
      setLastSavedAt(new Date());
    } catch (e) {
      console.warn("Persist draft failed", e);
    }
  }, 800);

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

  useEffect(() => {
    debouncedPersist(formData);
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Create New Blog Post
          </h1>
          <p className="text-text-secondary">
            Share your thoughts with the VocalInk community
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 border border-[var(--border-color)] hover:bg-[var(--secondary-btn-hover2)]"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? "Edit" : "Preview"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            loading={loading}
            className="flex items-center gap-2 border border-[var(--border-color)] hover:bg-[var(--secondary-btn-hover2)]"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={openPublish}
            loading={loading}
            className="flex items-center gap-2 bg-[var(--secondary-btn2)] hover:bg-[var(--secondary-btn-hover2)] text-[var(--text-color)]"
          >
            <BookOpen className="w-4 h-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full bg-transparent outline-none text-3xl lg:text-4xl font-extrabold tracking-tight placeholder:text-[var(--placeholder-texts)] border-b border-transparent focus:border-border pb-2"
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
                  <span className="hidden md:inline-flex items-center gap-1">
                    <button
                      onClick={() => setShowShortcuts(true)}
                      className="underline hover:no-underline"
                    >
                      Keyboard shortcuts
                    </button>
                  </span>
                  {lastSavedAt && (
                    <span className="text-xs ml-2">
                      Last saved {lastSavedAt.toLocaleTimeString()}
                    </span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-2">
                    <span>Canvas</span>
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
                      onClick={() => setIsFullscreen(true)}
                      className=" border border-[var(--border-color)]"
                    >
                      Full screen
                    </Button>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between ">
                <span className="font-medium">Content *</span>
                <div className="flex items-center gap-2 ">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAISummary}
                    loading={aiGenerating}
                    className="flex items-center gap-1 hover:bg-[var(--secondary-btn-hover2)]"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Summary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateTTS}
                    loading={loading}
                    className="flex items-center gap-1 hover:bg-[var(--secondary-btn-hover2)]"
                  >
                    <Volume2 className="w-4 h-4" />
                    Generate TTS
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!previewMode ? (
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => handleInputChange("content", html)}
                  className={`${canvasTheme === "white" ? "" : canvasTheme === "sepia" ? "sepia" : "dark"} min-h-96`}
                />
              ) : (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html:
                      formData.content || "<p><em>No content yet</em></p>",
                  }}
                />
              )}
            </CardContent>
          </Card>

          {formData.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                  AI-Generated Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-text-primary leading-relaxed">
                  {formData.summary}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">
                    Summary generated successfully
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-medium">
                <Palette className="w-5 h-5 text-primary-500" />
                Mood
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => handleInputChange("mood", mood.id)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      formData.mood === mood.id
                        ? "  bg-primary-50"
                        : " border border-[var(--border-color)] hover:border-primary-200"
                    }`}
                  >
                    <div className="text-lg mb-1">{mood.icon}</div>
                    <div className="text-sm font-medium text-text-primary">
                      {mood.name}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-medium">
                <Globe className="w-5 h-5 text-primary-500" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <CustomDropdown
                label="Language"
                value={formData.language} // selected value
                onChange={(val) => handleInputChange("language", val)} // update formData
                options={languages} // your array of languages
                optionLabelKey="name" // which key should be shown as label
                optionValueKey="code" // which key should be used as value
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-medium">
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
                    value={tagQuery}
                    onChange={(e) => setTagQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        const tag = tagQuery.trim();
                        if (
                          tag &&
                          !formData.tags.includes(tag) &&
                          formData.tags.length < 5
                        ) {
                          setFormData((prev) => ({
                            ...prev,
                            tags: [...prev.tags, tag],
                          }));
                          setTagQuery("");
                        }
                      }
                    }}
                    className="flex-1 border border-[var(--border-color)]"
                  />
                  <Button
                    className="border-none text-[var(--text-color)] bg-[var(--secondary-btn2)] hover:bg-[var(--secondary-btn-hover2)] py-1"
                    onClick={() => {
                      const tag = tagQuery.trim();
                      if (
                        tag &&
                        !formData.tags.includes(tag) &&
                        formData.tags.length < 5
                      ) {
                        setFormData((prev) => ({
                          ...prev,
                          tags: [...prev.tags, tag],
                        }));
                        setTagQuery("");
                      }
                    }}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>

                {filteredTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filteredTags.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          if (formData.tags.length < 5) {
                            setFormData((prev) => ({
                              ...prev,
                              tags: [...prev.tags, t],
                            }));
                            setTagQuery("");
                          }
                        }}
                        className="px-2 py-1 rounded bg-secondary-100 hover:bg-secondary-200 text-xs"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
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
                    {formData.tags.length >= 5 && (
                      <span className="text-xs text-text-secondary">
                        Max 5 tags
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm text-text-secondary mb-2">
                    Suggested tags:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedTags.slice(0, 8).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (
                            !formData.tags.includes(tag) &&
                            formData.tags.length < 5
                          ) {
                            setFormData((prev) => ({
                              ...prev,
                              tags: [...prev.tags, tag],
                            }));
                          }
                        }}
                        className="text-xs px-2 py-1 bg-secondary-100 text-text-secondary rounded hover:bg-secondary-200 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-medium">
                <BookOpen className="w-5 h-5 text-primary-500" />
                Series (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Input
                className="border border-[var(--border-color)] text-[var(--text-color)]"
                type="text"
                placeholder="Add to a series..."
                value={formData.series}
                onChange={(e) => handleInputChange("series", e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-medium">
                <Globe className="w-5 h-5 text-primary-500 " />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    handleInputChange("isPublic", e.target.checked)
                  }
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-border rounded"
                />
                <span className="text-sm text-text-primary">
                  Make this post public
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.allowComments}
                  onChange={(e) =>
                    handleInputChange("allowComments", e.target.checked)
                  }
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-border rounded"
                />
                <span className="text-sm text-text-primary">
                  Allow comments
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.generateTTS}
                  onChange={(e) =>
                    handleInputChange("generateTTS", e.target.checked)
                  }
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-border rounded"
                />
                <span className="text-sm text-text-primary">
                  Generate audio version
                </span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-5 h-5" />
                Publishing Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-2 text-sm text-primary-700">
                <li>• Use a compelling title to grab attention</li>
                <li>• Include relevant tags for better discovery</li>
                <li>• Choose the right mood for your content</li>
                <li>• Consider creating a series for related posts</li>
                <li>• Enable TTS for better accessibility</li>
              </ul>
            </CardContent>
          </Card>
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
                    className="ml-1 hover:text-error"
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

      {/* Fullscreen Writer */}
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
                <RichTextEditor
                  value={formData.content}
                  onChange={(html) => handleInputChange("content", html)}
                  className={`${canvasTheme === "white" ? "" : canvasTheme === "sepia" ? "sepia" : "dark"} min-h-[70vh]`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBlogPage;
