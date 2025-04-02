const express = require('express');
const router = express.Router();
const { searchFriendbyUsername, getAllFriends } = require('../controller/searchForFriendController');
const { protect } = require('../middleware/authMiddlewareStudent');

router.post('/searchFriend', protect, searchFriendbyUsername);

router.post('/allFriends', protect , getAllFriends)

module.exports = router;
