import { Lock, UserPlus, User, Users } from 'lucide-react';
import Button from '../ui/Button';

const PrivateProfileView = ({ profile, onFollowClick, isFollowing, followLoading }) => {
    const isPrivate = profile.isPrivate;
    const isFollowersOnly = profile.isFollowersOnly;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-2xl mx-auto px-4 py-12">
                {/* Cover Area (minimal) */}
                <div className="h-32 bg-gradient-to-r from-surface to-surface-hover rounded-t-2xl mb-16"></div>

                {/* Main Content */}
                <div className="text-center -mt-24">
                    {/* Avatar */}
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-background shadow-xl">
                        {profile.avatar || profile.profilePicture ? (
                            <img
                                src={profile.avatar || profile.profilePicture}
                                alt={profile.displayName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface">
                                <User className="w-16 h-16 text-text-secondary" />
                            </div>
                        )}
                    </div>

                    {/* Name & Username */}
                    <h1 className="text-3xl font-bold text-text-primary mb-2">
                        {profile.displayName || `${profile.firstName} ${profile.lastName}`}
                    </h1>

                    {profile.username && (
                        <p className="text-text-secondary mb-8">@{profile.username}</p>
                    )}

                    {/* Stats (visible even on private) */}
                    <div className="flex justify-center gap-12 mb-8 py-6 border-t border-b border-border">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-text-primary">{profile.followerCount || 0}</div>
                            <div className="text-sm text-text-secondary">Followers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-text-primary">{profile.followingCount || 0}</div>
                            <div className="text-sm text-text-secondary">Following</div>
                        </div>
                    </div>

                    {/* Privacy Message */}
                    <div className="mb-8 max-w-md mx-auto">
                        <div className="p-8 rounded-2xl bg-surface border border-border">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-hover flex items-center justify-center">
                                <Lock className="w-10 h-10 text-text-secondary" />
                            </div>

                            <h2 className="text-xl font-semibold text-text-primary mb-3">
                                {isPrivate ? 'This Account is Private' : 'Follow to See Posts'}
                            </h2>

                            <p className="text-text-secondary text-sm leading-relaxed">
                                {isPrivate
                                    ? 'Only approved followers can see this user\'s posts and profile information.'
                                    : 'Follow this account to see their posts, series, and activity.'}
                            </p>

                            {/* Bio (for followers-only) */}
                            {isFollowersOnly && profile.bio && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <p className="text-sm text-text-secondary italic">{profile.bio}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Follow Button */}
                    {!isFollowing ? (
                        <Button
                            onClick={onFollowClick}
                            loading={followLoading}
                            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transition-all"
                        >
                            <UserPlus className="w-5 h-5" />
                            Follow
                        </Button>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-surface-hover rounded-lg border border-border">
                            <Users className="w-5 h-5 text-primary-500" />
                            <span className="text-sm font-medium text-text-primary">Following</span>
                        </div>
                    )}

                    {isFollowing && isFollowersOnly && (
                        <p className="text-sm text-text-secondary mt-4">
                            You're following this account. You can see their posts.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrivateProfileView;
