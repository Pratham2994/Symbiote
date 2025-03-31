const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');

const {
    createCompetition,
    getAllCompetitions,
    getCompetitionById
} = require('../controller/competitionController');

// Public routes (no middleware)
router.get('/',getAllCompetitions);
router.get('/:id',protect, getCompetitionById);



// Admin only routes (require admin authentication)
router.post('/',createCompetition);

module.exports = router; 