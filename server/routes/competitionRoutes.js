const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');

const {
    createCompetition,
    getAllCompetitions,
    getCompetitionById
} = require('../controller/competitionController');

/**
 * @swagger
 * /api/competitions:
 *   get:
 *     summary: Get all competitions
 *     tags: [Competitions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all competitions
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, getAllCompetitions);

/**
 * @swagger
 * /api/competitions/{id}:
 *   get:
 *     summary: Get competition by ID
 *     tags: [Competitions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Competition ID
 *     responses:
 *       200:
 *         description: Competition details
 *       404:
 *         description: Competition not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', protect, getCompetitionById);

/**
 * @swagger
 * /api/competitions:
 *   post:
 *     summary: Create a new competition
 *     tags: [Competitions]
 *     responses:
 *       201:
 *         description: Competition created successfully
 *       400:
 *         description: Invalid request body
 */
router.post('/', createCompetition);

module.exports = router; 