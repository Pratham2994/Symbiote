const JoinRequest = require('../models/JoinRequest')
const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendNotificationEmail, NOTIFICATION_TYPES } = require('../services/emailService');

const emitNotificationUpdate = async (userId) => {
  try {
    const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });
    console.log(`Emitting notification count update for user ${userId}:`, unreadCount);
    global.io.to(userId.toString()).emit('notificationCount', { count: unreadCount });
  } catch (error) {
    console.error('Error emitting notification update:', error);
  }
};

const joinTeamRequest = async(req, res)=>{
    try{
        const userId = req.user.id
        const {teamId} = req.body;
        
        if(!teamId){
            return res.status(400).json({
                success: false,
                message: "teamId required"
            });
        }

        const team = await Team.findById(teamId).populate('createdBy', 'username email');
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        const isUserInTeam = team.members.some(member=> member.toString() === userId)

        if(isUserInTeam){
            return res.status(400).json({
                success: false,
                message: "User already part of team"
            });
        }

        const existingReq = await JoinRequest.findOne({user: userId, team: teamId})
        
        if(existingReq && existingReq.status === "Pending"){
            return res.status(400).json({
                success: false,
                message: "Request already made request to the team"
            });
        }
        
        const newRequest = await JoinRequest.create({
            user: userId,
            team: teamId,
        });

        // Create notification for the team leader
        const user = await User.findById(userId);
        const notification = await Notification.create({
            recipient: team.createdBy._id,
            sender: userId,
            type: 'TEAM_JOIN_REQUEST',
            team: teamId,
            message: `${user.username} wants to join your team ${team.name}`,
            actionRequired: true,
            actionType: 'ACCEPT_REJECT',
            actionData: {
                requestId: newRequest._id,
                teamId: teamId
            }
        });

        // Emit WebSocket events for the team leader
        const io = global.io;
        if (io) {
            io.to(team.createdBy._id.toString()).emit('newNotification', notification);
            await emitNotificationUpdate(team.createdBy._id);
        }

        // Send email notification in the background
        if (team.createdBy.email) {
            // Use setTimeout to run this asynchronously after the response is sent
            setTimeout(async () => {
                try {
                    await sendNotificationEmail(
                        team.createdBy.email,
                        NOTIFICATION_TYPES.TEAM_JOIN_REQUEST,
                        {
                            senderUsername: user.username,
                            teamName: team.name
                        }
                    );
                } catch (emailError) {
                    console.error('Error sending email notification:', emailError);
                }
            }, 0);
        }

        return res.status(201).json({
            success: true,
            message: "Join request sent successfully",
            newRequest
        });
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "server error"
        });
    }
}

