import { useState } from 'react';
import { X, Mail, Send, Shield, Check } from 'lucide-react';
import Button from '../ui/Button';
import seriesService from '../../services/seriesService';
import { useToast } from '../../hooks/useToast';

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

const InviteCollaboratorModal = ({ seriesId, isOpen, onClose, onInviteSent }) => {
    const [email, setEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('contributor');
    const [selectedPermissions, setSelectedPermissions] = useState(['read', 'write']);
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useToast();

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        try {
            setLoading(true);
            await seriesService.inviteCollaborator(seriesId, {
                email,
                role: selectedRole,
                permissions: selectedPermissions
            });

            showSuccess('Invitation sent successfully');
            onInviteSent();
            onClose();
            setEmail('');
        } catch (error) {
            console.error('Failed to send invitation:', error);
            showError(error.response?.data?.message || 'Failed to send invitation');
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
                        <h2 className="text-2xl font-bold text-text-primary">Invite Collaborator</h2>
                        <p className="text-text-secondary text-sm">Send an email invitation to join this series</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-secondary hover:text-text-primary"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <form onSubmit={handleInvite} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-secondary">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                                <input
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-text-secondary">Role</label>
                                <div className="space-y-2">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.id}
                                            type="button"
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

                            {/* Permissions Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-text-secondary">Permissions</label>
                                <div className="space-y-2">
                                    {PERMISSIONS.map(perm => (
                                        <button
                                            key={perm.id}
                                            type="button"
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

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="ghost" onClick={onClose} type="button">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !email}
                                className="bg-sky-500 hover:bg-sky-600 text-white"
                            >
                                {loading ? 'Sending...' : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Invitation
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InviteCollaboratorModal;
