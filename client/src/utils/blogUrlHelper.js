/**
 * Blog URL Helper Utility
 * Centralized URL generation for category-based blog URLs
 */

/**
 * Generate SEO-friendly blog URL in format: /{category}/{slug}
 * @param {Object} blog - Blog object with category/categorySlug and slug
 * @returns {string} - Blog URL path (e.g., "/aws/deploy-lambda" or "/technology/intro-to-ai")
 */
export const getBlogUrl = (blog) => {
    if (!blog) return '/blogs';

    // Extract category (prefer categorySlug, fallback to category, then 'blog')
    const category = blog.categorySlug ||
        (blog.category ? blog.category.toLowerCase().replace(/\s+/g, '-') : null) ||
        (blog.tags && blog.tags.length > 0 ? blog.tags[0].toLowerCase().replace(/\s+/g, '-') : null) ||
        'blog';

    // Extract slug
    const slug = blog.slug || blog._id || blog.id;

    // Return category-based URL: /{category}/{slug}
    return `/${category}/${slug}`;
};

/**
 * Generate old-style article URL for backward compatibility
 * @param {Object} blog - Blog object with slug
 * @returns {string} - Old article URL path
 */
export const getOldBlogUrl = (blog) => {
    const slug = blog?.slug || blog?._id || blog?.id;
    return `/article/${slug}`;
};

/**
 * Extract category from blog object for display purposes
 * @param {Object} blog - Blog object
 * @returns {string} - Category name
 */
export const getBlogCategory = (blog) => {
    return blog?.category ||
        (blog?.tags && blog.tags.length > 0 ? blog.tags[0] : null) ||
        'Blog';
};

export default {
    getBlogUrl,
    getOldBlogUrl,
    getBlogCategory
};
