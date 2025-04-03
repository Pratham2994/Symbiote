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

            // Validate dates
            const startDate = new Date(competitionStartDate);
            const endDate = new Date(competitionEndDate);
            const regDeadline = registrationDeadline ? new Date(registrationDeadline) : null;

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format for start or end date'
                });
            }

            if (startDate >= endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Competition end date must be after start date'
                });
            }

            if (regDeadline && (isNaN(regDeadline.getTime()) || regDeadline >= startDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'Registration deadline must be before competition start date'
                });
            }

            // Validate registration fee if provided
            if (registrationFee !== undefined && (isNaN(registrationFee) || registrationFee < 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Registration fee must be a non-negative number'
                });
            }

            // Validate tags if provided
            if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
                return res.status(400).json({
                    success: false,
                    message: 'Tags must be an array of strings'
                });
            }

            const newComp = await Competition.create({
                title,
                ongoing: ongoing || false,
                tags: tags || [],
                description,
                collegeName,
                competitionLocation,
                competitionStartDate: startDate,
                competitionEndDate: endDate,
                timing,
                registrationLink,
                prize,
                registrationDeadline: regDeadline,
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
        // Validate and parse query parameters
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                message: 'Page and limit must be positive numbers'
            });
        }

        const skip = (page - 1) * limit;

        // Build filter based on query parameters
        const filter = {};
        if (req.query.ongoing !== undefined) {
            filter.ongoing = req.query.ongoing === 'true';
        }
        if (req.query.tags) {
            filter.tags = { $in: req.query.tags.split(',') };
        }
        if (req.query.startDate) {
            filter.competitionStartDate = { $gte: new Date(req.query.startDate) };
        }
        if (req.query.endDate) {
            filter.competitionEndDate = { $lte: new Date(req.query.endDate) };
        }

        const competitions = await Competition.find(filter)
            .sort({ competitionStartDate: sortOrder })
            .skip(skip)
            .limit(limit)
            .populate('registeredTeams', 'name members');

        const total = await Competition.countDocuments(filter);

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
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Competition ID is required'
            });
        }

        const competition = await Competition.findById(id)
            .populate('registeredTeams', 'name members');
        
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