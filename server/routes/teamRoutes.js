const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');
const { createTeam } = require('../controller/createTeamController');
const {getTeamsByUserAndCompetition} = require('../controller/viewTeamController');
const {joinTeamRequest, handleJoinRequest} = require('../controller/joinTeamRequestController')
const {inviteToTeam, handleTeamInvite} = require('../controller/inviteToTeamController')
const {getUserTeams, getOneTeam} = require('../controller/getTeamsController')

router.get('/myteams/:userId', protect , getUserTeams);
router.get('/:teamId', protect , getOneTeam);
router.post('/create', protect, createTeam);
router.post('/view', protect , getTeamsByUserAndCompetition);
router.post('/joinRequest', protect , joinTeamRequest)
router.post('/handleJoinRequest', protect , handleJoinRequest)
router.post('/invite', protect , inviteToTeam)
router.post('/handleTeamInvite', protect , handleTeamInvite)

module.exports = router; 