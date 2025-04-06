import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile, ChevronDown } from 'lucide-react';
import { useGroupChat } from '../context/GroupChatContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const GroupChatModal = ({ isOpen, onClose, teamId, teamName }) => {
  const { 
    activeChat, 
    messages, 
    loading, 
    error, 
    openGroupChat, 
    closeGroupChat, 
    sendMessage,
    messagesEndRef,
    markMessagesAsRead
  } = useGroupChat();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const emojiPickerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const initialLoadRef = useRef(true);
  const hasScrolledRef = useRef(false);

  // Common emojis for quick selection
  const commonEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '👏', '🙌', '💯', '🤔', '😎', '🚀', '💪', '✨', '💡'];

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle scroll events to show/hide scroll button
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isBottom = scrollHeight - scrollTop - clientHeight < 50;
        setIsAtBottom(isBottom);
        setShowScrollButton(!isBottom);
      }
    };

    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      
      // Set initial scroll position to bottom
      if (messages.length > 0 && !hasScrolledRef.current) {
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
            hasScrolledRef.current = true;
            setIsAtBottom(true);
            setShowScrollButton(false);
          }
        }, 0);
      }
      
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && isAtBottom) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages.length, isAtBottom]);

  // Mark messages as read when they are viewed
  useEffect(() => {
    if (isOpen && activeChat && messages.length > 0) {
      markMessagesAsRead(activeChat._id);
    }
  }, [isOpen, activeChat, messages, markMessagesAsRead]);

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
      initialLoadRef.current = true;
      hasScrolledRef.current = false;
      await openGroupChat(teamId);
      
      // The scroll to bottom will be handled by the useEffect that watches messages
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
      setIsSending(true);
      await sendMessage(messageText);
      setMessageText('');
      
      // Always scroll to bottom after sending a message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          setIsAtBottom(true);
          setShowScrollButton(false);
        }
      }, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsAtBottom(true);
      setShowScrollButton(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-[#0B0B0B] via-[#0F0F0F] to-[#121212] border border-venom-purple/30 rounded-xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden shadow-2xl shadow-venom-purple/20"
          >
            {/* Header */}
            <div className="p-4 border-b border-venom-purple/20 flex justify-between items-center bg-gradient-to-r from-venom-purple/10 to-transparent">
              <h2 className="text-xl font-bold bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
                {teamName} - Group Chat
              </h2>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-venom-purple/20 transition-colors"
              >
                <X className="text-venom-purple" size={20} />
              </motion.button>
            </div>
            
            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0B0B0B]/50 relative"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.05) 0%, rgba(0, 0, 0, 0) 70%)',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {loading || isInitializing ? (
                <div className="flex justify-center items-center h-full">
                  <motion.div 
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
                      scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="rounded-full h-10 w-10 border-t-2 border-r-2 border-venom-purple"
                  ></motion.div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center">{error}</div>
              ) : messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-ghost-lilac/60 text-center flex flex-col items-center justify-center h-full"
                >
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-xl">No messages yet</p>
                  <p className="text-ghost-lilac/40">Start the conversation!</p>
                </motion.div>
              ) : (
                <div className="flex flex-col min-h-full">
                  <div className="flex-grow"></div>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div 
                          key={message._id}
                          initial={{ opacity: 0, y: 20, x: message.sender._id === user._id ? 20 : -20 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0, 
                            x: 0,
                            scale: [1, 1.02, 1],
                            transition: {
                              scale: { duration: 0.3, times: [0, 0.5, 1] }
                            }
                          }}
                          transition={{ 
                            type: "spring", 
                            damping: 20, 
                            stiffness: 300,
                            delay: index === messages.length - 1 ? 0 : 0.05 * (messages.length - 1 - index)
                          }}
                          className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                        >
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.sender._id === user._id 
                                ? 'bg-gradient-to-br from-venom-purple/30 to-venom-purple/10 text-ghost-lilac' 
                                : 'bg-gradient-to-br from-symbiote-purple/20 to-symbiote-purple/5 text-ghost-lilac'
                            } shadow-md`}
                          >
                            {message.sender._id !== user._id && (
                              <div className="font-medium text-xs mb-1 text-venom-purple">{message.sender.username}</div>
                            )}
                            <div className="break-words">{message.content}</div>
                            <div className="text-xs text-ghost-lilac/60 mt-1 text-right">
                              {format(new Date(message.createdAt), 'h:mm a')}
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div ref={messagesEndRef} className="h-8" />
                </div>
              )}
              
              {/* Scroll to bottom button */}
              <AnimatePresence>
                {showScrollButton && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 p-2 rounded-full bg-venom-purple/80 text-white shadow-lg shadow-venom-purple/30 hover:bg-venom-purple transition-colors z-10"
                  >
                    <ChevronDown size={20} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 pt-6 mt-2 border-t border-venom-purple/20 bg-gradient-to-r from-[#0B0B0B] to-[#121212]">
              <div className="flex items-center gap-2">
                <div className="relative" ref={emojiPickerRef}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 rounded-full bg-venom-purple/10 hover:bg-venom-purple/20 transition-colors"
                  >
                    <Smile className="text-venom-purple" size={18} />
                  </motion.button>
                  
                  {/* Emoji Picker */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute bottom-full left-0 mb-2 p-3 bg-[#0B0B0B]/90 backdrop-blur-sm rounded-lg shadow-lg border border-venom-purple/30 w-64"
                      >
                        <div className="grid grid-cols-5 gap-2">
                          {commonEmojis.map((emoji, index) => (
                            <motion.button
                              key={index}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => addEmoji(emoji)}
                              className="text-xl p-1 rounded hover:bg-venom-purple/20 transition-colors"
                            >
                              {emoji}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-void-black border border-venom-purple/30 rounded-lg px-4 py-2 text-ghost-lilac focus:outline-none focus:border-venom-purple focus:ring-1 focus:ring-venom-purple/50 transition-all"
                />
                <motion.button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-full transition-all ${
                    messageText.trim() 
                      ? 'bg-venom-purple hover:bg-venom-purple/80' 
                      : 'bg-venom-purple/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <motion.div
                    animate={isSending ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.5, repeat: isSending ? Infinity : 0, ease: "linear" }}
                  >
                    <Send className="text-white" size={20} />
                  </motion.div>
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GroupChatModal; 