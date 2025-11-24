const Blog = require('../models/blog.model');
const logger = require('../utils/logger');

/**
 * Auto-save draft
 * POST /api/blogs/drafts/:id/autosave
 */
exports.autosaveDraft = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, summary, tags, coverImage } = req.body;
        const userId = req.user._id || req.user.id;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (blog.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this blog' });
        }

        blog.lastAutosaved = new Date();
        blog.autosaveVersion += 1;

        const newVersion = {
            versionNumber: blog.autosaveVersion,
            title: title || blog.title,
            content: content || blog.content,
            summary: summary || blog.summary,
            tags: tags || blog.tags,
            coverImage: coverImage || blog.coverImage,
            savedAt: new Date(),
            savedBy: userId,
            isAutosave: true,
            changeDescription: `Auto-saved version ${blog.autosaveVersion}`
        };

        blog.versions.push(newVersion);
        if (blog.versions.length > 10) {
            blog.versions = blog.versions.slice(-10);
        }

        if (title) blog.title = title;
        if (content) blog.content = content;
        if (summary) blog.summary = summary;
        if (tags) blog.tags = tags;
        if (coverImage) blog.coverImage = coverImage;

        await blog.save();

        logger.info('Blog auto-saved', {
            blogId: blog._id,
            userId,
            versionNumber: blog.autosaveVersion
        });

        res.json({
            message: 'Draft auto-saved successfully',
            lastAutosaved: blog.lastAutosaved,
            versionNumber: blog.autosaveVersion,
            versionsCount: blog.versions.length
        });
    } catch (error) {
        logger.error('Draft autosave failed', { error: error.message });
        res.status(500).json({ message: 'Failed to auto-save draft', error: error.message });
    }
};

/**
 * Manual save with description
 * POST /api/blogs/drafts/:id/save
 */
exports.manualSaveDraft = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, summary, tags, coverImage, changeDescription } = req.body;
        const userId = req.user._id || req.user.id;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (blog.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this blog' });
        }

        blog.autosaveVersion += 1;

        const newVersion = {
            versionNumber: blog.autosaveVersion,
            title: title || blog.title,
            content: content || blog.content,
            summary: summary || blog.summary,
            tags: tags || blog.tags,
            coverImage: coverImage || blog.coverImage,
            savedAt: new Date(),
            savedBy: userId,
            isAutosave: false,
            changeDescription: changeDescription || `Manual save - version ${blog.autosaveVersion}`
        };

        blog.versions.push(newVersion);
        if (blog.versions.length > 10) {
            blog.versions = blog.versions.slice(-10);
        }

        if (title) blog.title = title;
        if (content) blog.content = content;
        if (summary) blog.summary = summary;
        if (tags) blog.tags = tags;
        if (coverImage) blog.coverImage = coverImage;
        blog.lastAutosaved = new Date();

        await blog.save();

        logger.info('Blog manually saved', {
            blogId: blog._id,
            userId,
            versionNumber: blog.autosaveVersion
        });

        res.json({
            message: 'Draft saved successfully',
            lastAutosaved: blog.lastAutosaved,
            versionNumber: blog.autosaveVersion,
            versionsCount: blog.versions.length
        });
    } catch (error) {
        logger.error('Manual save failed', { error: error.message });
        res.status(500).json({ message: 'Failed to save draft', error: error.message });
    }
};

/**
 * Get version history
 * GET /api/blogs/drafts/:id/versions
 */
exports.getVersionHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;

        const blog = await Blog.findById(id)
            .select('versions author title lastAutosaved autosaveVersion')
            .populate('versions.savedBy', 'firstName lastName username email');

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (blog.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this blog' });
        }

        const sortedVersions = blog.versions.sort((a, b) => b.versionNumber - a.versionNumber);

        res.json({
            blogId: blog._id,
            title: blog.title,
            currentVersion: blog.autosaveVersion,
            lastAutosaved: blog.lastAutosaved,
            versions: sortedVersions.map(v => ({
                versionNumber: v.versionNumber,
                title: v.title,
                summary: v.summary,
                savedAt: v.savedAt,
                savedBy: v.savedBy,
                isAutosave: v.isAutosave,
                changeDescription: v.changeDescription,
                preview: v.content.substring(0, 200) + '...'
            }))
        });
    } catch (error) {
        logger.error('Failed to get version history', { error: error.message });
        res.status(500).json({ message: 'Failed to get version history', error: error.message });
    }
};

/**
 * Restore a specific version
 * POST /api/blogs/drafts/:id/restore/:versionNumber
 */
exports.restoreVersion = async (req, res) => {
    try {
        const { id, versionNumber } = req.params;
        const userId = req.user._id || req.user.id;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (blog.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this blog' });
        }

        const versionToRestore = blog.versions.find(
            v => v.versionNumber === parseInt(versionNumber)
        );

        if (!versionToRestore) {
            return res.status(404).json({ message: 'Version not found' });
        }

        blog.autosaveVersion += 1;
        const currentStateVersion = {
            versionNumber: blog.autosaveVersion,
            title: blog.title,
            content: blog.content,
            summary: blog.summary,
            tags: blog.tags,
            coverImage: blog.coverImage,
            savedAt: new Date(),
            savedBy: userId,
            isAutosave: false,
            changeDescription: `Backup before restoring to version ${versionNumber}`
        };

        blog.versions.push(currentStateVersion);
        if (blog.versions.length > 10) {
            blog.versions = blog.versions.slice(-10);
        }

        blog.title = versionToRestore.title;
        blog.content = versionToRestore.content;
        blog.summary = versionToRestore.summary || blog.summary;
        blog.tags = versionToRestore.tags || blog.tags;
        blog.coverImage = versionToRestore.coverImage || blog.coverImage;
        blog.lastAutosaved = new Date();

        await blog.save();

        logger.info('Version restored', {
            blogId: blog._id,
            userId,
            restoredVersion: versionNumber,
            newVersion: blog.autosaveVersion
        });

        res.json({
            message: `Successfully restored to version ${versionNumber}`,
            restoredVersion: parseInt(versionNumber),
            currentVersion: blog.autosaveVersion,
            blog: {
                title: blog.title,
                content: blog.content,
                summary: blog.summary,
                tags: blog.tags,
                coverImage: blog.coverImage
            }
        });
    } catch (error) {
        logger.error('Version restore failed', { error: error.message });
        res.status(500).json({ message: 'Failed to restore version', error: error.message });
    }
};

/**
 * Delete a specific version
 * DELETE /api/blogs/drafts/:id/versions/:versionNumber
 */
exports.deleteVersion = async (req, res) => {
    try {
        const { id, versionNumber } = req.params;
        const userId = req.user._id || req.user.id;

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        if (blog.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this blog' });
        }

        const initialLength = blog.versions.length;
        blog.versions = blog.versions.filter(
            v => v.versionNumber !== parseInt(versionNumber)
        );

        if (blog.versions.length === initialLength) {
            return res.status(404).json({ message: 'Version not found' });
        }

        await blog.save();

        logger.info('Version deleted', {
            blogId: blog._id,
            userId,
            deletedVersion: versionNumber
        });

        res.json({
            message: `Version ${versionNumber} deleted successfully`,
            remainingVersions: blog.versions.length
        });
    } catch (error) {
        logger.error('Version deletion failed', { error: error.message });
        res.status(500).json({ message: 'Failed to delete version', error: error.message });
    }
};


// No need for module.exports since we're using exports.functionName throughout
// The exports are already attached to the module.exports object
