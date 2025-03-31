const Team = require('../models/Team');
const User = require('../models/User');
const Competition = require('../models/competition');

const getTeamsByUserAndCompetition = async (req, res) => {
    try {
        const { user_id, competition_id } = req.body;

        // Get user scores
        const user = await User.findById(user_id)
            .select('frontendScore backendScore eqScore');

        // Get teams registered for the specific competition
        const competition = await Competition.findById(competition_id)
            .populate({
                path: 'registeredTeams',
                select: 'name members'
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                userScores: {
                    frontendScore: user.frontendScore,
                    backendScore: user.backendScore,
                    eqScore: user.eqScore
                },
                registeredTeams: competition.registeredTeams
            }
        });

    } catch (error) {
        console.error('Error in getTeamsByUserAndCompetition:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    getTeamsByUserAndCompetition
};

