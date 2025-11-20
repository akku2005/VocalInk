const mongoose = require('mongoose');

const canViewProfile = (viewerId, targetUser) => {
  if (!targetUser) return false;
  const visibility = targetUser.privacySettings?.profileVisibility || 'public';

  if (visibility === 'public') return true;
  if (!viewerId) return false;
  const viewerIdStr = viewerId.toString();
  if (viewerIdStr === targetUser._id.toString()) return true;
  if (visibility === 'followers') {
    return Array.isArray(targetUser.followers) && targetUser.followers.some((f) => f.toString() === viewerIdStr);
  }
  return false;
};

module.exports = {
  canViewProfile,
};
