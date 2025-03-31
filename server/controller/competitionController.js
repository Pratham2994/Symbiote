const Competition = require('../models/competition');
const createCompetition = async (req, res) => {
    try {
        const competitions = Array.isArray(req.body) ? req.body : [req.body];

        const createdCompetitions = [];

        for (const comp of competitions) {
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
            } = comp;

            // Validate required fields
            if (!title || !description || !competitionStartDate || !competitionEndDate) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Missing required fields in one of the entries. Title, description, start date, and end date are required.' 
                });
            }

            const newComp = await Competition.create({
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

            createdCompetitions.push(newComp);
        }

        res.status(201).json({
            success: true,
            data: createdCompetitions
        });

    } catch (error) {
        console.error('Error creating competitions:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating competitions',
            error: error.message
        });
    }
};


const getAllCompetitions = async (req, res) => {
    try {
        // Default to ascending order unless explicitly set to 'desc'
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const competitions = await Competition.find()
            .sort({ competitionStartDate: sortOrder })
            .skip(skip)
            .limit(limit);

        const total = await Competition.countDocuments();

        res.status(200).json({
            success: true,
            count: competitions.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
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

const getCompetitionById = async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id);
        
        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found'
            });
        }

        res.status(200).json({
            success: true,
            data: competition
        });
    } catch (error) {
        console.error('Error fetching competition:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching competition',
            error: error.message
        });
    }
};

module.exports = {
    createCompetition,
    getAllCompetitions,
    getCompetitionById
}; 