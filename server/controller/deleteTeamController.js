const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');
const TeamInvite = require('../models/TeamInvite');
const JoinRequest = require('../models/JoinRequest');
const Chat = require('../models/Chat');
const { sendNotificationEmail, NOTIFICATION_TYPES } = require('../services/emailService');

deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.body;
        const requesterId = req.user.id;

        // Validate required fields
        if (!teamId) {
            return res.status(400).json({
                success: false,
                message: 'Team ID is required'
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

        // Check if the requester is the team creator
        if (team.createdBy.toString() !== requesterId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the team creator can delete the team'
            });
        }

        // Get all team members for notifications
        const teamMembers = await User.find({ _id: { $in: team.members } }).select('username _id email');
        
        // Create notifications for all team members
        const notificationPromises = teamMembers.map(async (member) => {
            // Skip notification for the creator
            if (member._id.toString() === requesterId.toString()) {
                return null;
            }
            
            const notification = await Notification.create({
                recipient: member._id,
                sender: requesterId,
                type: 'TEAM_DELETED',
                message: `Team ${team.name} has been deleted`,
                actionRequired: false,
                read: false
            });
            
            // Populate the notification with sender info
            await notification.populate('sender', 'username');
            
            return notification;
        });
        
        // Wait for all notifications to be created
        const notifications = (await Promise.all(notificationPromises)).filter(Boolean);
        
        // Delete all team invites
        await TeamInvite.deleteMany({ team: teamId });
        
        // Delete all join requests
        await JoinRequest.deleteMany({ team: teamId });
        
        // Delete the team's group chat if it exists
        if (team.groupChat) {
            await Chat.findByIdAndDelete(team.groupChat);
        }
        
        // Remove the team from all members' teams lists
        // This assumes there's a teams field in the User model
        // If not, you may need to adjust this part
        await User.updateMany(
            { _id: { $in: team.members } },
            { $pull: { teams: teamId } }
        );
        
        // Delete the team
        await Team.findByIdAndDelete(teamId);
        
        // Emit WebSocket events for all notifications
        const io = global.io;
        if (io) {
            for (const notification of notifications) {
                const recipientId = notification.recipient.toString();
                io.to(recipientId).emit('newNotification', notification);
                io.to(recipientId).emit('notificationCount', { 
                    count: await Notification.countDocuments({ recipient: recipientId, read: false }) 
                });
            }
        }
        
        // Send email notifications in the background
        for (const member of teamMembers) {
            // Skip email for the creator
            if (member._id.toString() === requesterId.toString()) {
                continue;
            }
            
            if (member.email) {
                // Use setTimeout to run this asynchronously after the response is sent
                setTimeout(async () => {
                    try {
                        await sendNotificationEmail(
                            member.email,
                            NOTIFICATION_TYPES.TEAM_DELETED,
                            {
                                teamName: team.name,
                                senderUsername: (await User.findById(requesterId).select('username')).username
                            }
                        );
                    } catch (emailError) {
                        console.error('Error sending email notification:', emailError);
                    }
                }, 0);
            }
        }
        
        return res.status(200).json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting team:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

leaveTeam = async (req, res) => {
    try {
        const { teamId } = req.body;
        const requesterId = req.user.id;

        // Validate required fields
        if (!teamId) {
            return res.status(400).json({
                success: false,
                message: 'Team ID is required'
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

        // Check if the requester is a member of the team
        if (!team.members.includes(requesterId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this team'
            });
        }

        // Check if the requester is the team creator
        if (team.createdBy.toString() === requesterId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Team creator cannot leave the team. Please delete the team instead.'
            });
        }

        // Get the user's username for the notification
        const user = await User.findById(requesterId).select('username');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove the user from the team
        team.members = team.members.filter(id => id.toString() !== requesterId.toString());
        await team.save();

        // Remove the team from the user's teams list
        await User.findByIdAndUpdate(requesterId, {
            $pull: { teams: teamId }
        });

        // Delete any pending invites for the user
        await TeamInvite.deleteMany({ team: teamId, recipient: requesterId });

        // Delete any pending join requests from the user
        await JoinRequest.deleteMany({ team: teamId, user: requesterId });

        // Get the team creator's email for notification
        const teamCreator = await User.findById(team.createdBy).select('email');
        
        // Create a notification for the team creator only
        // The user who is leaving should not receive any notifications
        const notification = await Notification.create({
            recipient: team.createdBy,
            sender: requesterId,
            type: 'TEAM_MEMBER_LEFT',
            message: `${user.username} has left team ${team.name}`,
            actionRequired: false,
            read: false
        });

        // Populate the notification with sender info
        await notification.populate('sender', 'username');

        // Emit WebSocket event for the new notification
        // Only emit to the team creator, not to the user who is leaving
        const io = global.io;
        if (io) {
            const recipientId = team.createdBy.toString();
            io.to(recipientId).emit('newNotification', notification);
            io.to(recipientId).emit('notificationCount', { 
                count: await Notification.countDocuments({ recipient: recipientId, read: false }) 
            });
        }

        // Send email notification in the background
        if (teamCreator && teamCreator.email) {
            // Use setTimeout to run this asynchronously after the response is sent
            setTimeout(async () => {
                try {
                    await sendNotificationEmail(
                        teamCreator.email,
                        NOTIFICATION_TYPES.TEAM_MEMBER_LEFT,
                        {
                            teamName: team.name,
                            senderUsername: notification.sender.username
                        }
                    );
                } catch (emailError) {
                    console.error('Error sending email notification:', emailError);
                }
            }, 0);
        }

        return res.status(200).json({
            success: true,
            message: 'Successfully left the team'
        });
    } catch (error) {
        console.error('Error leaving team:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = { deleteTeam, leaveTeam };