const TeamInvite = require('../models/TeamInvite')
const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');

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
        const fromUser = await User.findById(userId);
        await Notification.create({
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
            }
        });

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
        const userId = req.user.id
        const { inviteId, action } = req.body;

        // Validate input
        if (!inviteId || !action) {
            return res.status(400).json({
                success: false,
                message: "inviteId and action are required"
            });
        }

        // Find the invitation
        const invite = await TeamInvite.findById(inviteId)
            .populate('team', 'members competition')
            .populate('fromUser', 'username');
            
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

        // Handle rejection
        if (action === "Reject") {
            invite.status = "Rejected";
            await invite.save();

            // Create notification for the sender about rejection
            await Notification.create({
                recipient: invite.fromUser._id,
                sender: userId,
                type: 'TEAM_INVITE_REJECTED',
                team: invite.team._id,
                message: `${req.user.username} rejected your team invite`,
                actionRequired: false
            });

            return res.status(200).json({
                success: true,
                message: `Invitation ${invite.status} successfully`
            });
        }

        // Handle acceptance
        if (action === "Accept") {
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

            // Update the invitation status to "Accepted"
            invite.status = "Accepted";
            await invite.save();

            // Create notification for the sender about acceptance
            await Notification.create({
                recipient: invite.fromUser._id,
                sender: userId,
                type: 'TEAM_INVITE_ACCEPTED',
                team: invite.team._id,
                message: `${req.user.username} accepted your team invite`,
                actionRequired: false
            });

            return res.status(200).json({
                success: true,
                message: `Invitation ${invite.status} successfully`,
                team,
                invite
            });
        }

        // Handle invalid action
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

module.exports =  {inviteToTeam, handleTeamInvite}