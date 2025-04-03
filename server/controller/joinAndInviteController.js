const JoinRequest = require('../models/JoinRequest')
const Team = require('../models/Team');

const joinTeamRequest = async(req, res)=>{
    try{
        // const userId = req.user.id
        const userId = "67ec366f04acaefe3826e85c"
        const {teamId} = req.body
        
        if(!teamId){
            return res.status(400).json({
                success: false,
                message: "teamId required"
            });
        }

        // const team = await Team.findById(teamId);
        // if (!team) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'Team not found'
        //     });
        // }

        const existingReq = await JoinRequest.findOne({user: userId, team: teamId})
        
        if(existingReq){
            return res.status(400).json({
                success: false,
                message: "Request already made to the team"
            })
        }
        
        const newRequest = await JoinRequest.create({
            user: userId,
            team: teamId,
        })

        return res.status(200).json({
            success: true,
            message: "Join request sent successfully",
            newRequest
        })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "server error"
        })
    }
}

const handleJoinRequest = async(req, res)=>{
    try{
        // const userId = req.user.id
        const userId = "67ec360404acaefe3826e858"
        const {requestId} = req.body;
        if(!requestId){
            return res.status(400).json({
                success: false,
                messsage: "requestId required"
            })
        }

        const request = await JoinRequest.findById(requestId).populate('team', 'members');
        
        if(!request){
            return res.status(400).status({
                success: false,
                message: "Non existent request"
            })
        }
        
        const authTeamMember = request.team.members.some(member => member.toString() === userId.toString())

        if(!authTeamMember){
            return res.status(400).json({
                success: false,
                message: "You are unathorized to accept this request"
            })
        }

        const fromUser = request.user.toString()
        const isUserInTeam = request.team.members.some(member => member.toString() === fromUser);

        if(isUserInTeam){
            return res.status(400).json({
                success: false,
                message: "User already part of team"
            })
        }

        const team = await Team.findByIdAndUpdate(request.team._id, { $push: { members: request.user } })

        return res.status(200).json({
            success: true,
            message: "Request accepted",
            team
        })
        

    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "internal server error"
        })
    }
} 


module.exports = {joinTeamRequest, handleJoinRequest}