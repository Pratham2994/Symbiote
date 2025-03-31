const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');
const { createTeam } = require('../controller/createTeamController');

router.post('/create', protect,createTeam);

module.exports = router; 