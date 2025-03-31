const Team = require('../models/Team');
const User = require('../models/User');
const Competition = require('../models/competition');

exports.createTeam = async (req, res) => {
    try {
        const { name, user_id, competition_id } = req.body;
        
        // Basic required fields validation
        if (!name || !user_id || !competition_id) {
            return res.status(400).json({
                success: false,
                message: 'Name, user ID, and competition ID are required'
            });
        }

        // Team name validation
        if (name.length < 3 || name.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Team name must be between 3 and 50 characters'
            });
        }

        // Team name format validation (only letters, numbers, spaces, and basic punctuation)
        if (!/^[a-zA-Z0-9\s\-_.,!?]+$/.test(name)) {
            return res.status(400).json({
                success: false,
                message: 'Team name can only contain letters, numbers, spaces, and basic punctuation'
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

        // Check if competition registration deadline has passed
        const registrationDeadline = new Date(competition.registrationDeadline);
        if (registrationDeadline < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Registration deadline for this competition has passed'
            });
        }

        // Check if competition has started
        const competitionStartDate = new Date(competition.competitionStartDate);
        if (competitionStartDate < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'This competition has already started'
            });
        }

        // Check if user is already a member of another team in this competition
        const existingTeamMember = await Team.findOne({
            competition: competition_id,
            members: user_id
        });

        if (existingTeamMember) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of another team in this competition'
            });
        }

        // Check if user has already created a team for this competition
        const existingTeamCreated = await Team.findOne({
            competition: competition_id,
            createdBy: user_id
        });

        if (existingTeamCreated) {
            return res.status(400).json({
                success: false,
                message: 'You have already created a team for this competition'
            });
        }

        // Check if team name is already taken in this competition
        const existingTeamName = await Team.findOne({
            competition: competition_id,
            name: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive match
        });

        if (existingTeamName) {
            return res.status(400).json({
                success: false,
                message: 'This team name is already taken for this competition'
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

        // Start a session for transaction
        const session = await Team.startSession();
        session.startTransaction();

        try {
            // Create the new team
            const newTeam = await Team.create([{
                name,
                createdBy: user_id,
                members: [user_id],
                competition: competition_id,
                averageFrontendScore: user.frontendScore || 0,
                averageBackendScore: user.backendScore || 0,
                averageEqScore: user.eqScore || 0,
                skills: skillsArray,
            }], { session });

            // Update the competition's registered teams array
            await Competition.findByIdAndUpdate(
                competition_id,
                { $push: { registeredTeams: newTeam[0]._id } },
                { session, new: true }
            );

            // Commit the transaction
            await session.commitTransaction();

            res.status(201).json({
                success: true,
                data: newTeam[0]
            });

        } catch (error) {
            // If an error occurred, abort the transaction
            await session.abortTransaction();
            throw error;
        } finally {
            // End the session
            session.endSession();
        }

    } catch (error) {
        console.error('Error creating team:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create team'
        });
    }
}; 