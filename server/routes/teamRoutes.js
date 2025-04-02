const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');
const { createTeam } = require('../controller/createTeamController');
const {getTeamsByUserAndCompetition} = require('../controller/viewTeamController');
const {getUserTeams, getOneTeam} = require('../controller/getTeamsController')

/**
 * @swagger
 * /api/teams/{userId}:
 *   get:
 *     summary: Get all teams for a user
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to get teams for
 *     responses:
 *       200:
 *         description: List of all teams for the user
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Server error
 */
router.get('/myteams/:userId', protect, getUserTeams);
router.get('/:teamId', protect, getOneTeam);
/**
 * @swagger
 * /api/teams/create:
 *   post:
 *     summary: Create a new team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Team created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/create', protect, createTeam);

/**
 * @swagger
 * /api/teams/view:
 *   post:
 *     summary: Get teams by user and competition
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teams for the user in the specified competition
 *       401:
 *         description: Unauthorized
 */
router.post('/view', protect, getTeamsByUserAndCompetition);

module.exports = router; 