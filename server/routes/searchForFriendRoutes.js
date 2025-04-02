const express = require('express');
const router = express.Router();
const { searchFriendbyUsername } = require('../controller/searchForFriendController');
const { protect } = require('../middleware/authMiddlewareStudent');
router.post('/searchFriend',protect, searchFriendbyUsername);

module.exports = router;
