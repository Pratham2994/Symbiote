const Team = require('../models/Team');
const User = require('../models/User');
const TeamInvite = require('../models/TeamInvite');
const JoinRequest = require('../models/JoinRequest');
const Notification = require('../models/Notification');
const { sendNotificationEmail, NOTIFICATION_TYPES } = require('../services/emailService');
const { updateGroupChatParticipants } = require('../controllers/groupChatController');
const GroupChat = require('../models/GroupChat');

exports.removeMemberFromTeam = async (req, res) => {
    try {
        console.log('Remove member request body:', req.body);
        const { teamId, memberId } = req.body;
        const requesterId = req.user.id;
        console.log('Parsed values:', { teamId, memberId, requesterId });

        // Validate required fields
        if (!teamId || !memberId) {
            console.log('Missing required fields:', { teamId, memberId });
            return res.status(400).json({
                success: false,
                message: 'Team ID and Member ID are required'
            });
        }

        // Find the team
        console.log('Looking for team with ID:', teamId);
        const team = await Team.findById(teamId);
        if (!team) {
            console.log('Team not found with ID:', teamId);
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }
        console.log('Team found:', team.name);

        // Check if the requester is the team creator
        if (team.createdBy.toString() !== requesterId.toString()) {
            console.log('Unauthorized: Requester is not team creator', { 
                requesterId, 
                teamCreatorId: team.createdBy 
            });
            return res.status(403).json({
                success: false,
                message: 'Only the team creator can remove members'
            });
        }

        // Find the member to be removed
        console.log('Looking for member with ID:', memberId);
        const member = await User.findById(memberId);
        if (!member) {
            console.log('Member not found with ID:', memberId);
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }
        console.log('Member found:', member.username);

        // Remove the member from the team
        team.members = team.members.filter(id => id.toString() !== memberId.toString());
        await team.save();
        console.log('Member removed from team');

        // Update group chat participants to remove the member
        try {
            // Check if group chat exists
            const groupChat = await GroupChat.findOne({ teamId: team._id });
            if (groupChat) {
                await updateGroupChatParticipants(team._id, team.members);
                console.log(`Updated group chat participants for team ${team._id}`);
            } else {
                console.log(`No group chat found for team ${team._id}`);
            }
        } catch (error) {
            console.error('Error updating group chat participants:', error);
            // Continue execution even if this fails
        }

        // Delete any pending invites for the removed member
        await TeamInvite.deleteMany({ team: teamId, recipient: memberId });

        // Delete any pending join requests from the removed member
        await JoinRequest.deleteMany({ team: teamId, user: memberId });

        // Create a notification for the removed member
        const notification = await Notification.create({
            recipient: memberId,
            sender: requesterId,
            type: 'TEAM_MEMBER_REMOVED',
            team: teamId,
            message: `You were removed from team ${team.name}`,
            actionRequired: false,
            actionType: null,
            actionData: {
                teamId: teamId
            },
            read: false
        });

        // Populate the notification with sender and team info
        await notification.populate('sender', 'username');
        await notification.populate('team', 'name');

        // Emit WebSocket event for the new notification
        const io = global.io;
        if (io) {
            const recipientId = memberId.toString();
            io.to(recipientId).emit('newNotification', notification);
            io.to(recipientId).emit('notificationCount', { 
                count: await Notification.countDocuments({ recipient: recipientId, read: false }) 
            });
        }

        // Send email notification in the background
        if (member && member.email) {
            // Use setTimeout to run this asynchronously after the response is sent
            setTimeout(async () => {
                try {
                    await sendNotificationEmail(
                        member.email,
                        NOTIFICATION_TYPES.TEAM_MEMBER_REMOVED,
                        {
                            teamName: team.name
                        }
                    );
                } catch (emailError) {
                    console.error('Error sending email notification:', emailError);
                }
            }, 0);
        }

        return res.status(200).json({
            success: true,
            message: 'Member removed successfully',
            team
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