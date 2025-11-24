import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, Trash2, X, Eye, Download, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../hooks/useToast';

export default function VersionHistory({ blogId, isOpen, onClose, onRestore }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [restoring, setRestoring] = useState(false);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        if (isOpen && blogId) {
            fetchVersionHistory();
        }
    }, [isOpen, blogId]);

    const fetchVersionHistory = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/blogs/drafts/${blogId}/versions`);
            setVersions(response.data.versions || []);
        } catch (error) {
            console.error('Failed to fetch version history:', error);
            showError('Failed to load version history');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (versionNumber) => {
        if (!window.confirm(`Are you sure you want to restore to version ${versionNumber}? Your current content will be saved as a backup.`)) {
            return;
        }

        try {
            setRestoring(true);
            const response = await axios.post(
                `/api/blogs/drafts/${blogId}/restore/${versionNumber}`
            );

            showSuccess(`Successfully restored to version ${versionNumber}`);

            // Call parent callback with restored content
            if (onRestore) {
                onRestore(response.data.blog);
            }

            // Refresh version history
            await fetchVersionHistory();

            // Close modal
            onClose();

        } catch (error) {
            console.error('Failed to restore version:', error);
            showError(error.response?.data?.message || 'Failed to restore version');
        } finally {
            setRestoring(false);
        }
    };

    const handleDelete = async (versionNumber) => {
        if (!window.confirm(`Delete version ${versionNumber}? This cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`/api/blogs/drafts/${blogId}/versions/${versionNumber}`);
            showSuccess(`Version ${versionNumber} deleted`);
            await fetchVersionHistory();
        } catch (error) {
            console.error('Failed to delete version:', error);
            showError('Failed to delete version');
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const saved = new Date(date);
        const diffMs = now - saved;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                                <Clock className="w-6 h-6 text-primary-500" />
                                Version History
                            </h2>
                            <p className="text-sm text-text-secondary mt-1">
                                {versions.length} version{versions.length !== 1 ? 's' : ''} saved
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
                            </div>
                        ) : versions.length === 0 ? (
                            <div className="text-center py-12">
                                <Clock className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
                                <p className="text-text-secondary">No version history yet</p>
                                <p className="text-sm text-text-tertiary mt-2">
                                    Versions will appear here as you save your work
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {versions.map((version) => (
                                    <div
                                        key={version.versionNumber}
                                        className={`group relative bg-surface-hover rounded-xl p-4 border-2 transition-all ${selectedVersion === version.versionNumber
                                                ? 'border-primary-500 shadow-lg'
                                                : 'border-transparent hover:border-border'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            {/* Version Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="flex items-center gap-2 text-sm font-semibold text-primary-500">
                                                        <span className="px-2 py-1 bg-primary-500/10 rounded-md">
                                                            v{version.versionNumber}
                                                        </span>
                                                    </span>
                                                    {version.isAutosave ? (
                                                        <span className="text-xs px-2 py-1 bg-gray-500/10 text-gray-500 rounded-md">
                                                            Auto-saved
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-md flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            Manual save
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-text-tertiary">
                                                        {formatTime(version.savedAt)}
                                                    </span>
                                                </div>

                                                <h4 className="font-semibold text-text-primary mb-1 truncate">
                                                    {version.title || 'Untitled'}
                                                </h4>

                                                {version.changeDescription && (
                                                    <p className="text-sm text-text-secondary italic mb-2">
                                                        "{version.changeDescription}"
                                                    </p>
                                                )}

                                                {version.preview && (
                                                    <p className="text-sm text-text-tertiary line-clamp-2">
                                                        {version.preview}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        {new Date(version.savedAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setSelectedVersion(
                                                        selectedVersion === version.versionNumber ? null : version.versionNumber
                                                    )}
                                                    className="p-2 text-text-secondary hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRestore(version.versionNumber)}
                                                    disabled={restoring}
                                                    className="p-2 text-text-secondary hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Restore this version"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(version.versionNumber)}
                                                    className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete this version"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-border bg-surface-hover/50">
                        <p className="text-sm text-text-tertiary">
                            Showing last {Math.min(versions.length, 10)} versions
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-surface-active hover:bg-surface-active/80 text-text-primary rounded-lg font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