const handleJoinRequest = async(req, res)=>{
    try{
        const userId = req.user.id;
        const {requestId, action} = req.body;
        
        // Validate inputs
        if(!requestId || !action){
            return res.status(400).json({
                success: false,
                message: "requestId and action required"
            });
        }

        // Normalize action to uppercase first letter
        const normalizedAction = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
        
        if (!['Accept', 'Reject'].includes(normalizedAction)) {
            return res.status(400).json({
                success: false,
                message: "Invalid action. Must be 'accept' or 'reject'"
            });
        }

        const request = await JoinRequest.findById(requestId)
            .populate('team', 'members createdBy name')
            .populate('user', 'username email');
        
        if(!request){
            return res.status(400).json({
                success: false,
                message: "Non existent request"
            });
        }
        
        if(request.status !== "Pending"){
            return res.status(400).json({
                success: false,
                message: `Request closed`,
            })
        }

        const authTeamMember = request.team.members.some(member => member.toString() === userId.toString());

        if(!authTeamMember){
            return res.status(400).json({
                success: false,
                message: "You are unauthorized to handle this request"
            });
        }

        // Delete any existing notifications about this join request
        await Notification.deleteMany({
            $or: [
                {
                    recipient: userId,
                    sender: request.user._id,
                    type: 'TEAM_JOIN_REQUEST'
                },
                {
                    recipient: request.user._id,
                    sender: userId,
                    type: { $in: ['TEAM_JOIN_REQUEST_ACCEPTED', 'TEAM_JOIN_REQUEST_REJECTED'] }
                }
            ]
        });

        if(normalizedAction === "Reject"){
            request.status = "Rejected"
            await request.save()

            // Get the current user's data
            const currentUser = await User.findById(userId).select('username');
            if (!currentUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Create notification for the requester about rejection
            const notification = await Notification.create({
                recipient: request.user._id,
                sender: userId,
                type: 'TEAM_JOIN_REQUEST_REJECTED',
                team: request.team._id,
                message: `Your request to join team ${request.team.name} was rejected`,
                actionRequired: false,
                read: false,
                seen: false
            });

            // Populate the notification with user data before emitting
            await notification.populate('sender', 'username');
            await notification.populate('team', 'name');

            // Get updated unread count
            const recipientUnreadCount = await Notification.countDocuments({
                recipient: request.user._id,
                read: false
            });

            // Emit WebSocket events
            const io = global.io;
            if (io) {
                io.to(request.user._id.toString()).emit('newNotification', notification);
                io.to(request.user._id.toString()).emit('notificationCount', { count: recipientUnreadCount });
                io.to(userId.toString()).emit('notificationDeleted');
                await emitNotificationUpdate(userId);
            }

            // Send email notification in the background
            if (request.user.email) {
                // Use setTimeout to run this asynchronously after the response is sent
                setTimeout(async () => {
                    try {
                        await sendNotificationEmail(
                            request.user.email,
                            NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_REJECTED,
                            {
                                teamName: request.team.name
                            }
                        );
                    } catch (emailError) {
                        console.error('Error sending email notification:', emailError);
                    }
                }, 0);
            }

            return res.status(200).json({
                success: true,
                message: `Request ${request.status}`,
            })
        }
        else if(normalizedAction === "Accept"){
            const fromUser = request.user.toString();
            const isUserInTeam = request.team.members.some(member => member.toString() === fromUser);

            if(isUserInTeam){
                return res.status(400).json({
                    success: false,
                    message: "User already part of team"
                });
            }

            request.status = "Accepted"
            await request.save()

            const team = await Team.findById(request.team._id).populate('members', 'frontendScore backendScore eqScore');
            
            // Add the new member
            team.members.push(request.user);
            
            // Save the team which will trigger the pre-save middleware
            await team.save();

            // Create notification for the requester about acceptance
            const notification = await Notification.create({
                recipient: request.user._id,
                sender: userId,
                type: 'TEAM_JOIN_REQUEST_ACCEPTED',
                team: request.team._id,
                message: `Your request to join team ${request.team.name} was accepted`,
                actionRequired: false,
                read: false,
                seen: false
            });

            // Get updated unread count
            const recipientUnreadCount = await Notification.countDocuments({
                recipient: request.user._id,
                read: false
            });

            // Emit WebSocket events
            const io = global.io;
            if (io) {
                io.to(request.user._id.toString()).emit('newNotification', notification);
                io.to(request.user._id.toString()).emit('notificationCount', { count: recipientUnreadCount });
                io.to(userId.toString()).emit('notificationDeleted');
                await emitNotificationUpdate(userId);
            }

            // Send email notification in the background
            if (request.user.email) {
                // Use setTimeout to run this asynchronously after the response is sent
                setTimeout(async () => {
                    try {
                        await sendNotificationEmail(
                            request.user.email,
                            NOTIFICATION_TYPES.TEAM_JOIN_REQUEST_ACCEPTED,
                            {
                                teamName: request.team.name
                            }
                        );
                    } catch (emailError) {
                        console.error('Error sending email notification:', emailError);
                    }
                }, 0);
            }

            return res.status(200).json({
                success: true,
                message: `Request ${request.status}`,
                team
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid action",
        });

    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "internal server error"
        });
    }
}

module.exports = {joinTeamRequest, handleJoinRequest}