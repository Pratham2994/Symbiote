const Notification = require('../models/Notification');
const User = require('../models/User');
const Team = require('../models/Team');

const notificationController = {
  // Get all notifications for a user
  getNotifications: async (req, res) => {
    try {
      const userId = req.user._id; // Assuming user is attached by auth middleware

      // Get all notifications for the user
      const notifications = await Notification.find({ recipient: userId })
        .populate('sender', 'username email') // Populate sender details
        .populate('team', 'name') // Populate team details if present
        .sort({ createdAt: -1 }); // Sort by newest first

      // Group notifications by type for easier frontend handling
      const groupedNotifications = {
        friendRequests: notifications.filter(n => n.type.startsWith('FRIEND_REQUEST')),
        teamInvites: notifications.filter(n => n.type.startsWith('TEAM_INVITE')),
        teamJoinRequests: notifications.filter(n => n.type.startsWith('TEAM_JOIN_REQUEST')),
        unreadCount: notifications.filter(n => !n.read).length
      };

      res.json({
        success: true,
        data: groupedNotifications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching notifications',
        error: error.message
      });
    }
  },

  // Mark a notification as read
  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user._id;

      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      notification.read = true;
      await notification.save();

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error marking notification as read',
        error: error.message
      });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user._id;

      await Notification.updateMany(
        { recipient: userId, read: false },
        { read: true }
      );

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error marking notifications as read',
        error: error.message
      });
    }
  }
};

module.exports = notificationController; 