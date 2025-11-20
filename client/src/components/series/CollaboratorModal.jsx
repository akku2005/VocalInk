import { useState, useEffect, useCallback } from 'react';
import { X, Search, UserPlus, Trash2, Shield, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import userService from '../../services/userService';
import seriesService from '../../services/seriesService';
import debounce from 'lodash/debounce';

const ROLES = [
    { id: 'contributor', label: 'Contributor', description: 'Can add and edit their own episodes' },
    { id: 'editor', label: 'Editor', description: 'Can edit any episode' },
    { id: 'reviewer', label: 'Reviewer', description: 'Can review drafts but not publish' },
    { id: 'creator', label: 'Co-Creator', description: 'Full access except deleting the series' }
];

const PERMISSIONS = [
    { id: 'read', label: 'Read Drafts' },
    { id: 'write', label: 'Write Content' },
    { id: 'publish', label: 'Publish' },
    { id: 'manage', label: 'Manage Settings' },
    { id: 'delete', label: 'Delete Content' }
];

const CollaboratorModal = ({ series, isOpen, onClose, onUpdate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedRole, setSelectedRole] = useState('contributor');
    const [selectedPermissions, setSelectedPermissions] = useState(['read', 'write']);
    const [loading, setLoading] = useState(false);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (query) => {
            if (!query.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const results = await userService.searchUsers(query);
                // Filter out existing collaborators and author
                const filtered = results.filter(user =>
                    user._id !== series.authorId._id &&
                    !series.collaborators.some(c => c.userId._id === user._id)
                );
                setSearchResults(filtered);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500),
        [series]
    );

    useEffect(() => {
        debouncedSearch(searchQuery);
        return () => debouncedSearch.cancel();
    }, [searchQuery, debouncedSearch]);

    const handleAddCollaborator = async (user) => {
        try {
            setLoading(true);
            await seriesService.addCollaborator(series._id, {
                userId: user._id,
                role: selectedRole,
                permissions: selectedPermissions
            });

            // Refresh series data
            const updatedSeries = await seriesService.getSeriesById(series._id);
            onUpdate(updatedSeries);

            // Clear search
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Failed to add collaborator:', error);
            alert('Failed to add collaborator');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCollaborator = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this collaborator?')) return;

        try {
            setLoading(true);
            await seriesService.removeCollaborator(series._id, userId);

            // Refresh series data
            const updatedSeries = await seriesService.getSeriesById(series._id);
            onUpdate(updatedSeries);
        } catch (error) {
            console.error('Failed to remove collaborator:', error);
            alert('Failed to remove collaborator');
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (permissionId) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(p => p !== permissionId)
                : [...prev, permissionId]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-surface border border-white/10 rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-md">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Manage Collaborators</h2>
                        <p className="text-text-secondary text-sm">Invite others to help build this series</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-secondary hover:text-text-primary"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Add New Collaborator Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-sky-500" />
                            Add New Collaborator
                        </h3>

                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="Search users by name or username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all"
                            />
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                {searchResults.map(user => (
                                    <div key={user._id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                        <div className="flex items-center gap-3">
                                            {user.profilePicture ? (
                                                <img src={user.profilePicture} alt={user.username} className="w-10 h-10 rounded-full" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
                                                    {user.username[0].toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-text-primary">{user.displayName || user.username}</div>
                                                <div className="text-sm text-text-secondary">@{user.username}</div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleAddCollaborator(user)}
                                            disabled={loading}
                                            className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border-sky-500/20"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Configuration for new collaborator */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-text-secondary">Role</label>
                                <div className="space-y-2">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.id}
                                            onClick={() => setSelectedRole(role.id)}
                                            className={`w-full text-left p-3 rounded-xl border transition-all ${selectedRole === role.id
                                                    ? 'bg-sky-500/10 border-sky-500/50 text-sky-400'
                                                    : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="font-medium">{role.label}</div>
                                            <div className="text-xs opacity-70">{role.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-text-secondary">Permissions</label>
                                <div className="space-y-2">
                                    {PERMISSIONS.map(perm => (
                                        <button
                                            key={perm.id}
                                            onClick={() => togglePermission(perm.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedPermissions.includes(perm.id)
                                                    ? 'bg-pink-500/10 border-pink-500/50 text-pink-400'
                                                    : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
                                                }`}
                                        >
                                            <span className="font-medium">{perm.label}</span>
                                            {selectedPermissions.includes(perm.id) && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Current Collaborators List */}
                    <div className="space-y-4 pt-6 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-500" />
                            Current Team
                        </h3>

                        <div className="space-y-3">
                            {/* Author */}
                            <div className="flex items-center justify-between p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    {series.authorId.profilePicture ? (
                                        <img src={series.authorId.profilePicture} alt={series.authorId.username} className="w-10 h-10 rounded-full" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                                            {series.authorId.username?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium text-text-primary">
                                            {series.authorId.displayName || series.authorId.username}
                                            <Badge variant="outline" className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">Owner</Badge>
                                        </div>
                                        <div className="text-sm text-text-secondary">@{series.authorId.username}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Collaborators */}
                            {series.collaborators?.map(col => (
                                <div key={col.userId._id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        {col.userId.profilePicture ? (
                                            <img src={col.userId.profilePicture} alt={col.userId.username} className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-text-secondary font-bold">
                                                {col.userId.username?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-text-primary">
                                                {col.userId.displayName || col.userId.username}
                                                <Badge variant="outline" className="ml-2 bg-white/10 text-text-secondary border-white/20 text-xs capitalize">{col.role}</Badge>
                                            </div>
                                            <div className="text-sm text-text-secondary">@{col.userId.username}</div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveCollaborator(col.userId._id)}
                                        disabled={loading}
                                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            {(!series.collaborators || series.collaborators.length === 0) && (
                                <div className="text-center py-8 text-text-secondary">
                                    No collaborators yet. Invite someone to get started!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-surface/50 backdrop-blur-md flex justify-end">
                    <Button variant="ghost" onClick={onClose}>
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CollaboratorModal;
