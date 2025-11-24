import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Clock, Mail, X } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import seriesService from '../../services/seriesService';
import InviteCollaboratorModal from './InviteCollaboratorModal';
import { useToast } from '../../hooks/useToast';

const CollaboratorsTab = ({ series, onUpdate }) => {
    const [pendingInvites, setPendingInvites] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useToast();

    const fetchPendingInvites = async () => {
        try {
            const invites = await seriesService.getPendingInvites(series._id);
            setPendingInvites(invites);
        } catch (error) {
            console.error('Failed to fetch invites:', error);
        }
    };

    useEffect(() => {
        fetchPendingInvites();
    }, [series._id]);

    const handleRemoveCollaborator = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this collaborator?')) return;

        try {
            setLoading(true);
            await seriesService.removeCollaborator(series._id, userId);

            // Refresh series data via parent callback
            // We assume onUpdate will re-fetch the series
            // But we might need to fetch it here if onUpdate expects the new series object
            const updatedSeries = await seriesService.getSeriesById(series._id);
            onUpdate(updatedSeries);
            showSuccess('Collaborator removed');
        } catch (error) {
            console.error('Failed to remove collaborator:', error);
            showError('Failed to remove collaborator');
        } finally {
            setLoading(false);
        }
    };

    // Note: We don't have an API to cancel invites yet in the controller/routes I implemented.
    // The plan didn't explicitly ask for "Cancel Invite", but it's good UX.
    // For now, I'll omit the cancel button or just show the list.
    // Or I can add a delete endpoint later. 
    // Let's just list them for now.

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-text-primary">Team Members</h3>
                    <p className="text-sm text-text-secondary">Manage who can contribute to this series</p>
                </div>
                <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Collaborator
                </Button>
            </div>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-text-secondary uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pending Invitations
                    </h4>
                    <div className="space-y-3">
                        {pendingInvites.map(invite => (
                            <div key={invite._id} className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-text-primary">{invite.email}</div>
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs capitalize">
                                                {invite.role}
                                            </Badge>
                                            <span>• Expires {new Date(invite.expiresAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Cancel button could go here if implemented */}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Current Collaborators */}
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-text-secondary uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Active Members
                </h4>
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
                        <div className="text-center py-8 text-text-secondary bg-white/5 rounded-xl border border-white/5 border-dashed">
                            No active collaborators yet.
                        </div>
                    )}
                </div>
            </div>

            <InviteCollaboratorModal
                seriesId={series._id}
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onInviteSent={fetchPendingInvites}
            />
        </div>
    );
};

export default CollaboratorsTab;
