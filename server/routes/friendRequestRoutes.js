const express = require('express');
const router = express.Router();
const { sendFriendRequest } = require('../controller/friendRequestController');
const { protect } = require('../middleware/authMiddlewareStudent');

router.post('/send', protect, sendFriendRequest);

module.exports = router; 