import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

/**
 * useAutosave Hook
 * Auto-saves blog drafts every 30 seconds with debouncing
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.blogId - Blog ID to autosave
 * @param {string} options.title - Blog title
 * @param {string} options.content - Blog content (HTML)
 * @param {string} options.summary - Blog summary
 * @param {Array} options.tags - Blog tags
 * @param {string} options.coverImage - Cover image URL
 * @param {number} options.interval - Autosave interval in ms (default: 30000 = 30s)
 * @param {boolean} options.enabled - Enable/disable autosave (default: true)
 * 
 * @returns {{saveStatus: string, lastSaved: Date|null, manualSave: Function}}
 */
export function useAutosave({
    blogId,
    title,
    content,
    summary,
    tags,
    coverImage,
    interval = 30000, // 30 seconds
    enabled = true
}) {
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
    const [lastSaved, setLastSaved] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const timeoutRef = useRef(null);
    const lastContentRef = useRef({ title, content, summary, tags, coverImage });
    const saveCountRef = useRef(0);

    // Check if content has changed
    const hasChanged = useCallback(() => {
        const last = lastContentRef.current;
        return (
            last.title !== title ||
            last.content !== content ||
            last.summary !== summary ||
            JSON.stringify(last.tags) !== JSON.stringify(tags) ||
            last.coverImage !== coverImage
        );
    }, [title, content, summary, tags, coverImage]);

    // Auto-save function
    const performAutosave = useCallback(async () => {
        if (!blogId || !enabled) return;
        if (!hasChanged()) {
            console.log('[Autosave] No changes detected, skipping');
            return;
        }

        try {
            setSaveStatus('saving');
            setErrorMessage(null);

            const response = await axios.post(
                `/api/blogs/drafts/${blogId}/autosave`,
                {
                    title,
                    content,
                    summary,
                    tags,
                    coverImage
                }
            );

            // Update last saved content
            lastContentRef.current = { title, content, summary, tags, coverImage };

            setLastSaved(new Date(response.data.lastAutosaved));
            setSaveStatus('saved');
            saveCountRef.current += 1;

            console.log('[Autosave] Success:', {
                versionNumber: response.data.versionNumber,
                versionsCount: response.data.versionsCount,
                totalSaves: saveCountRef.current
            });

            // Reset to idle after 2 seconds
            setTimeout(() => {
                setSaveStatus('idle');
            }, 2000);

        } catch (error) {
            console.error('[Autosave] Error:', error);
            setSaveStatus('error');
            setErrorMessage(error.response?.data?.message || 'Failed to auto-save');

            // Reset to idle after 5 seconds
            setTimeout(() => {
                setSaveStatus('idle');
            }, 5000);
        }
    }, [blogId, title, content, summary, tags, coverImage, enabled, hasChanged]);

    // Manual save function
    const manualSave = useCallback(async (changeDescription = '') => {
        if (!blogId) {
            console.warn('[Manual Save] No blog ID provided');
            return { success: false, error: 'No blog ID' };
        }

        try {
            setSaveStatus('saving');
            setErrorMessage(null);

            const response = await axios.post(
                `/api/blogs/drafts/${blogId}/save`,
                {
                    title,
                    content,
                    summary,
                    tags,
                    coverImage,
                    changeDescription
                }
            );

            lastContentRef.current = { title, content, summary, tags, coverImage };
            setLastSaved(new Date(response.data.lastAutosaved));
            setSaveStatus('saved');

            console.log('[Manual Save] Success:', {
                versionNumber: response.data.versionNumber,
                changeDescription
            });

            setTimeout(() => {
                setSaveStatus('idle');
            }, 2000);

            return {
                success: true,
                versionNumber: response.data.versionNumber
            };

        } catch (error) {
            console.error('[Manual Save] Error:', error);
            setSaveStatus('error');
            setErrorMessage(error.response?.data?.message || 'Failed to save');

            setTimeout(() => {
                setSaveStatus('idle');
            }, 5000);

            return {
                success: false,
                error: error.response?.data?.message || 'Failed to save'
            };
        }
    }, [blogId, title, content, summary, tags, coverImage]);

    // Debounced autosave effect
    useEffect(() => {
        if (!enabled || !blogId) return;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout for autosave
        timeoutRef.current = setTimeout(() => {
            performAutosave();
        }, interval);

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [title, content, summary, tags, coverImage, interval, enabled, blogId, performAutosave]);

    // Save before page unload
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasChanged() && enabled) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';

                // Try to save one last time
                performAutosave();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasChanged, enabled, performAutosave]);

    return {
        saveStatus, // 'idle' | 'saving' | 'saved' | 'error'
        lastSaved, // Date object or null
        errorMessage, // Error message if saveStatus is 'error'
        manualSave, // Function to trigger manual save
        totalSaves: saveCountRef.current // Total number of autosaves performed
    };
}

export default useAutosave;
