const TeamInvite = require('../models/TeamInvite')
const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendNotificationEmail, NOTIFICATION_TYPES } = require('../services/emailService');
const { updateGroupChatParticipants } = require('../controllers/groupChatController');
const GroupChat = require('../models/GroupChat');
const GroupChatMeta = require('../models/GroupChatMeta');

const emitNotificationUpdate = async (userId) => {
  try {
    const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });
    console.log(`Emitting notification count update for user ${userId}:`, unreadCount);
    global.io.to(userId.toString()).emit('notificationCount', { count: unreadCount });
  } catch (error) {
    console.error('Error emitting notification update:', error);
  }
};

const inviteToTeam = async(req, res)=>{
    try{
        const userId = req.user.id
        const {teamId, friendId} = req.body;
        
        if(!teamId || !friendId){
            return res.status(400).json({
                success: false,
                message: "teamId and friendId required"
            });
        }

        const team = await Team.findById(teamId).populate('competition');
        if (!team) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        // Check if the friend is already a member of the team
        const isFriendInTeam = team.members.some(member => member.toString() === friendId);
        if (isFriendInTeam) {
            return res.status(400).json({
                success: false,
                message: "Friend is already a member of the team"
            });
        }

        // Check if friend is already part of any team in this competition
        const existingTeamInCompetition = await Team.findOne({
            competition: team.competition._id,
            members: friendId
        });

        if (existingTeamInCompetition) {
            return res.status(400).json({
                success: false,
                message: "Friend is already part of a team in this competition"
            });
        }

        // Check if an invite already exists for this friend and team
        const existingInvite = await TeamInvite.findOne({ 
            team: teamId, 
            toUser: friendId,
            status: "Pending"
        });
        
        if (existingInvite) {
            return res.status(400).json({
                success: false,
                message: "An invitation has already been sent to this friend"
            });
        }

        // Create a new team invite
        const teamInvite = await TeamInvite.create({
            team: teamId,
            fromUser: userId,
            toUser: friendId,
            status: "Pending"
        });

        // Create notification for the friend
        const fromUser = await User.findById(userId).select('username');
        if (!fromUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Get the friend's email for notification
        const friend = await User.findById(friendId).select('email');

        const notification = await Notification.create({
            recipient: friendId,
            sender: userId,
            type: 'TEAM_INVITE',
            team: teamId,
            message: `${fromUser.username} invited you to join team ${team.name} for ${team.competition.title}`,
            actionRequired: true,
            actionType: 'ACCEPT_REJECT',
            actionData: {
                inviteId: teamInvite._id,
                teamId: teamId
            },
            read: false,
            seen: false
        });

        // Populate the notification with user data before emitting
        await notification.populate('sender', 'username');
        await notification.populate('team', 'name');

        // Emit WebSocket events for the friend
        const io = global.io;
        if (io) {
            io.to(friendId.toString()).emit('newNotification', notification);
            await emitNotificationUpdate(friendId);
        }

        // Send email notification in the background
        if (friend && friend.email) {
            // Use setTimeout to run this asynchronously after the response is sent
            setTimeout(async () => {
                try {
                    await sendNotificationEmail(
                        friend.email,
                        NOTIFICATION_TYPES.TEAM_INVITE,
                        {
                            senderUsername: fromUser.username,
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
            message: "Invitation sent successfully",
            teamInvite
        });

    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

const handleTeamInvite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { inviteId, action } = req.body;

        // Validate input
        if (!inviteId || !action) {
            return res.status(400).json({
                success: false,
                message: "inviteId and action required"
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

        // Find the invitation
        const invite = await TeamInvite.findById(inviteId)
            .populate('team', 'members competition name')
            .populate('fromUser', 'username email');
            
        if (!invite) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found"
            });
        }

        // Ensure the invitation is for the current user
        if (invite.toUser.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to handle this invitation"
            });
        }

        // Check if the invitation is still pending
        if (invite.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: `Invitation is already ${invite.status}`
            });
        }

        // Delete any existing notifications about this team invite
        await Notification.deleteMany({
            $or: [
                {
                    recipient: userId,
                    sender: invite.fromUser._id,
                    type: 'TEAM_INVITE'
                },
                {
                    recipient: invite.fromUser._id,
                    sender: userId,
                    type: { $in: ['TEAM_INVITE_ACCEPTED', 'TEAM_INVITE_REJECTED'] }
                }
            ]
        });

        if (normalizedAction === "Reject") {
            invite.status = "Rejected";
            await invite.save();

            // Get the current user's data
            const currentUser = await User.findById(userId).select('username');
            if (!currentUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Create notification for the sender about rejection
            const notification = await Notification.create({
                recipient: invite.fromUser._id,
                sender: userId,
                type: 'TEAM_INVITE_REJECTED',
                team: invite.team._id,
                message: `${currentUser.username} rejected your team invite for ${invite.team.name}`,
                actionRequired: false,
                read: false,
                seen: false
            });

            // Populate the notification with user data before emitting
            await notification.populate('sender', 'username');
            await notification.populate('team', 'name');

            // Get updated unread count
            const recipientUnreadCount = await Notification.countDocuments({
                recipient: invite.fromUser._id,
                read: false
            });

            // Emit WebSocket events
            const io = global.io;
            if (io) {
                io.to(invite.fromUser._id.toString()).emit('newNotification', notification);
                io.to(invite.fromUser._id.toString()).emit('notificationCount', { count: recipientUnreadCount });
                io.to(userId.toString()).emit('notificationDeleted');
                await emitNotificationUpdate(userId);
            }

            // Send email notification in the background
            if (invite.fromUser.email) {
                // Use setTimeout to run this asynchronously after the response is sent
                setTimeout(async () => {
                    try {
                        await sendNotificationEmail(
                            invite.fromUser.email,
                            NOTIFICATION_TYPES.TEAM_INVITE_REJECTED,
                            {
                                senderUsername: currentUser.username,
                                teamName: invite.team.name
                            }
                        );
                    } catch (emailError) {
                        console.error('Error sending email notification:', emailError);
                    }
                }, 0);
            }

            return res.status(200).json({
                success: true,
                message: `Invitation ${invite.status} successfully`
            });
        }

        if (normalizedAction === "Accept") {
            // Check if the user is already a member of the team
            const isUserInTeam = invite.team.members.some(member => member.toString() === userId);
            if (isUserInTeam) {
                return res.status(400).json({
                    success: false,
                    message: "You are already a member of the team"
                });
            }

            // Check if user is already part of any team in this competition
            const existingTeamInCompetition = await Team.findOne({
                competition: invite.team.competition._id,
                members: userId
            });

            if (existingTeamInCompetition) {
                return res.status(400).json({
                    success: false,
                    message: "You are already part of a team in this competition"
                });
            }

            // Add the user to the team
            const team = await Team.findById(invite.team._id).populate('members', 'frontendScore backendScore eqScore');
            team.members.push(userId);
            await team.save();

            // Check if group chat exists, create if it doesn't
            let groupChat = await GroupChat.findOne({ teamId: team._id });
            if (!groupChat) {
                console.log(`Creating group chat for team ${team._id}`);
                groupChat = await GroupChat.create({
                    teamId: team._id,
                    participants: team.members
                });
                
                // Create meta records for all participants
                await Promise.all(team.members.map(id => {
                    return GroupChatMeta.create({ groupId: groupChat._id, userId: id });
                }));
                
                // Update team with group chat reference
                team.groupChat = groupChat._id;
                await team.save();
            } else {
                // Update group chat participants to include the new team member
                try {
                    await updateGroupChatParticipants(team._id, team.members);
                } catch (error) {
                    console.error('Error updating group chat participants:', error);
                    // Continue execution even if this fails
                }
            }

            // Update the invitation status to "Accepted"
            invite.status = "Accepted";
            await invite.save();

            // Get the current user's data
            const currentUser = await User.findById(userId).select('username');
            if (!currentUser) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // Create notification for the sender about acceptance
            const notification = await Notification.create({
                recipient: invite.fromUser._id,
                sender: userId,
                type: 'TEAM_INVITE_ACCEPTED',
                team: invite.team._id,
                message: `${currentUser.username} accepted your team invite for ${invite.team.name}`,
                actionRequired: false,
                read: false,
                seen: false
            });

            // Populate the notification with user data before emitting
            await notification.populate('sender', 'username');
            await notification.populate('team', 'name');

            // Get updated unread count
            const recipientUnreadCount = await Notification.countDocuments({
                recipient: invite.fromUser._id,
                read: false
            });

            // Emit WebSocket events
            const io = global.io;
            if (io) {
                io.to(invite.fromUser._id.toString()).emit('newNotification', notification);
                io.to(invite.fromUser._id.toString()).emit('notificationCount', { count: recipientUnreadCount });
                io.to(userId.toString()).emit('notificationDeleted');
                await emitNotificationUpdate(userId);
            }

            // Send email notification in the background
            if (invite.fromUser.email) {
                // Use setTimeout to run this asynchronously after the response is sent
                setTimeout(async () => {
                    try {
                        await sendNotificationEmail(
                            invite.fromUser.email,
                            NOTIFICATION_TYPES.TEAM_INVITE_ACCEPTED,
                            {
                                senderUsername: currentUser.username,
                                teamName: invite.team.name
                            }
                        );
                    } catch (emailError) {
                        console.error('Error sending email notification:', emailError);
                    }
                }, 0);
            }

            return res.status(200).json({
                success: true,
                message: `Invitation ${invite.status} successfully`,
                team,
                invite
            });
        }

        return res.status(400).json({
            success: false,
            message: "Invalid action"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

module.exports =  {inviteToTeam, handleTeamInvite};