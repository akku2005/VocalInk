import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserMinus } from 'lucide-react';
import Button from '../ui/Button';
import { userService } from '../../services/userService';
import { useToast } from '../../hooks/useToast';

const FollowingFollowersModal = ({ isOpen, onClose, users, type, onUnfollow, onRemoveFollower, currentUserId }) => {
    const [unfollowingId, setUnfollowingId] = useState(null);
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleUnfollow = async (userId) => {
        try {
            setUnfollowingId(userId);
            await userService.unfollowUser(userId);
            showSuccess('Successfully unfollowed user');
            onUnfollow(userId);
        } catch (error) {
            console.error('Error unfollowing user:', error);
            showError(error.message || 'Failed to unfollow user');
        } finally {
            setUnfollowingId(null);
        }
    };

    const handleUserClick = (userId) => {
        navigate(`/profile/${userId}`);
        onClose();
    };

    const handleRemoveFollower = async (userId) => {
        try {
            setUnfollowingId(userId);
            await userService.removeFollower(userId);
            showSuccess('Follower removed');
            onRemoveFollower?.(userId);
        } catch (error) {
            console.error('Error removing follower:', error);
            showError(error.message || 'Failed to remove follower');
        } finally {
            setUnfollowingId(null);
        }
    };

    const getInitials = (user) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user.name) {
            const names = user.name.split(' ');
            if (names.length >= 2) {
                return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
            }
            return user.name.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const getAvatarBgColor = (name) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
            'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500'
        ];
        if (!name) return 'bg-gray-500';
        const charCode = name.charAt(0).toUpperCase().charCodeAt(0);
        return colors[charCode % colors.length];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-text-primary">
                        {type === 'following' ? 'Following' : 'Followers'} ({users.length})
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {users.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-text-secondary">
                                {type === 'following' ? 'Not following anyone yet' : 'No followers yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <div
                                    key={user._id || user.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Avatar */}
                                        <div
                                            className="flex-shrink-0 cursor-pointer"
                                            onClick={() => handleUserClick(user._id || user.id)}
                                        >
                                            {user.avatar || user.profilePicture ? (
                                                <img
                                                    src={user.avatar || user.profilePicture}
                                                    alt={user.name}
                                                    className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition-opacity"
                                                />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold hover:opacity-80 transition-opacity ${getAvatarBgColor(user.name)}`}>
                                                    {getInitials(user)}
                                                </div>
                                            )}
                                        </div>

                                        {/* User Info */}
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => handleUserClick(user._id || user.id)}
                                        >
                                            <h3 className="font-semibold text-text-primary truncate hover:text-primary-600 transition-colors">
                                                {user.firstName && user.lastName
                                                    ? `${user.firstName} ${user.lastName}`
                                                    : user.name || 'User'}
                                            </h3>
                                            <p className="text-sm text-text-secondary truncate">
                                                @{user.email?.split('@')[0] || user.username || 'user'}
                                            </p>
                                        </div>

                                        {/* Action Button */}
                                        {type === 'following' && user._id !== currentUserId && user.id !== currentUserId && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleUnfollow(user._id || user.id)}
                                                disabled={unfollowingId === (user._id || user.id)}
                                                className="flex-shrink-0"
                                            >
                                                {unfollowingId === (user._id || user.id) ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                                ) : (
                                                    <>
                                                        <UserMinus className="w-4 h-4 mr-1" />
                                                        Unfollow
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {type === 'followers' && user._id !== currentUserId && user.id !== currentUserId && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveFollower(user._id || user.id)}
                                                disabled={unfollowingId === (user._id || user.id)}
                                                className="flex-shrink-0"
                                            >
                                                {unfollowingId === (user._id || user.id) ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                                ) : (
                                                    <>
                                                        <UserMinus className="w-4 h-4 mr-1" />
                                                        Remove
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FollowingFollowersModal;
