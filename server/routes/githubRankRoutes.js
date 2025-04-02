const express = require('express');
const { getGitHubRank } = require('../controller/githubRankController');

const router = express.Router();

/**
 * @swagger
 * /api/github/rank/{username}:
 *   get:
 *     summary: Get GitHub rank for a user
 *     tags: [GitHub]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username
 *     responses:
 *       200:
 *         description: GitHub rank details
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid username
 */

// Get GitHub rank for a user
router.get('/rank/:username', getGitHubRank);

module.exports = router; 