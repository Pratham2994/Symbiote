const Notification = require('../models/Notification');
const User = require('../models/User');
const Team = require('../models/Team');

const notificationController = {
  // Get unread notifications for a user
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get all unread notifications for the user
      const notifications = await Notification.find({ 
        recipient: userId,
        read: false 
      })
      .populate('sender', 'username email')
      .populate('team', 'name')
      .sort({ createdAt: -1 });

      // Group notifications by type
      const groupedNotifications = {
        actionRequired: notifications.filter(n => n.actionRequired),
        nonActionRequired: notifications.filter(n => !n.actionRequired),
        unreadCount: notifications.length
      };

      // For non-actionable notifications that were previously seen, delete them
      const seenNonActionableIds = notifications
        .filter(n => !n.actionRequired && n.seen)
        .map(n => n._id);

      if (seenNonActionableIds.length > 0) {
        await Notification.deleteMany({ _id: { $in: seenNonActionableIds } });
        
        // Update the grouped notifications to remove the deleted ones
        groupedNotifications.nonActionRequired = groupedNotifications.nonActionRequired
          .filter(n => !seenNonActionableIds.includes(n._id));
        groupedNotifications.unreadCount = groupedNotifications.actionRequired.length + 
          groupedNotifications.nonActionRequired.length;

        // Emit updated count
        await emitNotificationUpdate(userId);
      }

      // Mark remaining non-actionable notifications as seen
      const unseenNonActionableIds = notifications
        .filter(n => !n.actionRequired && !n.seen)
        .map(n => n._id);

      if (unseenNonActionableIds.length > 0) {
        await Notification.updateMany(
          { _id: { $in: unseenNonActionableIds } },
          { $set: { seen: true } }
        );
      }

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

  // Delete a notification
  deleteNotification: async (req, res) => {
    try {
      const notificationId = req.params.id;
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      await Notification.findByIdAndDelete(notificationId);
      console.log(`Notification ${notificationId} deleted for user ${notification.recipient}`);
      
      // Emit socket events
      const recipientId = notification.recipient.toString();
      global.io.to(recipientId).emit('notificationDeleted');
      await emitNotificationUpdate(recipientId);

      res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ success: false, message: 'Error deleting notification' });
    }
  },

  // Mark a notification as read
  markAsRead: async (req, res) => {
    try {
      const notificationId = req.params.id;
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      notification.read = true;
      await notification.save();
      
      // Emit socket event
      await emitNotificationUpdate(notification.recipient);

      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, message: 'Error marking notification as read' });
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (req, res) => {
    try {
      const userId = req.user._id;
      await Notification.updateMany(
        { recipient: userId, read: false },
        { $set: { read: true } }
      );
      
      // Emit socket event
      await emitNotificationUpdate(userId);

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ success: false, message: 'Error marking all notifications as read' });
    }
  },

  // Get a single notification
  getNotification: async (req, res) => {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

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

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching notification',
        error: error.message
      });
    }
  }
};

const emitNotificationUpdate = async (userId) => {
  try {
    const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });
    console.log(`Emitting notification count update for user ${userId}:`, unreadCount);
    global.io.to(userId.toString()).emit('notificationCount', { count: unreadCount });
  } catch (error) {
    console.error('Error emitting notification update:', error);
  }
};

module.exports = notificationController; 