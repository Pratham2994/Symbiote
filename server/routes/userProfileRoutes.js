const express = require('express')
const {getUserProfile, getUserNotifications} = require('../controller/userProfileController')
const { protect } = require('../middleware/authMiddlewareStudent');
const router = express.Router()

router.get('/notifications', getUserNotifications)
router.get('/:userId', protect, getUserProfile)


module.exports = router