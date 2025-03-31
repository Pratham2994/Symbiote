const Competition = require('../models/competition');

const createCompetition = async (req, res) => {
    try {
        const {
            title,
            ongoing,
            tags,
            description,
            collegeName,
            competitionLocation,
            competitionStartDate,
            competitionEndDate,
            timing,
            registrationLink,
            prize,
            registrationDeadline,
            registrationFee,
            contact,
            imagePath
        } = req.body;

        // Validate required fields
        if (!title || !description || !competitionStartDate || !competitionEndDate) {
            return res.status(400).json({ 
                message: 'Missing required fields. Title, description, start date, and end date are required.' 
            });
        }

        const competition = await Competition.create({
            title,
            ongoing: ongoing || false,
            tags: tags || [],
            description,
            collegeName,
            competitionLocation,
            competitionStartDate,
            competitionEndDate,
            timing,
            registrationLink,
            prize,
            registrationDeadline,
            registrationFee,
            contact,
            imagePath,
            registeredTeams: []
        });

        res.status(201).json({
            success: true,
            data: competition
        });

    } catch (error) {
        console.error('Error creating competition:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating competition',
            error: error.message
        });
    }
};

// Get all competitions
const getAllCompetitions = async (req, res) => {
    try {
        
        const sortOrder = req.query.sortOrder || 'asc' ? -1:1;

        const competitions = await Competition.find().sort({ competitionStartDate: sortOrder });
        res.status(200).json({
            success: true,
            count: competitions.length,
            data: competitions
        });
    } catch (error) {
        console.error('Error fetching competitions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching competitions',
            error: error.message
        });
    }
};

// const getCompetitionById = async (req, res) => {
//     try {
//         const competition = await Competition.findById(req.params.id);
        
//         if (!competition) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Competition not found'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: competition
//         });
//     } catch (error) {
//         console.error('Error fetching competition:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching competition',
//             error: error.message
//         });
//     }
// };

module.exports = {
    createCompetition,
    getAllCompetitions,
}; 