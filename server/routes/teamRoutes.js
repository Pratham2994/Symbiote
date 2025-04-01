const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');
const { createTeam } = require('../controller/createTeamController');
const {getTeamsByUserAndCompetition} = require('../controller/viewTeamController');
const {getAllTeams} = require('../controller/getTeamsController')

router.post('/', getAllTeams);
router.post('/create', protect, createTeam);
// router.get('/:id', getTeamData) todo

router.post('/view', protect, getTeamsByUserAndCompetition);

module.exports = router; 