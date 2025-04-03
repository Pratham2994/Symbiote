import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, Bell, UserPlus, Users, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const NotificationModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    friendRequests: [],
    teamInvites: [],
    teamJoinRequests: [],
    unreadCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      if (response.data.success && response.data.data) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      setNotifications({
        friendRequests: [],
        teamInvites: [],
        teamJoinRequests: [],
        unreadCount: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await api.patch('/api/notifications/mark-all-read');
      // Refresh notifications after marking as read
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      markAllAsRead();
    }
  }, [isOpen]);

  const handleAction = async (notificationId, action, type) => {
    try {
      let endpoint;
      let actionMessage;
      
      switch (type) {
        case 'FRIEND_REQUEST':
          endpoint = `/api/friend-requests/${action}`;
          actionMessage = action === 'accept' ? 'Friend request accepted' : 'Friend request rejected';
          break;
        case 'TEAM_INVITE':
          endpoint = `/api/teams/invite/${action}`;
          actionMessage = action === 'accept' ? 'Team invite accepted' : 'Team invite declined';
          break;
        case 'TEAM_JOIN_REQUEST':
          endpoint = `/api/teams/join-request/${action}`;
          actionMessage = action === 'accept' ? 'Join request accepted' : 'Join request rejected';
          break;
        default:
          console.error('Unknown notification type:', type);
          return;
      }

      // Perform the action (accept/reject)
      const actionResponse = await api.post(endpoint, { notificationId });
      
      if (actionResponse.data.success) {
        // Show success toast
        toast.success(actionMessage, {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });

        // Mark the notification as read after successful action
        await api.patch(`/api/notifications/${notificationId}/read`);
        
        // Refresh notifications
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
      toast.error('Failed to process your request', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return <UserPlus className="w-5 h-5 text-venom-purple" />;
      case 'TEAM_INVITE':
        return <Users className="w-5 h-5 text-venom-purple" />;
      case 'TEAM_JOIN_REQUEST':
        return <Bell className="w-5 h-5 text-venom-purple" />;
      default:
        return <Bell className="w-5 h-5 text-venom-purple" />;
    }
  };

  const renderNotification = (notification) => (
    <motion.div
      key={notification._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 rounded-lg mb-4 transition-all duration-200 ${
        notification.read 
          ? 'bg-void-black/50 border border-venom-purple/10' 
          : 'bg-void-black/80 border border-venom-purple/20 shadow-lg shadow-venom-purple/10'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1">
          <p className="text-sm text-ghost-lilac">{notification.message}</p>
          <p className="text-xs text-ghost-lilac/60 mt-1">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
        {notification.actionRequired && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleAction(notification._id, 'accept', notification.type)}
              className="p-1 rounded-full hover:bg-venom-purple/20 transition-colors"
            >
              <Check className="w-4 h-4 text-venom-purple" />
            </button>
            <button
              onClick={() => handleAction(notification._id, 'reject', notification.type)}
              className="p-1 rounded-full hover:bg-venom-purple/20 transition-colors"
            >
              <XCircle className="w-4 h-4 text-venom-purple" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-16 w-96 max-h-[calc(100vh-5rem)] bg-void-black border border-venom-purple/20 rounded-lg shadow-lg shadow-venom-purple/10 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-venom-purple/20 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-ghost-lilac">Notifications</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-venom-purple/20 transition-colors"
              >
                <X className="w-5 h-5 text-ghost-lilac" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
              {isLoading ? (
                <div className="p-4 text-center text-ghost-lilac/60">Loading notifications...</div>
              ) : (
                <div className="p-4 space-y-4">
                  {notifications?.friendRequests?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-ghost-lilac/60 mb-2">Friend Requests</h3>
                      {notifications.friendRequests.map(renderNotification)}
                    </div>
                  )}
                  
                  {notifications?.teamInvites?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-ghost-lilac/60 mb-2">Team Invites</h3>
                      {notifications.teamInvites.map(renderNotification)}
                    </div>
                  )}
                  
                  {notifications?.teamJoinRequests?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-ghost-lilac/60 mb-2">Team Join Requests</h3>
                      {notifications.teamJoinRequests.map(renderNotification)}
                    </div>
                  )}

                  {(!notifications?.friendRequests?.length &&
                    !notifications?.teamInvites?.length &&
                    !notifications?.teamJoinRequests?.length) && (
                      <div className="text-center text-ghost-lilac/60 py-8">
                        No notifications
                      </div>
                    )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal; 