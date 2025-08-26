import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
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
  Loader2
} from 'lucide-react';

const CreateBlogPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    tags: [],
    mood: '',
    language: 'en',
    series: '',
    isPublic: true,
    allowComments: true,
    generateTTS: false
  });

  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const generateAISummary = async () => {
    if (!formData.content.trim()) return;
    
    setAiGenerating(true);
    try {
      // Simulate AI API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSummary = `This article explores ${formData.title.toLowerCase()} and provides insights into the latest trends and developments. Readers will discover practical tips and actionable strategies to implement in their own work.`;
      
      setFormData(prev => ({ ...prev, summary: mockSummary }));
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const generateTTS = async () => {
    if (!formData.content.trim()) return;
    
    setLoading(true);
    try {
      // Simulate TTS API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('TTS generated successfully');
    } catch (error) {
      console.error('Error generating TTS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (isDraft = false) => {
    setLoading(true);
    try {
      // Simulate save API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Blog saved:', { ...formData, isDraft });
    } catch (error) {
      console.error('Error saving blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const wordCount = formData.content.split(/\s+/).filter(word => word.length > 0).length;
  const readTime = Math.ceil(wordCount / 200); // Average reading speed

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Create New Blog Post</h1>
          <p className="text-text-secondary">Share your thoughts with the VocalInk community</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSave(true)}
            loading={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave(false)}
            loading={loading}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateTTS}
                    loading={loading}
                    className="flex items-center gap-1"
                  >
                    <Volume2 className="w-4 h-4" />
                    Generate TTS
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <textarea
                placeholder="Start writing your blog post..."
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="w-full h-96 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                style={{ fontFamily: 'inherit' }}
              />
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
          {/* Mood Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary-500" />
                Mood
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => handleInputChange('mood', mood.id)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                      formData.mood === mood.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:border-primary-200'
                    }`}
                  >
                    <div className="text-lg mb-1">{mood.icon}</div>
                    <div className="text-sm font-medium text-text-primary">{mood.name}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Language Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-primary-500" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-text-primary"
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
                          className="ml-1 hover:text-error"
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

          {/* Publishing Tips */}
          <Card className="bg-primary-50 border-primary-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary-700">
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
    </div>
  );
};

export default CreateBlogPage; 