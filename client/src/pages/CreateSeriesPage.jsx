import { useState } from "react";
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
} from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import { apiService } from "../services/api";
import { useToast } from "../hooks/useToast";

const CreateSeriesPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    coverImage: "",
    blogs: [],
    isPublic: true,
  });

  const [loading, setLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [availableBlogs, setAvailableBlogs] = useState([]);
  const [showBlogSelector, setShowBlogSelector] = useState(false);

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

  const handlePublish = async () => {
    if (!formData.title.trim()) {
      addToast({ type: "error", message: "Title is required" });
      return;
    }
    if (!formData.description.trim()) {
      addToast({ type: "error", message: "Description is required" });
      return;
    }
    if (formData.blogs.length === 0) {
      addToast({ type: "error", message: "Add at least one blog to the series" });
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.post("/series", formData);
      addToast({ type: "success", message: "Series published successfully!" });
      navigate(`/series/${response.data.data._id}`);
    } catch (error) {
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

  const handleReorderBlogs = (fromIndex, toIndex) => {
    const newBlogs = [...formData.blogs];
    const [removed] = newBlogs.splice(fromIndex, 1);
    newBlogs.splice(toIndex, 0, removed);
    setFormData((prev) => ({ ...prev, blogs: newBlogs }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {formData.title || "New Series"}
                </h1>
                <p className="text-xs text-gray-500">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Series Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  placeholder="Describe what this series is about..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image URL (Optional)
                </label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={formData.coverImage}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, coverImage: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Blogs in Series Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Blogs in Series ({formData.blogs.length})
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowBlogSelector(true)}
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
                  <List className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No blogs added yet</p>
                  <Button
                    size="sm"
                    onClick={() => setShowBlogSelector(true)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Blog
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.blogs.map((blogId, index) => (
                    <div
                      key={blogId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-medium">Blog ID: {blogId}</span>
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
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Series Tips</h3>
              <ul className="space-y-1 text-sm text-blue-800">
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

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Series Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
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
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select blogs to add to your series. You can reorder them later.
          </p>
          <div className="text-center py-8 text-gray-500">
            <p>Blog selection interface coming soon...</p>
            <p className="text-sm mt-2">
              For now, you can add blog IDs manually in the form above.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowBlogSelector(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateSeriesPage;
