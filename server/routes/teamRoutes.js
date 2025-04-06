const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');
const { createTeam } = require('../controller/createTeamController');
const { getTeamsByUserAndCompetition } = require('../controller/viewTeamController');
const { getFriendsByTeamAndCompetition } = require('../controller/viewFriendsController');
const { getUserTeams, getOneTeam } = require('../controller/getTeamsController');
const { removeMemberFromTeam } = require('../controller/removeMemberFromTeamController');
const { deleteTeam, leaveTeam } = require('../controller/deleteTeamController');
const {joinTeamRequest, handleJoinRequest} = require('../controller/joinTeamRequestController')
const {inviteToTeam, handleTeamInvite} = require('../controller/inviteToTeamController')

router.get('/myteams/:userId', protect , getUserTeams);
router.get('/:teamId', protect , getOneTeam);
router.post('/create', protect, createTeam);
router.post('/view', protect , getTeamsByUserAndCompetition);
router.post('/viewFriends', protect, getFriendsByTeamAndCompetition);
router.post('/joinRequest', protect , joinTeamRequest)
router.post('/handleJoinRequest', protect , handleJoinRequest)
router.post('/invite', protect , inviteToTeam)
router.post('/handleTeamInvite', protect , handleTeamInvite)
router.post('/removeMember', protect, removeMemberFromTeam);
router.post('/delete', protect, deleteTeam);
router.post('/leave', protect, leaveTeam);

module.exports = router; 