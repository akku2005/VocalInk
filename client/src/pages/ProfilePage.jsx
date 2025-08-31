import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
  User, 
  Calendar, 
  MapPin, 
  Link, 
  Users, 
  Star, 
  Trophy, 
  BookOpen, 
  MessageCircle,
  Heart,
  Share,
  Edit,
  Settings,
  Bell
} from 'lucide-react';

const ProfilePage = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  // Mock profile data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProfile({
        username: username || 'johndoe',
        displayName: 'John Doe',
        email: 'john@example.com',
        bio: 'Passionate writer and tech enthusiast. Creating content that inspires and educates.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop',
        location: 'San Francisco, CA',
        website: 'https://johndoe.dev',
        joinedDate: '2023-01-15',
        followers: 1247,
        following: 892,
        totalPosts: 45,
        totalLikes: 15420,
        totalViews: 89234,
        xp: 15420,
        level: 8,
        badges: [
          { id: 1, name: 'First Post', description: 'Published your first blog post', icon: '🎉', rarity: 'common' },
          { id: 2, name: 'Engagement Master', description: 'Received 100+ likes on a single post', icon: '🔥', rarity: 'rare' },
          { id: 3, name: 'Series Creator', description: 'Created a blog series with 5+ posts', icon: '📚', rarity: 'epic' },
          { id: 4, name: 'AI Pioneer', description: 'Used AI features 50+ times', icon: '🤖', rarity: 'legendary' },
        ],
        recentPosts: [
          {
            id: 1,
            title: 'The Future of AI in Content Creation',
            excerpt: 'Exploring how artificial intelligence is revolutionizing...',
            publishedAt: '2024-01-15',
            readTime: 8,
            likes: 124,
            comments: 23,
            views: 1542
          },
          {
            id: 2,
            title: 'Building a Successful Blog Series',
            excerpt: 'Learn the strategies and techniques needed...',
            publishedAt: '2024-01-12',
            readTime: 12,
            likes: 89,
            comments: 15,
            views: 892
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Profile not found</h2>
        <p className="text-text-secondary">The user you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Cover Image and Avatar */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl overflow-hidden">
          <img 
            src={profile.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden">
            <img 
              src={profile.avatar} 
              alt={profile.displayName} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm">
            <Bell className="w-4 h-4 mr-2" />
            Follow
          </Button>
          <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-16 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{profile.displayName}</h1>
              <p className="text-text-secondary">@{profile.username}</p>
            </div>
            <p className="text-text-primary max-w-2xl">{profile.bio}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <Link className="w-4 h-4" />
                  <a href={profile.website} className="text-primary-500 hover:underline">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(profile.joinedDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-500">{profile.followers.toLocaleString()}</div>
              <div className="text-sm text-text-secondary">Followers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-500">{profile.following.toLocaleString()}</div>
              <div className="text-sm text-text-secondary">Following</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-500">{profile.totalPosts}</div>
              <div className="text-sm text-text-secondary">Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-500">{profile.totalViews.toLocaleString()}</div>
              <div className="text-sm text-text-secondary">Total Views</div>
            </CardContent>
          </Card>
        </div>

        {/* Level and XP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              Level {profile.level} • {profile.xp.toLocaleString()} XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-secondary-100 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-warning to-warning/80 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(profile.xp % 1000) / 10}%` }}
              ></div>
            </div>
            <p className="text-sm text-text-secondary">
              {1000 - (profile.xp % 1000)} XP until level {profile.level + 1}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges ({profile.badges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.badges.map((badge) => (
              <div key={badge.id} className="text-center p-4 rounded-lg border border-border hover:border-primary-200 transition-colors">
                <div className="text-3xl mb-2">{badge.icon}</div>
                <h3 className="font-semibold text-text-primary mb-1">{badge.name}</h3>
                <p className="text-sm text-text-secondary mb-2">{badge.description}</p>
                <Badge variant={badge.rarity === 'legendary' ? 'default' : 'outline'}>
                  {badge.rarity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'posts', label: 'Posts', count: profile.recentPosts.length },
            { id: 'series', label: 'Series', count: 3 },
            { id: 'likes', label: 'Likes', count: 156 },
            { id: 'bookmarks', label: 'Bookmarks', count: 42 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'posts' && (
          <div className="grid gap-6">
            {profile.recentPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">{post.title}</h3>
                      <p className="text-text-secondary mb-3">{post.excerpt}</p>
                    </div>
                    <div className="text-sm text-text-secondary">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {post.readTime} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.views.toLocaleString()} views
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {activeTab === 'series' && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No series yet</h3>
            <p className="text-text-secondary">Start creating your first blog series!</p>
          </div>
        )}
        
        {activeTab === 'likes' && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No liked posts</h3>
            <p className="text-text-secondary">Posts you like will appear here.</p>
          </div>
        )}
        
        {activeTab === 'bookmarks' && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No bookmarks</h3>
            <p className="text-text-secondary">Posts you bookmark will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 