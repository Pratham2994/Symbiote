const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');
const TeamInvite = require('../models/TeamInvite');
const JoinRequest = require('../models/JoinRequest');
const notificationController = require('./notificationController');

exports.removeMemberFromTeam = async (req, res) => {
    try {
        const { teamId, memberId } = req.body;
        const requesterId = req.user.id;

        // Validate required fields
        if (!teamId || !memberId) {
            return res.status(400).json({
                success: false,
                message: 'Team ID and Member ID are required'
            });
        }

        // Find the team
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        // Check if the requester is the team creator or the member themselves
        if (team.createdBy.toString() !== requesterId.toString() && requesterId.toString() !== memberId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the team creator or the member themselves can remove a member'
            });
        }

        // Check if the member is part of the team
        if (!team.members.includes(memberId)) {
            return res.status(400).json({
                success: false,
                message: 'Member is not part of the team'
            });
        }

        // Prevent removal of the team creator unless it's a self-removal
        if (team.createdBy.toString() === memberId.toString() && requesterId.toString() !== memberId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Cannot remove the team creator'
            });
        }

        // Get the member's username for the notification
        const member = await User.findById(memberId).select('username');
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // Remove the member from the team
        team.members = team.members.filter(id => id.toString() !== memberId.toString());
        await team.save();

        // Delete any pending invites for the removed member
        await TeamInvite.deleteMany({ team: teamId, recipient: memberId });

        // Delete any pending join requests from the removed member
        await JoinRequest.deleteMany({ team: teamId, user: memberId });

        // Create a notification for the removed member using the notification controller
        // This will also send an email notification
        const notification = await notificationController.createNotification(
            memberId,
            requesterId,
            'TEAM_MEMBER_REMOVED',
            teamId
        );

        // Emit WebSocket event for the new notification
        const io = global.io;
        if (io) {
            const recipientId = memberId.toString();
            io.to(recipientId).emit('newNotification', notification);
            io.to(recipientId).emit('notificationCount', { 
                count: await Notification.countDocuments({ recipient: recipientId, read: false }) 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (error) {
        console.error('Error removing member from team:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}; 