import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import blogService from '../../services/blogService';
import { resolveAssetUrl } from '../../constants/apiConfig';
import { Calendar, User } from 'lucide-react';

export default function RelatedBlogs({ currentBlogId, tags, category }) {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatedBlogs = async () => {
            try {
                // Try to fetch by tags first, fallback to category/mood
                let params = { limit: 3 };
                if (tags && tags.length > 0) {
                    params.tags = tags[0]; // Use the first tag for relevance
                } else if (category) {
                    params.mood = category;
                }

                const response = await blogService.getBlogs(params);
                const allBlogs = response.data || response;

                // Filter out current blog and limit to 3
                const related = allBlogs
                    .filter(blog => blog._id !== currentBlogId)
                    .slice(0, 3);

                setBlogs(related);
            } catch (error) {
                console.error('Error fetching related blogs:', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentBlogId) {
            fetchRelatedBlogs();
        }
    }, [currentBlogId, tags, category]);

    const stripHtml = (html) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    if (loading || blogs.length === 0) return null;

    return (
        <div className="mt-16 border-t border-[var(--border-color)] pt-12">
            <h3 className="text-2xl font-bold mb-8 text-text-primary">Recommended for you</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {blogs.map(blog => (
                    <Link
                        key={blog._id}
                        to={`/article/${blog.slug || blog._id}`}
                        className="group flex flex-col gap-3"
                    >
                        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface-hover mb-2">
                            {blog.coverImage ? (
                                <img
                                    src={resolveAssetUrl(blog.coverImage)}
                                    alt={blog.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-secondary bg-surface-active">
                                    <span className="opacity-50">No Image</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                            {blog.author && (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-surface-active overflow-hidden flex-shrink-0">
                                        {blog.author.avatar ? (
                                            <img src={resolveAssetUrl(blog.author.avatar)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary-500/10 text-primary-500">
                                                <User className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    <span>{blog.author.displayName || blog.author.firstName || 'VocalInk Writer'}</span>
                                </div>
                            )}
                        </div>

                        <h4 className="text-xl font-bold text-text-primary group-hover:text-primary-500 transition-colors line-clamp-2 leading-tight">
                            {blog.title}
                        </h4>

                        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                            {stripHtml(blog.summary || blog.content || 'Read this amazing article to learn more...')}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
