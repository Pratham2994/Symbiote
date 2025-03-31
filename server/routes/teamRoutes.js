const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');
const { createTeam } = require('../controller/createTeamController');
const {getTeamsByUserAndCompetition} = require('../controller/viewTeamController');


router.post('/create', createTeam);


router.post('/view', getTeamsByUserAndCompetition);

module.exports = router; 