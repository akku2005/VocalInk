import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Search, Filter, Plus, Grid3X3, List, Layers, Users, Clock, BookOpen, TrendingUp, Star, Play } from 'lucide-react';

const SeriesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  // Sample series data based on server model
  const sampleSeries = [
    {
      id: 1,
      title: "Complete Web Development Bootcamp",
      description: "A comprehensive journey from HTML basics to full-stack development with modern frameworks and best practices.",
      summary: "Master web development from scratch with hands-on projects and real-world applications.",
      coverImage: "/api/series/1/cover",
      category: "Technology",
      template: "educational_course",
      difficulty: "beginner",
      tags: ["Web Development", "JavaScript", "React"],
      status: "active",
      visibility: "public",
      episodes: [
        { title: "Introduction to HTML", status: "published", order: 1 },
        { title: "CSS Fundamentals", status: "published", order: 2 },
        { title: "JavaScript Basics", status: "published", order: 3 },
        { title: "React Fundamentals", status: "draft", order: 4 },
        { title: "Backend with Node.js", status: "draft", order: 5 }
      ],
      author: {
        name: "Sarah Johnson",
        profilePicture: "/api/users/sarah/avatar"
      },
      analytics: {
        totalViews: 15420,
        totalReads: 8900,
        completionRate: 68,
        subscribers: 1240
      },
      collaborators: [
        { name: "Mike Chen", role: "contributor" },
        { name: "Emily Rodriguez", role: "reviewer" }
      ],
      isBookmarked: false,
      isSubscribed: false
    },
    {
      id: 2,
      title: "The Future of AI: A Deep Dive",
      description: "Explore the cutting-edge developments in artificial intelligence and their impact on various industries.",
      summary: "Comprehensive analysis of AI trends, technologies, and future implications.",
      coverImage: "/api/series/2/cover",
      category: "Technology",
      template: "research_journey",
      difficulty: "advanced",
      tags: ["Artificial Intelligence", "Machine Learning", "Future Tech"],
      status: "active",
      visibility: "premium",
      episodes: [
        { title: "AI Fundamentals", status: "published", order: 1 },
        { title: "Machine Learning Basics", status: "published", order: 2 },
        { title: "Deep Learning Revolution", status: "published", order: 3 },
        { title: "AI in Healthcare", status: "published", order: 4 },
        { title: "The Future of Work", status: "draft", order: 5 }
      ],
      author: {
        name: "Dr. Michael Chen",
        profilePicture: "/api/users/michael/avatar"
      },
      analytics: {
        totalViews: 8900,
        totalReads: 5600,
        completionRate: 72,
        subscribers: 890
      },
      collaborators: [],
      isBookmarked: true,
      isSubscribed: true
    },
    {
      id: 3,
      title: "Sustainable Living Chronicles",
      description: "A personal journey towards sustainable living with practical tips and real-world experiences.",
      summary: "Follow one family's transition to eco-friendly living with actionable advice.",
      coverImage: "/api/series/3/cover",
      category: "Lifestyle",
      template: "story_arc",
      difficulty: "beginner",
      tags: ["Sustainability", "Lifestyle", "Environment"],
      status: "active",
      visibility: "public",
      episodes: [
        { title: "Why We Started This Journey", status: "published", order: 1 },
        { title: "Reducing Plastic Waste", status: "published", order: 2 },
        { title: "Energy Conservation at Home", status: "published", order: 3 },
        { title: "Sustainable Food Choices", status: "draft", order: 4 },
        { title: "Community Impact", status: "draft", order: 5 }
      ],
      author: {
        name: "Alex Green",
        profilePicture: "/api/users/alex/avatar"
      },
      analytics: {
        totalViews: 6700,
        totalReads: 4200,
        completionRate: 85,
        subscribers: 560
      },
      collaborators: [
        { name: "Lisa Green", role: "contributor" }
      ],
      isBookmarked: false,
      isSubscribed: false
    }
  ];

  const categories = [
    { id: 'all', name: 'All Series', count: sampleSeries.length },
    { id: 'technology', name: 'Technology', count: 2 },
    { id: 'lifestyle', name: 'Lifestyle', count: 1 },
  ];

  const templates = [
    { id: 'all', name: 'All Templates', count: sampleSeries.length },
    { id: 'educational_course', name: 'Educational Course', count: 1 },
    { id: 'research_journey', name: 'Research Journey', count: 1 },
    { id: 'story_arc', name: 'Story Arc', count: 1 },
  ];

  const filteredSeries = sampleSeries.filter(series => {
    const matchesSearch = series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         series.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         series.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           series.category.toLowerCase() === selectedCategory;
    
    const matchesTemplate = selectedTemplate === 'all' || 
                           series.template === selectedTemplate;
    
    return matchesSearch && matchesCategory && matchesTemplate;
  });

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getTemplateIcon = (template) => {
    switch (template) {
      case 'educational_course':
        return <BookOpen className="w-4 h-4" />;
      case 'research_journey':
        return <TrendingUp className="w-4 h-4" />;
      case 'story_arc':
        return <Play className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      case 'expert':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const SeriesCard = ({ series }) => (
    <Card className="cursor-pointer group overflow-hidden">
      {/* Cover Image */}
      <div className="aspect-video bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 flex items-center justify-center relative">
        <div className="text-4xl text-primary-500 opacity-30">📚</div>
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="outline" className="text-xs px-2 py-1 bg-white/90 dark:bg-black/90">
            {getTemplateIcon(series.template)}
            <span className="ml-1">{series.template.replace('_', ' ')}</span>
          </Badge>
          <Badge variant={getDifficultyColor(series.difficulty)} className="text-xs px-2 py-1">
            {series.difficulty}
          </Badge>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          {series.visibility === 'premium' && (
            <Badge variant="warning" className="text-xs px-2 py-1">
              Premium
            </Badge>
          )}
          <button className="p-2 bg-white hover:bg-gray-50 dark:bg-black/80 dark:hover:bg-black rounded-lg transition-all duration-200 shadow-sm border border-gray-200 dark:border-gray-700">
            <Star className={`w-4 h-4 ${series.isBookmarked ? 'fill-current text-primary-500' : 'text-black dark:text-white'}`} />
          </button>
        </div>
      </div>
      
      <CardHeader className="space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {series.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs px-2 py-1">
              {tag}
            </Badge>
          ))}
          {series.tags.length > 2 && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              +{series.tags.length - 2}
            </Badge>
          )}
        </div>
        
        {/* Title */}
        <CardTitle className="text-xl line-clamp-2 group-hover:text-primary-500 transition-colors leading-tight">
          {series.title}
        </CardTitle>
        
        {/* Summary */}
        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
          {series.summary}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Author and Category */}
        <div className="flex items-center gap-4 text-xs text-text-secondary mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span className="font-medium">{series.author.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            <span>{series.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>{series.episodes.length} episodes</span>
          </div>
        </div>
        
        {/* Analytics */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{formatNumber(series.analytics.totalViews)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span className="font-medium">{formatNumber(series.analytics.subscribers)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{series.analytics.completionRate}%</span>
            </div>
          </div>
          <div className="text-xs text-text-secondary font-medium">
            {series.collaborators.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {series.collaborators.length} collaborators
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-4">
          Discover Series
        </h1>
        <p className="text-lg text-text-secondary max-w-3xl">
          Explore curated collections of interconnected content designed to take you on a learning journey. 
          From educational courses to story arcs, find series that match your interests and skill level.
        </p>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-surface/50 backdrop-blur-sm rounded-xl p-6 border border-border">
        <div className="flex-1 relative max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <Input
            type="text"
            placeholder="Search series, authors, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 text-base"
          />
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-background rounded-lg p-1 border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-primary-500 text-white shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-primary-500 text-white shadow-sm' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <Button className="flex items-center gap-2 h-12 px-6">
            <Plus className="w-4 h-4" />
            Create Series
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="space-y-4">
        {/* Categories */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">Categories:</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-surface hover:bg-primary-50 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">Templates:</span>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedTemplate === template.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-surface hover:bg-primary-50 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary'
                }`}
              >
                {template.name} ({template.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>Showing {filteredSeries.length} of {sampleSeries.length} series</span>
        <span>Updated {new Date().toLocaleDateString()}</span>
      </div>

      {/* Series Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredSeries.map((series) => (
          <SeriesCard key={series.id} series={series} />
        ))}
      </div>

      {/* Empty State */}
      {filteredSeries.length === 0 && (
        <div className="text-center py-12">
          <Layers className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No series found</h3>
          <p className="text-text-secondary mb-6">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
          <Button onClick={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedTemplate('all');
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default SeriesPage; 