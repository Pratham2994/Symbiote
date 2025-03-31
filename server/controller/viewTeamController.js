const Team = require('../models/Team');
const User = require('../models/User');
const Competition = require('../models/competition');

const getTeamsByUserAndCompetition = async (req, res) => {
    try {
        const { user_id, competition_id } = req.body;

        const user = await User.findById(user_id)
            .select('frontendScore backendScore eqScore');

        const competition = await Competition.findById(competition_id)
            .populate({
                path: 'registeredTeams',
                populate: {
                    path: 'members',
                    select: 'frontendScore backendScore eqScore'
                },
                select: 'name members averageFrontendScore averageBackendScore averageEqScore'
            });

        if (!user || !competition) {
            return res.status(404).json({
                success: false,
                message: !user ? 'User not found' : 'Competition not found'
            });
        }
        console.log(competition);
        console.log(user);
        // Calculate match scores for each team
        const teamsWithScores = await Promise.all(competition.registeredTeams.map(async (team) => {
            let teamScores;
            
            // If team has more than one member, use average scores
            if (team.members.length > 1) {
                teamScores = {
                    frontend: team.averageFrontendScore,
                    backend: team.averageBackendScore,
                    eq: team.averageEqScore
                };
            } else {
                // If team has only one member, use that member's scores
                const member = team.members[0];
                teamScores = {
                    frontend: member.frontendScore,
                    backend: member.backendScore,
                    eq: member.eqScore
                };
            }

            const userScores = {
                frontend: user.frontendScore,
                backend: user.backendScore,
                eq: user.eqScore
            };

            const matchScore = await findMatch(userScores, teamScores);

            return {
                teamId: team._id,
                name: team.name,
                members: team.members,
                matchScore: matchScore
            };
        }));

        // Sort teams by match score in descending order
        teamsWithScores.sort((a, b) => b.matchScore - a.matchScore);

        res.status(200).json({
            success: true,
            data: {
                userScores: {
                    frontendScore: user.frontendScore,
                    backendScore: user.backendScore,
                    eqScore: user.eqScore
                },
                teams: teamsWithScores
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

