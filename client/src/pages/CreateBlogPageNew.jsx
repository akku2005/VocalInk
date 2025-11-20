import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Save,
  Eye,
  Send,
  Image as ImageIcon,
  X,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import BlockEditor from "../components/editor/BlockEditor";
import ImageUploader from "../components/editor/ImageUploader";
import { apiService } from "../services/api";
import { resolveAssetUrl } from "../constants/apiConfig";
import { useToast } from "../hooks/useToast";
import { storage } from "../utils/storage";

const CreateBlogPageNew = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    tags: [],
    coverImage: "",
    isPublic: true,
    allowComments: true,
  });

  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Auto-save draft to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (storage.available && (formData.title || formData.content)) {
        storage.setItem("blog_draft", JSON.stringify(formData));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    if (!storage.available) return;
    const draft = storage.getItem("blog_draft");
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
        addToast({ type: "info", message: "Draft restored" });
      } catch (e) {
        console.error("Failed to restore draft");
      }
    }
  }, []);

  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await apiService.upload("/images/upload", file);
      const imageUrl = resolveAssetUrl(response.data.url || response.data.data?.url);
      
      addToast({ type: "success", message: "Image uploaded" });
      return imageUrl;
    } catch (error) {
      addToast({ type: "error", message: "Image upload failed" });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCoverImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      if (event.preventDefault) {
        event.preventDefault();
      }
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }
      const file = target.files?.[0];
      if (file) {
        const url = await handleImageUpload(file);
        if (url) {
          setFormData((prev) => ({ ...prev, coverImage: url }));
        }
      }
    };
    input.click();
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim()) && formData.tags.length < 5) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      await apiService.post("/blogs/draft", formData);
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
    if (!formData.content.trim() || formData.content.length < 100) {
      addToast({ type: "error", message: "Content must be at least 100 characters" });
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.post("/blogs", formData);
      addToast({ type: "success", message: "Blog published successfully!" });
      if (storage.available) {
        storage.removeItem("blog_draft");
      }
      navigate(`/blog/${response.data.data._id}`);
    } catch (error) {
      addToast({ type: "error", message: error.response?.data?.message || "Failed to publish" });
    } finally {
      setLoading(false);
      setShowPublishModal(false);
    }
  };

  const wordCount = formData.content.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 200);

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
                  {formData.title || "Untitled Story"}
                </h1>
                <p className="text-xs text-gray-500">
                  {wordCount} words · {readTime} min read
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {uploadingImage && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="hidden sm:flex"
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? "Edit" : "Preview"}
              </Button>

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
        {!previewMode ? (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Cover Image */}
            <div className="p-8 pb-0">
              <ImageUploader
                currentImage={formData.coverImage}
                onUpload={async (file) => {
                  const url = await handleImageUpload(file);
                  if (url) {
                    setFormData((prev) => ({ ...prev, coverImage: url }));
                  }
                }}
                onRemove={() => setFormData((prev) => ({ ...prev, coverImage: "" }))}
              />
            </div>

            {/* Title */}
            <div className="p-8 pb-0">
              <textarea
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full text-4xl font-bold placeholder-gray-300 border-none focus:outline-none resize-none"
                rows="2"
                style={{ fontFamily: "Georgia, serif" }}
              />
            </div>

            {/* Tags */}
            <div className="px-8 py-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="default" className="flex items-center gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {formData.tags.length < 5 && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (max 5)"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleAddTag} disabled={!currentTag.trim()}>
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Editor */}
            <BlockEditor
              value={formData.content}
              onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
              onImageUpload={handleImageUpload}
            />
          </div>
        ) : (
          /* Preview Mode */
          <div className="bg-white rounded-lg shadow-sm p-8">
            {formData.coverImage && (
              <img
                src={formData.coverImage}
                alt="Cover"
                className="w-full h-64 object-cover rounded-lg mb-8"
              />
            )}
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: "Georgia, serif" }}>
              {formData.title || "Untitled Story"}
            </h1>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {formData.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            )}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: formData.content }}
            />
          </div>
        )}
      </div>

      {/* Publish Modal */}
      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Ready to publish?"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Make this post public</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowComments}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, allowComments: e.target.checked }))
                }
                className="w-4 h-4"
              />
              <span className="text-sm">Allow comments</span>
            </label>
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
              <Check className="w-4 h-4 mr-2" />
              Publish Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateBlogPageNew;
