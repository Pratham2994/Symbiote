const express = require('express');
const { getGitHubRank } = require('../controller/githubRankController');

const router = express.Router();

// Get GitHub rank for a user
router.get('/rank/:username', getGitHubRank);

module.exports = router; 