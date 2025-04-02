const User = require('../models/User');

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

module.exports = {
    searchFriendbyUsername
};