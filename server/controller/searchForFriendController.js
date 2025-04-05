const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

const searchFriendbyUsername = async (req, res) => {
    try {
        const { username } = req.body;

      
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        const user = await User.findOne({ 
            username: { $regex: username, $options: 'i' } 
        }).select('username');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getAllFriends = async (req, res) => {
    try {
        const { userId } = req.body;

        // Check if userId is provided
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Find the user and populate the friends field
        const user = await User.findById(userId).populate('friends');

        // Check if the user exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if the user has friends
        if (!user.friends || user.friends.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No friends found',
                friends: []
            });
        }

        // Map the friends array to extract relevant details
        const friends = user.friends;

        return res.status(200).json({
            success: true,
            message: 'Friends retrieved successfully',
            friends
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: err.message
        });
    }
};

const removeFriend = async(req, res)=>{
    try{
        const userId = req.user.id;
        const { friendId } = req.body;

        if(!friendId){
            return res.status(400).json({
                success: false,
                message: "FriendId required"
            });
        }

        // Check if users exist
        const [user, friend] = await Promise.all([
            User.findById(userId),
            User.findById(friendId)
        ]);

        if (!user || !friend) {
            return res.status(404).json({
                success: false,
                message: "User or friend not found"
            });
        }

        // Remove from both users' friends lists
        await Promise.all([
            User.findByIdAndUpdate(userId, { $pull: { friends: friendId } }),
            User.findByIdAndUpdate(friendId, { $pull: { friends: userId } })
        ]);

        // Delete any existing friend requests between these users
        await FriendRequest.deleteMany({
            $or: [
                { from: userId, to: friendId },
                { from: friendId, to: userId }
            ]
        });

        return res.status(200).json({
            success: true,
            message: 'Friend removed successfully'
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: err.message
        });
    }
};

module.exports = {
    searchFriendbyUsername,
    getAllFriends,
    removeFriend
};