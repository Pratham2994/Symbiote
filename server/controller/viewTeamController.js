const Team = require('../models/Team');
const User = require('../models/User');
const Competition = require('../models/competition');
const axios = require('axios');

const findMatch = async (candidate1Scores, candidate2Scores, weights = null) => {
    try {
        const payload = {
            candidate1_scores: candidate1Scores,
            candidate2_scores: candidate2Scores,
        };

        if (weights) {
            payload.weights = weights;
        }

        const response = await axios.post('http://127.0.0.1:8000/calculate-match', payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data.match_score;
    } catch (error) {
        console.error("Error calling FastAPI service:", error.message);
        throw error;
    }
};

const getTeamsByUserAndCompetition = async (req, res) => {
    try {
        const { user_id, competition_id } = req.body;

        // Input validation
        if (!user_id || !competition_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID and Competition ID are required'
            });
        }

        // Validate ObjectId format
        if (!user_id.match(/^[0-9a-fA-F]{24}$/) || !competition_id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }

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

        // Enhanced existence validation
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

        // Validate user scores
        if (!isValidScore(user.frontendScore) || 
            !isValidScore(user.backendScore) || 
            !isValidScore(user.eqScore)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user scores detected'
            });
        }

        console.log(competition);
        console.log(user);
        // Calculate match scores for each team
        const teamsWithScores = await Promise.all(competition.registeredTeams.map(async (team) => {
            let teamScores;
            
            if (team.members.length > 1) {
                // Validate average scores
                if (!isValidScore(team.averageFrontendScore) || 
                    !isValidScore(team.averageBackendScore) || 
                    !isValidScore(team.averageEqScore)) {
                    throw new Error(`Invalid team scores for team: ${team.name}`);
                }
                teamScores = {
                    frontend: team.averageFrontendScore,
                    backend: team.averageBackendScore,
                    eq: team.averageEqScore
                };
            } else {
                const member = team.members[0];
                // Validate member scores
                if (!isValidScore(member.frontendScore) || 
                    !isValidScore(member.backendScore) || 
                    !isValidScore(member.eqScore)) {
                    throw new Error(`Invalid member scores for team: ${team.name}`);
                }
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

            try {
                const matchScore = await findMatch(userScores, teamScores);
                return {
                    teamId: team._id,
                    name: team.name,
                    members: team.members,
                    matchScore: matchScore
                };
            } catch (error) {
                console.error(`Error calculating match score for team ${team.name}:`, error);
                return {
                    teamId: team._id,
                    name: team.name,
                    members: team.members,
                    matchScore: null,
                    error: 'Failed to calculate match score'
                };
            }
        }));

        // Filter out teams with failed calculations
        const validTeams = teamsWithScores.filter(team => team.matchScore !== null);
        const failedTeams = teamsWithScores.filter(team => team.matchScore === null);

        // Sort teams by match score in descending order
        validTeams.sort((a, b) => b.matchScore - a.matchScore);

        res.status(200).json({
            success: true,
            data: {
                userScores: {
                    frontendScore: user.frontendScore,
                    backendScore: user.backendScore,
                    eqScore: user.eqScore
                },
                teams: validTeams,
                failedCalculations: failedTeams.length > 0 ? failedTeams : undefined
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

// Helper function to validate scores
function isValidScore(score) {
    return typeof score === 'number' && 
           !isNaN(score) && 
           score >= 0 && 
           score <= 100;
}

module.exports = {
    getTeamsByUserAndCompetition
};

