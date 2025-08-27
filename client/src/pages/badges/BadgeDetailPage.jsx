import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { CheckCircle, Clock } from 'lucide-react';

const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const allBadges = [
  { name: 'First Post', icon: '🎉', description: 'Published your first blog post', rarity: 'common', category: 'writing', earnedBy: 1247, totalUsers: 1250, progress: 100, earnedAt: '2023-01-15', requirements: [{ text: 'Publish 1 blog post', completed: true }] },
  { name: 'Prolific Writer', icon: '✍️', description: 'Published 50 blog posts', rarity: 'rare', category: 'writing', earnedBy: 234, totalUsers: 1250, progress: 45, earnedAt: null, requirements: [{ text: 'Publish 50 blog posts', completed: false, current: 23, target: 50 }] },
  { name: 'Master Wordsmith', icon: '📝', description: 'Published 100 blog posts', rarity: 'epic', category: 'writing', earnedBy: 89, totalUsers: 1250, progress: 12, earnedAt: null, requirements: [{ text: 'Publish 100 blog posts', completed: false, current: 23, target: 100 }] },
  { name: 'Legendary Author', icon: '👑', description: 'Published 500 blog posts', rarity: 'legendary', category: 'writing', earnedBy: 12, totalUsers: 1250, progress: 2, earnedAt: null, requirements: [{ text: 'Publish 500 blog posts', completed: false, current: 23, target: 500 }] },
  { name: 'Engagement Master', icon: '🔥', description: 'Received 100+ likes on a single post', rarity: 'rare', category: 'engagement', earnedBy: 156, totalUsers: 1250, progress: 85, earnedAt: '2023-02-20', requirements: [{ text: 'Receive 100+ likes on a single post', completed: true }] },
  { name: 'Viral Sensation', icon: '🚀', description: 'Get 10,000+ views on a single post', rarity: 'legendary', category: 'engagement', earnedBy: 23, totalUsers: 1250, progress: 65, earnedAt: null, requirements: [{ text: 'Get 10,000+ views on a single post', completed: false, current: 6500, target: 10000 }] },
  { name: 'Comment King', icon: '💬', description: 'Left 100+ meaningful comments', rarity: 'epic', category: 'engagement', earnedBy: 67, totalUsers: 1250, progress: 45, earnedAt: null, requirements: [{ text: 'Left 100+ meaningful comments', completed: false, current: 45, target: 100 }] },
  { name: 'Series Creator', icon: '📚', description: 'Created a blog series with 5+ posts', rarity: 'epic', category: 'series', earnedBy: 89, totalUsers: 1250, progress: 78, earnedAt: '2023-03-10', requirements: [{ text: 'Create a blog series with 5+ posts', completed: true }] },
  { name: 'Series Master', icon: '📖', description: 'Created 10+ blog series', rarity: 'legendary', category: 'series', earnedBy: 34, totalUsers: 1250, progress: 12, earnedAt: null, requirements: [{ text: 'Create 10+ blog series', completed: false, current: 2, target: 10 }] },
  { name: 'AI Pioneer', icon: '🤖', description: 'Used AI features 50+ times', rarity: 'legendary', category: 'ai', earnedBy: 45, totalUsers: 1250, progress: 100, earnedAt: '2023-04-05', requirements: [{ text: 'Used AI features 50+ times', completed: true }] },
  { name: 'AI Enthusiast', icon: '⚡', description: 'Used AI features 10+ times', rarity: 'rare', category: 'ai', earnedBy: 234, totalUsers: 1250, progress: 67, earnedAt: null, requirements: [{ text: 'Used AI features 10+ times', completed: false, current: 7, target: 10 }] },
  { name: 'Social Butterfly', icon: '🦋', description: 'Followed 50+ users', rarity: 'rare', category: 'social', earnedBy: 189, totalUsers: 1250, progress: 100, earnedAt: '2023-05-12', requirements: [{ text: 'Followed 50+ users', completed: true }] },
  { name: 'Community Leader', icon: '👑', description: 'Have 1,000+ followers', rarity: 'legendary', category: 'social', earnedBy: 23, totalUsers: 1250, progress: 80, earnedAt: null, requirements: [{ text: 'Have 1,000+ followers', completed: false, current: 800, target: 1000 }] },
  { name: 'Consistency Champion', icon: '📅', description: 'Post for 30 consecutive days', rarity: 'epic', category: 'consistency', earnedBy: 78, totalUsers: 1250, progress: 50, earnedAt: null, requirements: [{ text: 'Post for 30 consecutive days', completed: false, current: 15, target: 30 }] },
  { name: 'Daily Grinder', icon: '⚡', description: 'Post for 7 consecutive days', rarity: 'common', category: 'consistency', earnedBy: 456, totalUsers: 1250, progress: 78, earnedAt: null, requirements: [{ text: 'Post for 7 consecutive days', completed: false, current: 5, target: 7 }] },
  { name: 'Early Adopter', icon: '🌟', description: 'Joined VocalInk in the first month', rarity: 'legendary', category: 'special', earnedBy: 12, totalUsers: 1250, progress: 100, earnedAt: '2023-01-01', requirements: [{ text: 'Joined VocalInk in the first month', completed: true }] },
  { name: 'Beta Tester', icon: '🧪', description: 'Tested beta features and provided feedback', rarity: 'epic', category: 'special', earnedBy: 34, totalUsers: 1250, progress: 0, earnedAt: null, requirements: [{ text: 'Tested beta features and provided feedback', completed: false }] }
].map(b => ({ ...b, slug: slugify(b.name) }));

