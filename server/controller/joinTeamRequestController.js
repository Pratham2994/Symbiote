const JoinRequest = require('../models/JoinRequest')
const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');

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

        const team = await Team.findById(teamId).populate('createdBy', 'username');
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
        await Notification.create({
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
        const userId = req.user.id
        const {requestId, action} = req.body;
        if(!requestId || !action){
            return res.status(400).json({
                success: false,
                messsage: "requestId and action required"
            });
        }

        const request = await JoinRequest.findById(requestId)
            .populate('team', 'members createdBy')
            .populate('user', 'username');
        
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
                message: "You are unathorized to handle this request"
            });
        }

        if(action === "Reject"){
            request.status = "Rejected"
            await request.save()

            // Create notification for the requester about rejection
            await Notification.create({
                recipient: request.user._id,
                sender: userId,
                type: 'TEAM_JOIN_REQUEST_REJECTED',
                team: request.team._id,
                message: `Your request to join team ${request.team.name} was rejected`,
                actionRequired: false
            });

            return res.status(200).json({
                success: true,
                message: `Request ${request.status}`,
            })
        }
        else if(action === "Accept"){
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
            await Notification.create({
                recipient: request.user._id,
                sender: userId,
                type: 'TEAM_JOIN_REQUEST_ACCEPTED',
                team: request.team._id,
                message: `Your request to join team ${request.team.name} was accepted`,
                actionRequired: false
            });

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