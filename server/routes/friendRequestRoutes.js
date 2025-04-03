const express = require('express');
const router = express.Router();
const { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = require('../controller/friendRequestController');
const { protect } = require('../middleware/authMiddlewareStudent');


router.post('/send',protect, sendFriendRequest);
router.post('/accept', protect, acceptFriendRequest);
router.post('/reject', protect, rejectFriendRequest);

module.exports = router;
