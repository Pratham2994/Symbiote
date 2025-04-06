import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';
import { io } from 'socket.io-client';

const GroupChatContext = createContext();

export const useGroupChat = () => {
  return useContext(GroupChatContext);
};

export const GroupChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const activeChatRef = useRef(activeChat);

  // Update activeChat ref when it changes
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Mark messages as read
  const markMessagesAsRead = async (groupId) => {
    try {
      await api.put(`/api/group-chat/${groupId}/read`, {}, {
        withCredentials: true
      });
      
      // Update unread count locally immediately
      setUnreadCounts(prev => ({
        ...prev,
        [groupId]: 0
      }));
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Socket connection and event handling
  useEffect(() => {
    if (!user?._id) return;

    // console.log('GroupChatContext: Initializing socket connection');
    
    const newSocket = io(import.meta.env.VITE_API_DOMAIN, {
      withCredentials: true,
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      // console.log('GroupChatContext: Socket connected with ID:', newSocket.id);
      newSocket.emit('authenticate', user._id);
    });

    newSocket.on('disconnect', () => {
      // console.log('GroupChatContext: Socket disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('GroupChatContext: Socket connection error:', error);
    });

    // Listen for new messages
    newSocket.on('newMessage', ({ groupId, message }) => {
      // console.log('GroupChatContext: New message received for group:', groupId, message);
      // console.log('GroupChatContext: Current active chat:', activeChatRef.current?._id);

      // Update messages if chat is active
      if (activeChatRef.current && activeChatRef.current._id === groupId) {
        // console.log('GroupChatContext: Updating messages for active chat');
        setMessages(prev => [...prev, message]);
        // Removed auto-scroll from here - let the modal component handle it
      } else {
        // Only update unread count if chat is not active
        // console.log('GroupChatContext: Updating unread count for inactive chat');
        setUnreadCounts(prev => ({
          ...prev,
          [groupId]: (prev[groupId] || 0) + 1
        }));
      }
    });

    // Listen for unread count updates
    newSocket.on('unreadCountUpdate', ({ groupId, count }) => {
      // console.log('GroupChatContext: Unread count update received:', groupId, count);
      setUnreadCounts(prev => ({
        ...prev,
        [groupId]: count
      }));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      // console.log('GroupChatContext: Cleaning up socket connection');
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      }
    };
  }, [user?._id]);

  // Fetch unread counts on mount and when user changes
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const response = await api.get('/api/group-chat/unread-count', {
          withCredentials: true
        });
        setUnreadCounts(response.data);
      } catch (err) {
        console.error('Error fetching unread counts:', err);
      }
    };

    if (isAuthenticated && user) {
      fetchUnreadCounts();
      
      // Set up interval to periodically fetch unread counts
      const interval = setInterval(fetchUnreadCounts, 60000); // Changed from 30 seconds to 60 seconds
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Removed auto-scroll effect that was here

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get unread count for a specific chat
  const getUnreadCount = (groupId) => {
    console.log('GroupChatContext: Getting unread count for:', groupId, 'Current counts:', unreadCounts);
    return unreadCounts[groupId] || 0;
  };

  // Create a group chat for a team
  const createGroupChat = async (teamId) => {
    try {
      setLoading(true);
      const response = await api.post('/api/group-chat/create', { teamId }, {
        withCredentials: true
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group chat');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Open a group chat
  const openGroupChat = async (groupId) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('GroupChatContext: Opening chat for group:', groupId);
      
      // Set active chat first
      setActiveChat({ _id: groupId });
      
      // Join socket room
      if (socket) {
        console.log('GroupChatContext: Joining team chat room:', groupId);
        socket.emit('joinTeamChat', groupId);
      } else {
        console.error('GroupChatContext: Socket not initialized');
      }
      
      // Fetch messages
      const response = await api.get(`/api/group-chat/${groupId}/messages`, {
        withCredentials: true
      });
      
      setMessages(response.data);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to open group chat');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Close the active chat
  const closeGroupChat = () => {
    if (activeChat && socket) {
      console.log('GroupChatContext: Leaving team chat room:', activeChat._id);
      socket.emit('leaveTeamChat', activeChat._id);
    }
    setActiveChat(null);
    setMessages([]);
  };

  // Send a message
  const sendMessage = async (content, type = 'text') => {
    if (!activeChat) {
      throw new Error('No active chat');
    }
    
    try {
      const response = await api.post(`/api/group-chat/${activeChat._id}/messages`, 
        { content, type }, 
        { withCredentials: true }
      );
      
      // Remove local state update since we'll get the message via socket
      // The socket event will handle adding the message and scrolling
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      throw err;
    }
  };

  const value = {
    unreadCounts,
    activeChat,
    messages,
    loading,
    error,
    createGroupChat,
    openGroupChat,
    closeGroupChat,
    sendMessage,
    getUnreadCount,
    messagesEndRef,
    socket,
    markMessagesAsRead
  };

  return (
    <GroupChatContext.Provider value={value}>
      {children}
    </GroupChatContext.Provider>
  );
};

export default GroupChatContext; 