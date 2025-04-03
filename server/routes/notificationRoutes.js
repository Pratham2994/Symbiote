const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');
const { protect } = require('../middleware/authMiddlewareStudent');

// All routes require authentication
router.use(protect);

// Get all notifications for the authenticated user
router.get('/', notificationController.getNotifications);

// Get a single notification
router.get('/:notificationId', notificationController.getNotification);

// Delete a notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Mark a specific notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

module.exports = router; 