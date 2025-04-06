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

        const response = await axios.post(`${process.env.ML_SERVICE_URL}/calculate-match`, payload, {
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

const getFriendsByTeamAndCompetition = async (req, res) => {
    try {
        const { team_id } = req.body;
        
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        const currentUserId = req.user._id || req.user.id;

        // Input validation
        if (!team_id) {
            return res.status(400).json({
                success: false,
                message: 'Team ID is required'
            });
        }

        // Validate ObjectId format
        if (!team_id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }

        // Get the team
        const team = await Team.findById(team_id)
            .populate({
                path: 'members',
                select: 'frontendScore backendScore eqScore username githubLink linkedinLink twitterLink'
            });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        // Get the competition
        // const competition = await Competition.findById(competition_id);

        // if (!competition) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'Competition not found'
        //     });
        // }

        // // Check if competition registration deadline has passed
        // const registrationDeadline = new Date(competition.registrationDeadline);
        // if (registrationDeadline < new Date()) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Registration deadline for this competition has passed'
        //     });
        // }

        // // Check if competition has started
        // const competitionStartDate = new Date(competition.competitionStartDate);
        // if (competitionStartDate < new Date()) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'This competition has already started'
        //     });
        // }

        // Calculate team scores (average of all members)
        let teamScores;
        if (team.members.length > 0) {
            const totalScores = team.members.reduce((acc, member) => {
                return {
                    frontend: acc.frontend + (member.frontendScore || 0),
                    backend: acc.backend + (member.backendScore || 0),
                    eq: acc.eq + (member.eqScore || 0)
                };
            }, { frontend: 0, backend: 0, eq: 0 });

            teamScores = {
                frontend: totalScores.frontend / team.members.length,
                backend: totalScores.backend / team.members.length,
                eq: totalScores.eq / team.members.length
            };
        } else {
            return res.status(400).json({
                success: false,
                message: 'Team has no members'
            });
        }

        // Get current user's friends
        const currentUser = await User.findById(currentUserId).select('friends');
        
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'Current user not found'
            });
        }

        // Get friend details who have completed assessments
        const friends = await User.find({
            _id: { $in: currentUser.friends },
            frontendScore: { $exists: true, $ne: null },
            backendScore: { $exists: true, $ne: null },
            eqScore: { $exists: true, $ne: null }
        }).select('frontendScore backendScore eqScore username githubLink linkedinLink twitterLink');

        // Calculate match scores for each friend
        const friendsWithScores = await Promise.all(friends.map(async (friend) => {
            const friendScores = {
                frontend: friend.frontendScore,
                backend: friend.backendScore,
                eq: friend.eqScore
            };

            try {
                const matchScore = await findMatch(teamScores, friendScores);
                return {
                    _id: friend._id,
                    username: friend.username,
                    frontendScore: friend.frontendScore,
                    backendScore: friend.backendScore,
                    eqScore: friend.eqScore,
                    githubLink: friend.githubLink || null,
                    linkedinLink: friend.linkedinLink || null,
                    twitterLink: friend.twitterLink || null,
                    matchScore: matchScore
                };
            } catch (error) {
                console.error(`Error calculating match score for friend ${friend.username}:`, error);
                return {
                    _id: friend._id,
                    username: friend.username,
                    frontendScore: friend.frontendScore,
                    backendScore: friend.backendScore,
                    eqScore: friend.eqScore,
                    githubLink: friend.githubLink || null,
                    linkedinLink: friend.linkedinLink || null,
                    twitterLink: friend.twitterLink || null,
                    matchScore: null,
                    error: 'Failed to calculate match score'
                };
            }
        }));

        // Filter out friends with failed calculations
        const validFriends = friendsWithScores.filter(friend => friend.matchScore !== null);
        const failedFriends = friendsWithScores.filter(friend => friend.matchScore === null);

        // Sort friends by match score in descending order
        validFriends.sort((a, b) => b.matchScore - a.matchScore);

        res.status(200).json({
            success: true,
            data: {
                teamScores: teamScores,
                friends: validFriends,
                failedCalculations: failedFriends.length > 0 ? failedFriends : undefined
            }
        });

    } catch (error) {
        console.error('Error in getFriendsByTeamAndCompetition:', error);
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
    getFriendsByTeamAndCompetition
};