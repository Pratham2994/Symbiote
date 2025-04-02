const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');

const sendFriendRequest = async (req, res) => {
    try {
        const { toUsername } = req.body;
        const fromUserId = req.user._id;

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

const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId, recipientId } = req.body;

        if (!requestId || !recipientId) {
            return res.status(400).json({
                success: false,
                message: 'requestId and recipientId are required'
            });
        }

        // Find the friend request by its ID
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found'
            });
        }

        // Verify that the recipient is the one who received the friend request
        if (friendRequest.to.toString() !== recipientId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to accept this friend request'
            });
        }

        // Update the friend request status to Accepted
        friendRequest.status = 'Accepted';
        await friendRequest.save();

        // Update both users' friends arrays
        await User.findByIdAndUpdate(friendRequest.from, { $push: { friends: friendRequest.to } });
        await User.findByIdAndUpdate(friendRequest.to, { $push: { friends: friendRequest.from } });

        return res.status(200).json({
            success: true,
            message: 'Friend request accepted successfully',
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
    sendFriendRequest,
    acceptFriendRequest
};
