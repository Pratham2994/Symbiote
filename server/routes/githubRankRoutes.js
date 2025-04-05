const express = require('express');
const { getGitHubRank } = require('../controller/githubRankController');

const router = express.Router();

router.get('/rank/:username', getGitHubRank);

module.exports = router; 