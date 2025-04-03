const express = require('express');
const router = express.Router();
const { searchFriendbyUsername, getAllFriends, removeFriend } = require('../controller/searchForFriendController');
const { protect } = require('../middleware/authMiddlewareStudent');

router.post('/searchFriend', protect, searchFriendbyUsername);

router.post('/allFriends', protect, getAllFriends)

router.post('/remove', protect, removeFriend)

module.exports = router;
