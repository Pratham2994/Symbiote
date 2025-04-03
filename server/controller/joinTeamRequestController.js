const JoinRequest = require('../models/JoinRequest')
const Team = require('../models/Team');

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

        const team = await Team.findById(teamId);
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


        const request = await JoinRequest.findById(requestId).populate('team', 'members');
        
        if(!request){
            return res.status(400).status({
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