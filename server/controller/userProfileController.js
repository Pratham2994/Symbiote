const User = require('../models/User')

const getUserProfile = async(req, res) =>{
    try{
        console.log(req.params)
        const {userId} = req.params;

        if(!userId){
            return res.status(400).json({
                message:"User ID required"
            })
        }
        const user = await User.findById(userId);
        res.status(200).json({
            user
        })
    }
    catch(err){
        return res.status(404).json({
            message: "User not found"
        })
    }        
}

module.exports = {getUserProfile}