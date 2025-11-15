import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  Send,
  ArrowLeft,
  Plus,
  X,
  GripVertical,
  BookOpen,
  List,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";
import seriesService from "../services/seriesService";
import blogService from "../services/blogService";

const CreateSeriesPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "educational_course", // Default category
    coverImage: "", // Cloudinary URL (after upload)
    coverImageKey: "", // Cloudinary public ID
    blogs: [],
    isPublic: true,
  });

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [availableBlogs, setAvailableBlogs] = useState([]);
  const [showBlogSelector, setShowBlogSelector] = useState(false);
  const [seriesId, setSeriesId] = useState(null);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogsError, setBlogsError] = useState(null);
  const [searchBlogQuery, setSearchBlogQuery] = useState("");
  const toastRef = useRef(null);

  // Handle toast notifications after state updates
  useEffect(() => {
    if (toastRef.current) {
      const { type, message } = toastRef.current;
      addToast({ type, message });
      toastRef.current = null;
    }
  }, [formData.blogs, addToast]);

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      await apiService.post("/series/draft", formData);
      addToast({ type: "success", message: "Draft saved" });
    } catch (error) {
      addToast({ type: "error", message: "Failed to save draft" });
    } finally {
      setLoading(false);
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      addToast({ type: "error", message: "File size must be less than 5MB" });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      addToast({ type: "error", message: "File must be an image (JPEG, PNG, GIF, or WebP)" });
      return;
    }

    setCoverImageFile(file);
    const preview = URL.createObjectURL(file);
    setCoverImagePreview(preview);
  };

  const handleRemoveCoverImage = () => {
    setCoverImageFile(null);
    if (coverImagePreview) {
      URL.revokeObjectURL(coverImagePreview);
    }
    setCoverImagePreview(null);
    setFormData(prev => ({ ...prev, coverImage: "", coverImageKey: "" }));
  };

  const uploadCoverImage = async (id) => {
    if (!coverImageFile) return;

    try {
      const result = await seriesService.uploadCoverImage(id, coverImageFile);
      setFormData(prev => ({
        ...prev,
        coverImage: result.coverImage,
        coverImageKey: result.coverImageKey
      }));
      addToast({ type: "success", message: "Cover image uploaded successfully!" });
      setCoverImageFile(null);
      if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview);
      }
      setCoverImagePreview(null);
    } catch (error) {
      addToast({
        type: "error",
        message: error.message || "Failed to upload cover image",
      });
      throw error;
    }
  };

  const handlePublish = async () => {
    if (!formData.title.trim()) {
      addToast({ type: "error", message: "Title is required" });
      return;
    }
    if (!formData.description.trim()) {
      addToast({ type: "error", message: "Description is required" });
      return;
    }
    if (!coverImageFile && !formData.coverImage.trim()) {
      addToast({ type: "error", message: "Cover image is required. Please upload an image." });
      return;
    }
    if (formData.blogs.filter((b) => b && b.trim()).length === 0) {
      addToast({ type: "error", message: "Add at least one blog to the series" });
      return;
    }

    try {
      setLoading(true);
      
      // Format data for backend - convert blogs to episodes format
      const seriesPayload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        coverImage: formData.coverImage,
        coverImageKey: formData.coverImageKey,
        isPublic: formData.isPublic,
        visibility: formData.isPublic ? 'public' : 'private',
        status: 'active',
        episodes: formData.blogs
          .filter((b) => b && b.trim()) // Filter out empty blogs
          .map((blogId, index) => ({
            episodeId: blogId,
            order: index + 1,
            status: 'published'
          }))
      };

      // First, create the series
      const response = await apiService.post("/series", seriesPayload);
      const newSeriesId = response.data.data._id;
      setSeriesId(newSeriesId);

      // Then upload cover image if provided
      if (coverImageFile) {
        await uploadCoverImage(newSeriesId);
      }

      addToast({ type: "success", message: "Series published successfully!" });
      navigate(`/series/${newSeriesId}`);
    } catch (error) {
      console.error('Publish error:', error);
      addToast({
        type: "error",
        message: error.response?.data?.message || "Failed to publish series",
      });
    } finally {
      setLoading(false);
      setShowPublishModal(false);
    }
  };

  const handleAddBlog = (blogId) => {
    if (!formData.blogs.includes(blogId)) {
      setFormData((prev) => ({
        ...prev,
        blogs: [...prev.blogs, blogId],
      }));
    }
  };

  const handleRemoveBlog = (blogId) => {
    setFormData((prev) => ({
      ...prev,
      blogs: prev.blogs.filter((id) => id !== blogId),
    }));
  };

  const fetchAvailableBlogs = async () => {
    try {
      setBlogsLoading(true);
      setBlogsError(null);
      const blogs = await blogService.getBlogs({
        status: 'published',
        limit: 100
      });
      setAvailableBlogs(blogs || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setBlogsError('Failed to load blogs. Please try again.');
      setAvailableBlogs([]);
    } finally {
      setBlogsLoading(false);
    }
  };

  const handleOpenBlogSelector = () => {
    setSearchBlogQuery("");
    fetchAvailableBlogs();
    setShowBlogSelector(true);
  };

  const handleAddBlogFromModal = (blogId) => {
    const isAlreadyAdded = formData.blogs.includes(blogId);
    
    if (isAlreadyAdded) {
      // Remove blog if already added (toggle behavior)
      toastRef.current = { type: "info", message: "Blog removed from series" };
      setFormData((prev) => ({
        ...prev,
        blogs: prev.blogs.filter((id) => id !== blogId),
      }));
    } else {
      // Add blog if not already added (prevent duplicates)
      toastRef.current = { type: "success", message: "Blog added to series" };
      setFormData((prev) => {
        // Double-check to prevent duplicates
        if (prev.blogs.includes(blogId)) {
          return prev;
        }
        return {
          ...prev,
          blogs: [...prev.blogs, blogId],
        };
      });
    }
  };

  // Filter blogs based on search query
  const filteredBlogs = availableBlogs.filter((blog) => {
    const query = searchBlogQuery.toLowerCase();
    return (
      blog.title?.toLowerCase().includes(query) ||
      blog.summary?.toLowerCase().includes(query) ||
      blog._id?.includes(query)
    );
  });

  const handleReorderBlogs = (fromIndex, toIndex) => {
    const newBlogs = [...formData.blogs];
    const [removed] = newBlogs.splice(fromIndex, 1);
    newBlogs.splice(toIndex, 0, removed);
    setFormData((prev) => ({ ...prev, blogs: newBlogs }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-surface/50 dark:bg-white/5 backdrop-blur-sm border-b border-[var(--border-color)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-[var(--secondary-btn-hover)] rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-text-primary">
                  {formData.title || "New Series"}
                </h1>
                <p className="text-xs text-text-secondary">
                  {formData.blogs.length} blog{formData.blogs.length !== 1 ? "s" : ""} in series
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                loading={loading}
              >
                <Save className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Save Draft</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setShowPublishModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Publish</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Series Info Card */}
          <Card className="bg-surface/50 dark:bg-white/5 backdrop-blur-sm border border-[var(--border-color)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <BookOpen className="w-5 h-5" />
                Series Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Series Title *
                </label>
                <Input
                  placeholder="Enter series title..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="text-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Describe what this series is about..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows="4"
                  className="w-full px-3 py-2 border border-[var(--border-color)] bg-background text-text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Cover Image (Optional)
                </label>
                {coverImagePreview ? (
                  <div className="relative">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-lg border border-[var(--border-color)]"
                    />
                    <button
                      onClick={handleRemoveCoverImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-color)] rounded-lg cursor-pointer hover:bg-[var(--secondary-btn)] transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-text-secondary mb-2" />
                      <p className="text-sm text-text-secondary">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-text-secondary">
                        PNG, JPG, GIF or WebP (max 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Blogs in Series Card */}
          <Card className="bg-surface/50 dark:bg-white/5 backdrop-blur-sm border border-[var(--border-color)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-text-primary">
                  <List className="w-5 h-5" />
                  Blogs in Series ({formData.blogs.filter((b) => b && b.trim()).length})
                </CardTitle>
                <Button
                  size="sm"
                  onClick={handleOpenBlogSelector}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Blog
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.blogs.length === 0 ? (
                <div className="text-center py-12">
                  <List className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary mb-4">No blogs added yet</p>
                  <Button
                    size="sm"
                    onClick={handleOpenBlogSelector}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Blog
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.blogs
                    .filter((blogId) => blogId && blogId.trim()) // Filter out null/undefined/empty strings
                    .map((blogId, index) => (
                      <div
                        key={`${blogId}-${index}`}
                        className="flex items-center gap-3 p-3 bg-[var(--secondary-btn)] rounded-lg hover:bg-[var(--secondary-btn-hover)] transition-colors"
                      >
                        <GripVertical className="w-5 h-5 text-text-secondary cursor-move" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-secondary">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium text-text-primary">Blog ID: {blogId}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveBlog(blogId)}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-surface/50 dark:bg-white/5 backdrop-blur-sm border border-[var(--border-color)]">
            <CardContent className="p-4">
              <h3 className="font-semibold text-text-primary mb-2">💡 Series Tips</h3>
              <ul className="space-y-1 text-sm text-text-secondary">
                <li>• Organize related blogs into a cohesive series</li>
                <li>• Arrange blogs in logical reading order</li>
                <li>• Add a descriptive title and overview</li>
                <li>• Series help readers follow your content journey</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Publish Modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Series"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
                }
                className="w-4 h-4"
              />
              <span className="text-sm">Make this series public</span>
            </label>
          </div>

          <div className="bg-[var(--secondary-btn)] p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-text-primary">Series Summary</h4>
            <div className="space-y-1 text-sm text-text-secondary">
              <p>
                <strong>Title:</strong> {formData.title || "Untitled"}
              </p>
              <p>
                <strong>Blogs:</strong> {formData.blogs.length}
              </p>
              <p>
                <strong>Visibility:</strong> {formData.isPublic ? "Public" : "Private"}
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPublishModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              loading={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Publish Series
            </Button>
          </div>
        </div>
      </Modal>

      {/* Blog Selector Modal */}
      <Modal
        isOpen={showBlogSelector}
        onClose={() => setShowBlogSelector(false)}
        title="Select Blogs"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-text-secondary">
            Select blogs to add to your series. You can reorder them later.
          </p>

          {/* Search Input */}
          <Input
            type="text"
            placeholder="Search blogs by title or ID..."
            value={searchBlogQuery}
            onChange={(e) => setSearchBlogQuery(e.target.value)}
            className="w-full"
          />

          {/* Loading State */}
          {blogsLoading && (
            <div className="text-center py-8">
              <p className="text-text-secondary">Loading blogs...</p>
            </div>
          )}

          {/* Error State */}
          {blogsError && !blogsLoading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600">{blogsError}</p>
              <Button
                size="sm"
                onClick={fetchAvailableBlogs}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Blogs List */}
          {!blogsLoading && !blogsError && filteredBlogs.length > 0 && (
            <div className="space-y-2">
              {filteredBlogs.map((blog) => {
                const isSelected = formData.blogs.includes(blog._id);
                return (
                  <div
                    key={blog._id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-[var(--border-color)] hover:bg-[var(--secondary-btn)]"
                    }`}
                    onClick={() => handleAddBlogFromModal(blog._id)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleAddBlogFromModal(blog._id)}
                        className="mt-1 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text-primary truncate">
                          {blog.title}
                        </h4>
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {blog.summary || blog.excerpt}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          ID: {blog._id}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!blogsLoading && !blogsError && filteredBlogs.length === 0 && availableBlogs.length > 0 && (
            <div className="text-center py-8">
              <p className="text-text-secondary">No blogs match your search</p>
            </div>
          )}

          {/* No Blogs Available */}
          {!blogsLoading && !blogsError && availableBlogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-secondary">No published blogs available</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
            <Button
              variant="outline"
              onClick={() => setShowBlogSelector(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateSeriesPage;
