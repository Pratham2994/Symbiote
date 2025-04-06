import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import api from '../utils/api';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?._id) return;
    try {
      const response = await api.get('/api/notifications');
      if (response.data.success) {
        console.log('Setting initial unread count:', response.data.data.unreadCount);
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [user?._id]);

  // Initialize socket connection
  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(import.meta.env.VITE_API_DOMAIN, {
      withCredentials: true,
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('NotificationContext: Socket connected');
      newSocket.emit('authenticate', user._id);
    });

    newSocket.on('ready', () => {
      console.log('NotificationContext: Socket ready, fetching initial count');
      fetchUnreadCount();
    });

    newSocket.on('disconnect', () => {
      console.log('NotificationContext: Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('NotificationContext: Socket connection error:', error);
    });

    // Handle notification count updates
    newSocket.on('notificationCount', ({ count }) => {
      console.log('NotificationContext: Count update received:', count);
      setUnreadCount(count);
    });

    // Handle new notifications
    newSocket.on('newNotification', (notification) => {
      console.log('NotificationContext: New notification received:', notification);
      
      // Only increment the count if the notification is for the current user
      if (notification && notification.recipient && notification.recipient._id === user._id) {
        console.log('NotificationContext: Incrementing count for current user');
        setUnreadCount(prev => prev + 1);
      } else {
        console.log('NotificationContext: Notification not for current user, ignoring count increment');
      }
    });

    // Handle notification deletion
    newSocket.on('notificationDeleted', () => {
      console.log('NotificationContext: Notification deleted');
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('NotificationContext: Cleaning up socket connection');
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      }
    };
  }, [user?._id, fetchUnreadCount]);

  // Fetch initial count when component mounts
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const value = {
    unreadCount,
    setUnreadCount,
    socket,
    fetchUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext; 