const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');
const { createTeam } = require('../controller/createTeamController');
const {getTeamsByUserAndCompetition} = require('../controller/viewTeamController');
const {getAllTeams} = require('../controller/getTeamsController')

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Get all teams
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: List of all teams
 */
router.post('/', getAllTeams);

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
// router.get('/:id', getTeamData) todo

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