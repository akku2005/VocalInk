import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  MessageCircle, 
  BookOpen, 
  Plus, 
  Edit,
  Share,
  Users,
  TrendingUp,
  Target,
  CheckCircle,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  Star,
  Bookmark,
  MoreHorizontal
} from 'lucide-react';

const SeriesTimelinePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSeries({
        id: id,
        title: 'AI in Content Creation',
        description: 'A comprehensive series exploring how artificial intelligence is transforming the content creation landscape, from writing assistants to automated optimization tools.',
        author: {
          name: 'Sarah Johnson',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face',
          username: 'sarahjohnson'
        },
        coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
        status: 'ongoing', // ongoing, completed, paused
        totalPosts: 8,
        publishedPosts: 6,
        totalViews: 45600,
        totalLikes: 3450,
        totalComments: 890,
        startedAt: '2023-11-01',
        lastUpdated: '2024-01-15',
        tags: ['AI', 'Content Creation', 'Technology', 'Writing'],
        progress: 75,
        posts: [
          {
            id: 1,
            title: 'Introduction to AI Writing Tools',
            excerpt: 'An overview of the current landscape of AI writing assistants and their capabilities.',
            status: 'published',
            publishedAt: '2023-11-01',
            readTime: 5,
            views: 12340,
            likes: 890,
            comments: 67,
            featured: true
          },
          {
            id: 2,
            title: 'GPT-4 and Advanced Language Models',
            excerpt: 'Deep dive into GPT-4 and other advanced language models for content creation.',
            status: 'published',
            publishedAt: '2023-11-08',
            readTime: 8,
            views: 9876,
            likes: 756,
            comments: 45,
            featured: false
          },
          {
            id: 3,
            title: 'AI-Powered Content Optimization',
            excerpt: 'How AI tools can optimize your content for better engagement and SEO performance.',
            status: 'published',
            publishedAt: '2023-11-15',
            readTime: 7,
            views: 8765,
            likes: 634,
            comments: 38,
            featured: false
          },
          {
            id: 4,
            title: 'Automated Content Distribution',
            excerpt: 'Strategies for using AI to automate content distribution across multiple platforms.',
            status: 'published',
            publishedAt: '2023-11-22',
            readTime: 6,
            views: 7654,
            likes: 523,
            comments: 29,
            featured: false
          },
          {
            id: 5,
            title: 'AI Ethics in Content Creation',
            excerpt: 'Important considerations about ethics and responsible use of AI in content creation.',
            status: 'published',
            publishedAt: '2023-11-29',
            readTime: 9,
            views: 6543,
            likes: 445,
            comments: 31,
            featured: false
          },
          {
            id: 6,
            title: 'Building Your AI Content Workflow',
            excerpt: 'Practical guide to integrating AI tools into your existing content creation workflow.',
            status: 'published',
            publishedAt: '2023-12-06',
            readTime: 10,
            views: 5432,
            likes: 387,
            comments: 25,
            featured: false
          },
          {
            id: 7,
            title: 'The Future of AI in Content Creation',
            excerpt: 'Predictions and insights about the future of AI-powered content creation.',
            status: 'draft',
            publishedAt: null,
            readTime: 8,
            views: 0,
            likes: 0,
            comments: 0,
            featured: false
          },
          {
            id: 8,
            title: 'Case Studies and Success Stories',
            excerpt: 'Real-world examples of successful AI-powered content creation strategies.',
            status: 'planned',
            publishedAt: null,
            readTime: 12,
            views: 0,
            likes: 0,
            comments: 0,
            featured: false
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Series not found</h2>
        <p className="text-text-secondary mb-4">The series you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/series')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Series
        </Button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'text-success';
      case 'draft': return 'text-warning';
      case 'planned': return 'text-text-secondary';
      default: return 'text-text-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return CheckCircle;
      case 'draft': return Edit;
      case 'planned': return Clock;
      default: return Clock;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Series Header */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl overflow-hidden">
          <img 
            src={series.coverImage} 
            alt={series.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={series.author.avatar} 
              alt={series.author.name}
              className="w-12 h-12 rounded-full border-2 border-white"
            />
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{series.title}</h1>
              <p className="text-white/90">by {series.author.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-white/90">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{series.publishedPosts} of {series.totalPosts} posts</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{series.totalViews.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>{series.totalLikes.toLocaleString()} likes</span>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              {series.status}
            </Badge>
          </div>
        </div>

        <div className="absolute top-6 right-6 flex items-center gap-2">
          <Button variant="outline" className="bg-white/90 backdrop-blur-sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="bg-white/90 backdrop-blur-sm">
            <Bookmark className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Series Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <p className="text-text-primary leading-relaxed mb-6">{series.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {series.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-text-secondary">Started</div>
                  <div className="font-medium text-text-primary">
                    {new Date(series.startedAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">Last Updated</div>
                  <div className="font-medium text-text-primary">
                    {new Date(series.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary">Progress</div>
                  <div className="font-medium text-text-primary">{series.progress}%</div>
                </div>
                <div>
                  <div className="text-text-secondary">Comments</div>
                  <div className="font-medium text-text-primary">{series.totalComments}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-500" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-500 mb-2">{series.progress}%</div>
                  <div className="text-sm text-text-secondary">
                    {series.publishedPosts} of {series.totalPosts} posts published
                  </div>
                </div>
                
                <div className="w-full bg-secondary-100 rounded-full h-3">
                  <div 
                    className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${series.progress}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <div className="text-success font-bold">{series.publishedPosts}</div>
                    <div className="text-text-secondary">Published</div>
                  </div>
                  <div className="text-center p-3 bg-warning/10 rounded-lg">
                    <div className="text-warning font-bold">{series.totalPosts - series.publishedPosts}</div>
                    <div className="text-text-secondary">Remaining</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Series Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total Views</span>
                <span className="font-medium text-text-primary">{series.totalViews.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total Likes</span>
                <span className="font-medium text-text-primary">{series.totalLikes.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total Comments</span>
                <span className="font-medium text-text-primary">{series.totalComments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Avg. Read Time</span>
                <span className="font-medium text-text-primary">7.5 min</span>
              </div>
            </CardContent>
          </Card>

          {/* Author Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                Author
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={series.author.avatar} 
                  alt={series.author.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-medium text-text-primary">{series.author.name}</div>
                  <div className="text-sm text-text-secondary">@{series.author.username}</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/profile/${series.author.username}`)}
              >
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Timeline</h2>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Post
          </Button>
        </div>

        <div className="space-y-6">
          {series.posts.map((post, index) => {
            const StatusIcon = getStatusIcon(post.status);
            return (
              <Card key={post.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Timeline Indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        post.status === 'published' ? 'bg-success text-white' :
                        post.status === 'draft' ? 'bg-warning text-white' :
                        'bg-secondary-200 text-text-secondary'
                      }`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      {index < series.posts.length - 1 && (
                        <div className="w-0.5 h-16 bg-border mt-2"></div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-text-primary">{post.title}</h3>
                            {post.featured && (
                              <Badge variant="default" className="bg-warning text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            <Badge variant="outline" className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                          </div>
                          <p className="text-text-secondary leading-relaxed">{post.excerpt}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          {post.status === 'published' && (
                            <>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(post.publishedAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {post.readTime} min read
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {post.views.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {post.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {post.comments}
                              </span>
                            </>
                          )}
                          {post.status === 'draft' && (
                            <span className="text-warning">Draft - Not published</span>
                          )}
                          {post.status === 'planned' && (
                            <span className="text-text-secondary">Planned for future</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {post.status === 'published' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/article/${post.id}`)}
                            >
                              <ArrowRight className="w-4 h-4 mr-1" />
                              Read
                            </Button>
                          )}
                          {post.status === 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/edit-blog/${post.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeriesTimelinePage; 