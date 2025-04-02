const express = require('express');
const router = express.Router();
const { sendFriendRequest, acceptFriendRequest } = require('../controller/friendRequestController');
const { protect } = require('../middleware/authMiddlewareStudent');


router.post('/send',protect, sendFriendRequest);
router.post('/accept', protect, acceptFriendRequest);

module.exports = router;
