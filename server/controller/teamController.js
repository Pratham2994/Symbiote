const Team = require('../models/Team');
const User = require('../models/User');

exports.createTeam = async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Team name is required'
            });
        }

        // Get the user's details from the database using the ID from token
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const newTeam = await Team.create({
            name,
            createdBy: user._id,
            members: [user._id],
            averageFrontendScore: user.frontendScore || 0,
            averageBackendScore: user.backendScore || 0,
            averageEqScore: user.eqScore || 0,
            skills: user.skills ? JSON.parse(user.skills) : [],
        });

        res.status(201).json({
            success: true,
            data: newTeam
        });

    } catch (error) {
        console.error('Error creating team:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error creating team'
        });
    }
}; 