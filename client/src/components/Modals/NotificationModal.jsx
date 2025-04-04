import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, Bell, UserPlus, Users, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const AUTO_DISMISS_DELAY = 3500; // 3.5 seconds for non-actionable notifications

const NotificationModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { socket, setUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState({
    actionRequired: [],
    nonActionRequired: [],
    unreadCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dismissTimeouts] = useState(new Map());

  // Auto-dismiss non-actionable notifications
  const autoDismissNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => ({
        ...prev,
        nonActionRequired: prev.nonActionRequired.filter(n => n._id !== notificationId),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
      setUnreadCount(prev => Math.max(0, prev - 1)); // Update global count
      dismissTimeouts.delete(notificationId);
    } catch (error) {
      console.error('Error auto-dismissing notification:', error);
      // If notification is already gone (404) or any other error, just update UI
      setNotifications(prev => ({
        ...prev,
        nonActionRequired: prev.nonActionRequired.filter(n => n._id !== notificationId),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
      setUnreadCount(prev => Math.max(0, prev - 1)); // Update global count
      dismissTimeouts.delete(notificationId);
    }
  }, [dismissTimeouts, setUnreadCount]);

  // Clear all timeouts when component unmounts or modal closes
  useEffect(() => {
    return () => {
      dismissTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      dismissTimeouts.clear();
    };
  }, [dismissTimeouts]);

  // Handle WebSocket events
  useEffect(() => {
    if (!socket || !isOpen) return;

    // Handle new notifications
    const handleNewNotification = (notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => {
        const target = notification.actionRequired ? 'actionRequired' : 'nonActionRequired';
        return {
          ...prev,
          [target]: [notification, ...prev[target]],
          unreadCount: prev.unreadCount + 1
        };
      });
    };

    // Handle notification deletion
    const handleNotificationDeleted = () => {
      console.log('NotificationModal: Received notificationDeleted event');
      // We'll fetch notifications again to ensure we have the latest state
      fetchNotifications();
    };

    socket.on('newNotification', handleNewNotification);
    socket.on('notificationDeleted', handleNotificationDeleted);

    return () => {
      socket.off('newNotification', handleNewNotification);
      socket.off('notificationDeleted', handleNotificationDeleted);
    };
  }, [socket, isOpen]);

  // Fetch notifications and set up auto-dismiss
  const fetchNotifications = useCallback(async () => {
    if (!isOpen || !user?._id) return;
    
    try {
      setIsLoading(true);
      const response = await api.get('/api/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.data.unreadCount);

        // Clear existing timeouts
        dismissTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        dismissTimeouts.clear();

        // Set up new timeouts for non-actionable notifications
        response.data.data.nonActionRequired.forEach(notification => {
          if (!dismissTimeouts.has(notification._id)) {
            const timeoutId = setTimeout(() => {
              autoDismissNotification(notification._id);
            }, AUTO_DISMISS_DELAY);
            dismissTimeouts.set(notification._id, timeoutId);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications', {
        position: "bottom-right",
        theme: "dark",
        style: {
          background: '#0B0B0B',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
          color: '#E5E7EB'
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, user?._id, setUnreadCount, dismissTimeouts, autoDismissNotification]);

  // Fetch notifications when modal opens
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle notification actions (accept/reject)
  const handleAction = async (notificationId, action, type, actionData) => {
    try {
      let endpoint;
      let requestData;
      
      // Normalize action to lowercase for consistency
      const normalizedAction = action.toLowerCase();
      
      switch (type) {
        case 'FRIEND_REQUEST':
          endpoint = `/api/friend-requests/${normalizedAction}`;
          requestData = { requestId: actionData.requestId };
          break;
        case 'TEAM_INVITE':
          endpoint = `/api/teams/handleTeamInvite`;
          requestData = { inviteId: actionData.inviteId, action: normalizedAction };
          break;
        case 'TEAM_JOIN_REQUEST':
          endpoint = `/api/teams/handleJoinRequest`;
          requestData = { requestId: actionData.requestId, action: normalizedAction };
          break;
        default:
          console.error('Unknown notification type:', type);
          return;
      }

      console.log('Sending action request:', { endpoint, requestData });

      // First try to perform the action
      const actionResponse = await api.post(endpoint, requestData);
      
      if (actionResponse.data.success) {
        // Then try to delete the notification
        try {
          await api.delete(`/api/notifications/${notificationId}`);
          // Update local state immediately
          setNotifications(prev => ({
            ...prev,
            actionRequired: prev.actionRequired.filter(n => n._id !== notificationId),
            unreadCount: Math.max(0, prev.unreadCount - 1)
          }));
          setUnreadCount(prev => Math.max(0, prev - 1)); // Update global count
        } catch (deleteError) {
          // If notification is already gone, that's fine
          if (deleteError.response?.status !== 404) {
            throw deleteError;
          }
        }
        
        toast.success(`${type.toLowerCase().replace(/_/g, ' ')} ${action}ed`, {
          position: "bottom-right",
          theme: "dark",
          style: {
            background: '#0B0B0B',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
            color: '#E5E7EB'
          }
        });
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
      toast.error(error.response?.data?.message || 'Failed to process your request', {
        position: "bottom-right",
        theme: "dark",
        style: {
          background: '#0B0B0B',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
          color: '#E5E7EB'
        }
      });
    }
  };

  // Get appropriate icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'FRIEND_REQUEST':
      case 'FRIEND_REQUEST_ACCEPTED':
        return <UserPlus className="w-5 h-5 text-venom-purple" />;
      case 'TEAM_INVITE':
      case 'TEAM_INVITE_ACCEPTED':
      case 'TEAM_JOIN_REQUEST':
      case 'TEAM_JOIN_ACCEPTED':
        return <Users className="w-5 h-5 text-venom-purple" />;
      default:
        return <Bell className="w-5 h-5 text-venom-purple" />;
    }
  };

  // Render a single notification
  const renderNotification = (notification) => (
    <motion.div
      key={notification._id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 rounded-lg mb-4 bg-void-black/80 border border-venom-purple/20 shadow-lg shadow-venom-purple/10 group hover:border-venom-purple/40 transition-all duration-200"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ghost-lilac">{notification.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-ghost-lilac/60" />
            <p className="text-xs text-ghost-lilac/60">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        {notification.actionRequired && (
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleAction(notification._id, 'accept', notification.type, notification.actionData)}
              className="p-1.5 rounded-full hover:bg-venom-purple/20 transition-all duration-200 group/button relative"
              title="Accept"
            >
              <Check className="w-4 h-4 text-venom-purple group-hover/button:scale-110 transition-transform" />
              <span className="absolute inset-0 rounded-full bg-venom-purple/10 opacity-0 group-hover/button:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => handleAction(notification._id, 'reject', notification.type, notification.actionData)}
              className="p-1.5 rounded-full hover:bg-red-500/20 transition-all duration-200 group/button relative"
              title="Reject"
            >
              <XCircle className="w-4 h-4 text-red-400 group-hover/button:scale-110 transition-transform" />
              <span className="absolute inset-0 rounded-full bg-red-500/10 opacity-0 group-hover/button:opacity-100 transition-opacity" />
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-16 w-96 max-h-[calc(100vh-5rem)] bg-void-black border border-venom-purple/20 rounded-lg shadow-lg shadow-venom-purple/10 z-[101] overflow-hidden"
          >
            <div className="p-4 border-b border-venom-purple/20 flex justify-between items-center bg-void-black/95">
              <h2 className="text-lg font-semibold text-ghost-lilac flex items-center gap-2">
                <Bell className="w-5 h-5 text-venom-purple" />
                Notifications
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-venom-purple/20 transition-colors"
              >
                <X className="w-5 h-5 text-ghost-lilac" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-12rem)] p-4 space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-venom-purple/20 border-t-venom-purple rounded-full"
                  />
                </div>
              ) : (
                <>
                  {notifications.actionRequired.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-ghost-lilac/60 mb-2">Action Required</h3>
                      <AnimatePresence mode="popLayout">
                        {notifications.actionRequired.map(renderNotification)}
                      </AnimatePresence>
                    </div>
                  )}
                  
                  {notifications.nonActionRequired.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-ghost-lilac/60 mb-2">Recent Updates</h3>
                      <AnimatePresence mode="popLayout">
                        {notifications.nonActionRequired.map(renderNotification)}
                      </AnimatePresence>
                    </div>
                  )}

                  {notifications.actionRequired.length === 0 && notifications.nonActionRequired.length === 0 && (
                    <div className="text-center py-8">
                      <Bell className="w-8 h-8 text-ghost-lilac/40 mx-auto mb-2" />
                      <p className="text-ghost-lilac/60">No new notifications</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal; 