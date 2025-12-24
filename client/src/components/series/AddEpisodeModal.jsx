import { useState, useEffect } from 'react';
import { X, Plus, Search, BookOpen, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import blogService from '../../services/blogService';
import seriesService from '../../services/seriesService';
import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';

const AddEpisodeModal = ({ isOpen, onClose, series, onUpdate }) => {
    const { user } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [filteredBlogs, setFilteredBlogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);

    useEffect(() => {
        if (isOpen && user) {
            fetchUserBlogs();
        }
        // Use user?._id instead of user object to prevent re-renders
        // when user object reference changes but data stays the same
    }, [isOpen, user?._id]);

    useEffect(() => {
        if (searchQuery) {
            const filtered = blogs.filter(blog =>
                blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                blog.summary?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredBlogs(filtered);
        } else {
            setFilteredBlogs(blogs);
        }
    }, [searchQuery, blogs]);

    const fetchUserBlogs = async () => {
        try {
            setLoading(true);
            // Fetch user's blogs (including drafts)
            const response = await blogService.getBlogsWithFilters({
                author: user._id,
                status: 'all',
                limit: 100
            });

            logger.log('Blog service response:', response);

            // Extract blogs from response
            const allBlogs = response.blogs || response.data?.blogs || response.data || response || [];

            logger.log('All blogs:', allBlogs);

            // Filter out blogs already in the series
            const existingBlogIds = (series.episodes || []).map(ep =>
                ep.episodeId?._id || ep.episodeId
            ).filter(Boolean);

            logger.log('Existing blog IDs in series:', existingBlogIds);

            const availableBlogs = Array.isArray(allBlogs) ? allBlogs.filter(blog =>
                !existingBlogIds.includes(blog._id || blog.id)
            ) : [];

            logger.log('Available blogs to add:', availableBlogs);

            setBlogs(availableBlogs);
            setFilteredBlogs(availableBlogs);
        } catch (error) {
            logger.error('Error fetching blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBlog = async () => {
        if (!selectedBlog) return;

        try {
            setAdding(true);
            const nextOrder = (series.episodes || []).length + 1;

            // 1. Add the episode
            await seriesService.addEpisode(series._id, {
                blogId: selectedBlog._id || selectedBlog.id,
                order: nextOrder,
                title: selectedBlog.title
            });

            // 2. Try to refresh series data
            try {
                // Small delay to ensure DB consistency
                await new Promise(resolve => setTimeout(resolve, 500));
                const updatedSeries = await seriesService.getSeriesById(series._id || series.slug);
                onUpdate(updatedSeries);
            } catch (refreshError) {
                console.warn('Episode added but failed to refresh series data:', refreshError);
                // We don't alert here because the main action (adding episode) succeeded
            }

            onClose();
        } catch (error) {
            console.error('Error adding episode:', error);
            alert(error.message || 'Failed to add blog to series');
        } finally {
            setAdding(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Plus className="w-6 h-6 text-sky-500" />
                        Add Post to Series
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <Input
                            type="text"
                            placeholder="Search your blogs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Blog List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12 text-text-secondary">
                            Loading your blogs...
                        </div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">
                            {searchQuery ? 'No blogs found matching your search' : 'No available blogs to add'}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredBlogs.map((blog) => (
                                <div
                                    key={blog._id || blog.id}
                                    onClick={() => setSelectedBlog(blog)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedBlog?._id === blog._id
                                        ? 'border-sky-500 bg-sky-500/10'
                                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {blog.coverImage && (
                                            <img
                                                src={blog.coverImage}
                                                alt={blog.title}
                                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-text-primary line-clamp-1">
                                                {blog.title}
                                            </h3>
                                            <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                                                {blog.summary || blog.excerpt}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                                                {blog.readingTime && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {blog.readingTime} min
                                                    </span>
                                                )}
                                                {blog.status && (
                                                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                                                        {blog.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {selectedBlog?._id === blog._id && (
                                                <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center">
                                                    <Plus className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex items-center justify-between">
                    <p className="text-sm text-text-secondary">
                        {selectedBlog ? `Selected: ${selectedBlog.title}` : 'Select a blog to add to the series'}
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddBlog}
                            disabled={!selectedBlog || adding}
                            className="bg-gradient-to-r from-sky-500 to-pink-500 text-white border-0"
                        >
                            {adding ? 'Adding...' : 'Add to Series'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEpisodeModal;
