const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

const sendFriendRequest = async (req, res) => {
    try {
        const { toUsername } = req.body;
        const fromUserId = req.user._id; // This comes from the auth middleware

        if (!toUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        // Find the user to send request to
        const toUser = await User.findOne({ username: toUsername });
        if (!toUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is trying to send request to themselves
        if (toUser._id.toString() === fromUserId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot send friend request to yourself'
            });
        }

        // Check if a friend request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { from: fromUserId, to: toUser._id },
                { from: toUser._id, to: fromUserId }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Friend request already exists'
            });
        }

        // Create new friend request
        const friendRequest = await FriendRequest.create({
            from: fromUserId,
            to: toUser._id,
            status: 'Pending'
        });

        return res.status(201).json({
            success: true,
            message: 'Friend request sent successfully',
            friendRequest
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    sendFriendRequest
}; 