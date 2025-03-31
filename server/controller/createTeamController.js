const Team = require('../models/Team');
const User = require('../models/User');
const Competition = require('../models/competition');

exports.createTeam = async (req, res) => {
    try {
        const { name, user_id, competition_id } = req.body;
        
        if (!name || !user_id || !competition_id) {
            return res.status(400).json({
                success: false,
                message: 'Name, user ID, and competition ID are required'
            });
        }

        // Get the user's details and competition from the database
        const user = await User.findById(user_id);
        const competition = await Competition.findById(competition_id);

        if (!user || !competition) {
            return res.status(404).json({
                success: false,
                message: 'User or Competition not found'
            });
        }
        
        // Convert skills string to array if it exists
        let skillsArray = [];
        if (user.skills) {
            try {
                skillsArray = JSON.parse(user.skills);
            } catch (e) {
                // If skills is not JSON, treat it as a comma-separated string
                skillsArray = user.skills.split(',').map(skill => skill.trim());
            }
        }

        const newTeam = await Team.create({
            name,
            createdBy: user_id,
            members: [user_id],
            competition: competition_id,
            averageFrontendScore: user.frontendScore || 0,
            averageBackendScore: user.backendScore || 0,
            averageEqScore: user.eqScore || 0,
            skills: skillsArray,
        });

        res.status(201).json({
            success: true,
            data: newTeam
        });

    } catch (error) {
        console.error('Error creating team:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 