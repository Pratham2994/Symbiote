import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useGroupChat } from '../context/GroupChatContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const GroupChatModal = ({ isOpen, onClose, teamId, teamName }) => {
  const { 
    activeChat, 
    messages, 
    loading, 
    error, 
    openGroupChat, 
    closeGroupChat, 
    sendMessage,
    messagesEndRef
  } = useGroupChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && teamId) {
      initializeChat();
    }
    return () => {
      if (activeChat) {
        closeGroupChat();
      }
    };
  }, [isOpen, teamId]);

  const initializeChat = async () => {
    try {
      setIsInitializing(true);
      await openGroupChat(teamId);
      // Scroll to bottom after messages are loaded
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error('Failed to initialize chat:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    try {
      await sendMessage(messageText);
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0B0B0B] border border-venom-purple/30 rounded-xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-venom-purple/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-ghost-lilac">
            {teamName} - Group Chat
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-venom-purple/20 transition-colors"
          >
            <X className="text-ghost-lilac" size={20} />
          </button>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading || isInitializing ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-venom-purple"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-ghost-lilac/60 text-center">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message._id} 
                className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender._id === user._id 
                      ? 'bg-venom-purple/20 text-ghost-lilac' 
                      : 'bg-symbiote-purple/10 text-ghost-lilac'
                  }`}
                >
                  {message.sender._id !== user._id && (
                    <div className="font-medium text-xs mb-1">{message.sender.username}</div>
                  )}
                  <div className="break-words">{message.content}</div>
                  <div className="text-xs text-ghost-lilac/60 mt-1 text-right">
                    {format(new Date(message.createdAt), 'h:mm a')}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-venom-purple/20">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-void-black border border-venom-purple/30 rounded-lg px-4 py-2 text-ghost-lilac focus:outline-none focus:border-venom-purple"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="p-2 rounded-full bg-venom-purple/20 hover:bg-venom-purple/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="text-ghost-lilac" size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupChatModal; 