const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');
const { createTeam } = require('../controller/createTeamController');

router.post('/create', createTeam);

module.exports = router; 