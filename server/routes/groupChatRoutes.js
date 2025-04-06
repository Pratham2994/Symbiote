const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddlewareStudent');
const {
  createGroupChat,
  getGroupChatMessages,
  sendMessage,
  getUnreadCount,
  markAsRead
} = require('../controllers/groupChatController');

// Create a group chat for a team
router.post('/create', protect, createGroupChat);

// Get messages for a group chat
router.get('/:groupId/messages', protect, getGroupChatMessages);

// Send a message to the group chat
router.post('/:groupId/messages', protect, sendMessage);

// Get unread message count for a user
router.get('/unread-count', protect, getUnreadCount);

// Mark messages as read
router.put('/:groupId/read', protect, markAsRead);

module.exports = router; 