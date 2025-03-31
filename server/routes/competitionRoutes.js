const express = require('express');
const router = express.Router();
const { 
    createCompetition,
    getAllCompetitions,
    
} = require('../controller/competitionController');

// Create a new competition
router.post('/create', createCompetition);

// Get all competitions
router.get('/', getAllCompetitions);

// Get single competition by ID
// router.get('/:id', getCompetitionById);

module.exports = router; 