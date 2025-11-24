const crypto = require('crypto');
const Series = require('../models/series.model');
const User = require('../models/user.model');
const CollaborationInvite = require('../models/collaborationInvite.model');
const emailService = require('../services/EmailService');
const Notification = require('../models/notification.model');

exports.inviteUser = async (req, res) => {
    try {
        const { seriesId } = req.params;
        const { email, role, permissions } = req.body;
        const inviterId = req.user._id;

        const series = await Series.findById(seriesId);
        if (!series) {
            return res.status(404).json({ message: 'Series not found' });
        }

        // Check if inviter is the author
        if (series.authorId.toString() !== inviterId.toString()) {
            return res.status(403).json({ message: 'Only the series author can invite collaborators' });
        }

        // Check if user is already a collaborator
        const existingCollaborator = series.collaborators.find(c => {
            // We need to resolve the user ID from the email if possible, 
            // but here we only have email. 
            // So we should check if the email belongs to an existing user and if that user is already a collaborator.
            return false; // Logic handled below after user lookup
        });

        const invitee = await User.findOne({ email });
        if (invitee) {
            const isAlreadyCollaborator = series.collaborators.some(
                c => c.userId.toString() === invitee._id.toString()
            );
            if (isAlreadyCollaborator) {
                return res.status(400).json({ message: 'User is already a collaborator' });
            }
            if (invitee._id.toString() === inviterId.toString()) {
                return res.status(400).json({ message: 'You cannot invite yourself' });
            }
        }

        // Check for existing pending invite
        const existingInvite = await CollaborationInvite.findOne({
            seriesId,
            email,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        });

        if (existingInvite) {
            return res.status(400).json({ message: 'A pending invitation already exists for this user' });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

        const invite = new CollaborationInvite({
            seriesId,
            inviterId,
            email,
            token,
            role,
            permissions,
            expiresAt
        });

        await invite.save();

        // Send Email
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/collaborations/accept/${token}`;
        await emailService.sendCollaborationInvitationEmail(
            email,
            req.user.name,
            series.title,
            inviteLink
        );

        // Send Notification if user exists
        if (invitee) {
            await Notification.create({
                userId: invitee._id,
                type: 'system',
                title: 'Collaboration Invitation',
                content: `${req.user.name} invited you to collaborate on "${series.title}"`,
                data: {
                    actionUrl: `/collaborations/accept/${token}`,
                    metadata: { inviteId: invite._id }
                }
            });
        }

        res.status(201).json({ message: 'Invitation sent successfully', invite });
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ message: 'Error sending invitation', error: error.message });
    }
};

exports.acceptInvite = async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user._id; // User must be logged in to accept

        const invite = await CollaborationInvite.findOne({ token, status: 'pending' });
        if (!invite) {
            return res.status(404).json({ message: 'Invalid or expired invitation' });
        }

        if (invite.expiresAt < new Date()) {
            invite.status = 'expired';
            await invite.save();
            return res.status(400).json({ message: 'Invitation has expired' });
        }

        // Check if the logged-in user matches the invited email
        const user = await User.findById(userId);
        if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
            return res.status(403).json({ message: 'This invitation was sent to a different email address' });
        }

        const series = await Series.findById(invite.seriesId);
        if (!series) {
            return res.status(404).json({ message: 'Series no longer exists' });
        }

        // Add collaborator
        await series.addCollaborator(userId, invite.role, invite.permissions);

        // Update invite status
        invite.status = 'accepted';
        await invite.save();

        // Notify inviter
        await Notification.create({
            userId: invite.inviterId,
            type: 'system',
            title: 'Invitation Accepted',
            content: `${user.name} accepted your invitation to collaborate on "${series.title}"`,
            data: {
                actionUrl: `/series/${series._id}/edit`,
                metadata: { seriesId: series._id }
            }
        });

        res.json({ message: 'Invitation accepted successfully', seriesId: series._id });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ message: 'Error accepting invitation', error: error.message });
    }
};

exports.rejectInvite = async (req, res) => {
    try {
        const { token } = req.params;
        // User doesn't strictly need to be logged in to reject? 
        // But for security, maybe yes. Or just validate token.
        // Let's assume they might click "Reject" from email without logging in?
        // But usually we want them to log in. 
        // If we want public rejection, we shouldn't rely on req.user.
        // But the plan implies authenticated flow. Let's stick to authenticated for now for consistency.

        const invite = await CollaborationInvite.findOne({ token, status: 'pending' });
        if (!invite) {
            return res.status(404).json({ message: 'Invalid or expired invitation' });
        }

        invite.status = 'rejected';
        await invite.save();

        res.json({ message: 'Invitation rejected' });
    } catch (error) {
        console.error('Error rejecting invitation:', error);
        res.status(500).json({ message: 'Error rejecting invitation', error: error.message });
    }
};

exports.getPendingInvites = async (req, res) => {
    try {
        const { seriesId } = req.params;
        const userId = req.user._id;

        const series = await Series.findById(seriesId);
        if (!series) {
            return res.status(404).json({ message: 'Series not found' });
        }

        if (series.authorId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const invites = await CollaborationInvite.find({
            seriesId,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        res.json(invites);
    } catch (error) {
        console.error('Error fetching invites:', error);
        res.status(500).json({ message: 'Error fetching invites', error: error.message });
    }
};
