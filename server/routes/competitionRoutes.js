const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');

const {
    createCompetition,
    getAllCompetitions,
    getCompetitionById
} = require('../controller/competitionController');

router.get('/', protect, getAllCompetitions);
router.get('/:id', protect, getCompetitionById);
router.post('/', createCompetition);

module.exports = router; 