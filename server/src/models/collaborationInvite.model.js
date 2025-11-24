const mongoose = require('mongoose');

const collaborationInviteSchema = new mongoose.Schema(
    {
        seriesId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Series',
            required: true,
        },
        inviterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
        },
        role: {
            type: String,
            enum: ['creator', 'editor', 'contributor', 'reviewer'],
            default: 'contributor',
        },
        permissions: [{
            type: String,
            enum: ['read', 'write', 'publish', 'manage', 'delete'],
        }],
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'expired'],
            default: 'pending',
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster lookups
collaborationInviteSchema.index({ token: 1 });
collaborationInviteSchema.index({ seriesId: 1, email: 1 });
collaborationInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired invites? Or keep them marked as expired?
// The plan said 'expired' status, so maybe not auto-delete immediately via TTL, 
// but we can use a TTL if we want them gone. 
// For now, let's just index it for queries. 
// Actually, if we want to keep history, we shouldn't use TTL. 
// But usually invites are ephemeral. Let's stick to status management for now.

// Static method to cleanup expired invites
collaborationInviteSchema.statics.cleanupExpired = function () {
    return this.updateMany(
        { status: 'pending', expiresAt: { $lt: new Date() } },
        { status: 'expired' }
    );
};

module.exports = mongoose.model('CollaborationInvite', collaborationInviteSchema);
