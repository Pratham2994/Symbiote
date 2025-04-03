const TeamInvite = require('../models/TeamInvite')
const Team = require('../models/Team');

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

        const team = await Team.findById(teamId);
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

        // Check if an invite already exists for this friend and team
        const existingInvite = await TeamInvite.findOne({ team: teamId, toUser: friendId });
        if (existingInvite && existingInvite.status === "Pending") {
            return res.status(400).json({
                success: false,
                message: "An invitation has already been sent to this friend"
            });
        }

        // Create a new team invite
        const teamInvite = await TeamInvite.create({
            team: teamId,
            fromUser: userId,
            toUser: friendId
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
        const invite = await TeamInvite.findById(inviteId).populate('team', 'members');
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

            // Add the user to the team
            const team = await Team.findById(invite.team._id).populate('members', 'frontendScore backendScore eqScore');
            team.members.push(userId);
            await team.save();

            // Update the invitation status to "Accepted"
            invite.status = "Accepted";
            await invite.save();

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