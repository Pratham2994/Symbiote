const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');
const TeamInvite = require('../models/TeamInvite');
const JoinRequest = require('../models/JoinRequest');
const Chat = require('../models/Chat');

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
        const teamMembers = await User.find({ _id: { $in: team.members } }).select('username _id');
        
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

module.exports = { deleteTeam };