const getRarityClass = (rarity) => {
  switch (rarity) {
    case 'legendary': return 'text-yellow-500';
    case 'epic': return 'text-purple-500';
    case 'rare': return 'text-blue-500';
    default: return 'text-text-secondary';
  }
};

export default function BadgeDetailPage() {
  const { slug } = useParams();
  const data = allBadges.find(b => b.slug === slug);

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="border border-[var(--border-color)]">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">❓</div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Badge not found</h1>
            <p className="text-text-secondary mb-4">We couldn't find this badge. It might have been removed or renamed.</p>
            <Link to="/badges" className="text-primary-500">Go back to badges</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card className="border border-[var(--border-color)]">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="text-6xl" aria-hidden>{data.icon}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-text-primary mb-2">{data.name}</h1>
              <div className="mb-3 text-text-secondary">{data.description}</div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline">Rarity</Badge>
                <span className={`font-medium ${getRarityClass(data.rarity)}`}>{data.rarity}</span>
                <Badge variant="outline">Category</Badge>
                <span className="text-text-secondary">{data.category}</span>
                <Badge variant="outline">Earned by</Badge>
                <span className="text-text-secondary">{data.earnedBy} users ({Math.round((data.earnedBy / data.totalUsers) * 100)}%)</span>
                {data.earnedAt && (
                  <span className="text-success">Earned on {new Date(data.earnedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[var(--border-color)]">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Progress</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Completion</span>
              <span className="font-medium text-text-primary">{data.progress}%</span>
            </div>
            <div className="w-full bg-secondary-100 rounded-full h-2">
              <div className={`h-2 rounded-full ${data.earnedAt ? 'bg-success' : 'bg-primary-500'}`} style={{ width: `${data.progress}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[var(--border-color)]">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Requirements</h2>
          <ul className="space-y-3">
            {data.requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-3 text-text-secondary">
                {req.completed ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <Clock className="w-5 h-5 text-text-secondary" />
                )}
                <span>
                  {req.text}
                  {req.current !== undefined && (
                    <span className="ml-1 text-text-primary font-medium">({req.current}/{req.target})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Link to="/badges" className="px-4 py-2 rounded-md border border-[var(--border-color)]">Back to badges</Link>
      </div>
    </div>
  );
} 