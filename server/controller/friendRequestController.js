const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

const sendFriendRequest = async (req, res) => {
    try {
        const { toUsername } = req.body;
        const fromUserId = req.user.id;

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

        // Check if users are already friends
        const fromUser = await User.findById(fromUserId);
        if (fromUser.friends.includes(toUser._id)) {
            return res.status(400).json({
                success: false,
                message: 'Users are already friends'
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

        // Create notification for the recipient
        await Notification.create({
            recipient: toUser._id,
            sender: fromUserId,
            type: 'FRIEND_REQUEST',
            message: `${req.user.username} wants to be your friend`,
            actionRequired: true,
            actionType: 'ACCEPT_REJECT',
            actionData: {
                requestId: friendRequest._id
            }
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
        const { requestId } = req.body;
        const userId = req.user.id;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'requestId is required'
            });
        }

        // Find the friend request by its ID
        const friendRequest = await FriendRequest.findById(requestId)
            .populate('from', 'username')
            .populate('to', 'username');

        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found'
            });
        }

        // Verify that the current user is the recipient
        if (friendRequest.to._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to accept this friend request'
            });
        }

        // Check if request is still pending
        if (friendRequest.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `Friend request is already ${friendRequest.status}`
            });
        }

        // Check if users are already friends
        const fromUser = await User.findById(friendRequest.from);
        const toUser = await User.findById(friendRequest.to);
        
        if (fromUser.friends.includes(friendRequest.to._id) || toUser.friends.includes(friendRequest.from._id)) {
            return res.status(400).json({
                success: false,
                message: 'Users are already friends'
            });
        }

        // Update friend request status
        friendRequest.status = 'Accepted';
        await friendRequest.save();

        // Add friends to each other's friend list
        await User.findByIdAndUpdate(friendRequest.from, { $push: { friends: friendRequest.to._id } });
        await User.findByIdAndUpdate(friendRequest.to, { $push: { friends: friendRequest.from._id } });

        // Create notification for the sender about acceptance
        await Notification.create({
            recipient: friendRequest.from._id,
            sender: friendRequest.to._id,
            type: 'FRIEND_REQUEST_ACCEPTED',
            message: `${toUser.username} accepted your friend request`,
            actionRequired: false
        });

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

const rejectFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const userId = req.user.id;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'requestId is required'
            });
        }

        // Find the friend request by its ID
        const friendRequest = await FriendRequest.findById(requestId)
            .populate('from', 'username')
            .populate('to', 'username');

        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                message: 'Friend request not found'
            });
        }

        // Verify that the current user is the recipient
        if (friendRequest.to._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to reject this friend request'
            });
        }

        // Check if request is still pending
        if (friendRequest.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `Friend request is already ${friendRequest.status}`
            });
        }

        // Update friend request status
        friendRequest.status = 'Rejected';
        await friendRequest.save();

        // Create notification for the sender about rejection
        await Notification.create({
            recipient: friendRequest.from._id,
            sender: friendRequest.to._id,
            type: 'FRIEND_REQUEST_REJECTED',
            message: `${friendRequest.to.username} rejected your friend request`,
            actionRequired: false
        });

        return res.status(200).json({
            success: true,
            message: 'Friend request rejected successfully',
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
    acceptFriendRequest,
    rejectFriendRequest
};
