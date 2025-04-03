import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Search } from 'lucide-react';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const QuickAddModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post("/searchForFriends/allFriends/", {
          userId: user._id,
        });
        
        if (Array.isArray(response.data)) {
          setFriends(response.data);
        } else if (response.data && Array.isArray(response.data.friends)) {
          setFriends(response.data.friends);
        } else {
          console.error("Unexpected response format:", response.data);
          setFriends([]);
          toast.error('Failed to load friends list', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
          });
          setError("Failed to load friends list");
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
        toast.error(error.response?.data?.message || 'Failed to load friends', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        setError(error.response?.data?.message || "Failed to load friends");
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && user?._id) {
      fetchFriends();
    }
  }, [isOpen, user?._id]);

  const handleAddFriend = async (friendId) => {
    try {
      const response = await axios.post('/friend-requests/send', {
        toUserId: friendId
      });
      
      if (response.data.success) {
        toast.success('Friend request sent successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send friend request', {
        position: "top-right",
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

  const filteredFriends = friends.filter(friend => 
    friend?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: {
                duration: 0.05
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9, 
              y: 20,
              transition: { duration: 0.05 }
            }}
            className="fixed inset-0 flex items-center justify-center z-[101] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-xl bg-gradient-to-br from-void-black to-void-black/95 border border-venom-purple/20 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header - Fixed */}
              <div className="p-6 border-b border-venom-purple/20 bg-void-black">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">
                    Quick Add Friends
                  </h2>
                  <motion.button
                    whileHover={{ 
                      scale: 1.1,
                      backgroundColor: "rgba(147, 51, 234, 0.2)",
                      transition: { duration: 0.05 }
                    }}
                    whileTap={{ 
                      scale: 0.95,
                      transition: { duration: 0.05 }
                    }}
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-venom-purple/10 transition-colors"
                  >
                    <X size={20} className="text-ghost-lilac/70" />
                  </motion.button>
                </div>

                {/* Search Input - Fixed */}
                <div className="mt-4 relative">
                  <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost-lilac/40" />
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-venom-purple/5 border border-venom-purple/20 rounded-lg text-ghost-lilac placeholder-ghost-lilac/30 focus:outline-none focus:border-venom-purple/40 transition-colors"
                  />
                </div>
              </div>

              {/* Friends List - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-track-void-black scrollbar-thumb-venom-purple/20 hover:scrollbar-thumb-venom-purple/30">
                <div className="p-6 space-y-4">
                  {loading ? (
                    <div className="text-center text-ghost-lilac/50">Loading friends...</div>
                  ) : error ? (
                    <div className="text-center text-red-400">{error}</div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="text-center text-ghost-lilac/50">
                      {searchQuery ? 'No matching friends found' : 'No friends available'}
                    </div>
                  ) : (
                    filteredFriends.map((friend) => (
                      <motion.div
                        key={friend._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-venom-purple/5 border border-venom-purple/20 group hover:border-venom-purple/40 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-venom-purple/20 flex items-center justify-center border border-venom-purple/30">
                            {friend.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <h3 className="font-medium text-ghost-lilac">{friend.username || 'Unknown User'}</h3>
                            <p className="text-sm text-ghost-lilac/50">{friend.email || 'No email'}</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ 
                            scale: 1.1,
                            boxShadow: "0 0 15px rgba(147, 51, 234, 0.3)",
                            transition: { duration: 0.05 }
                          }}
                          whileTap={{ 
                            scale: 0.95,
                            transition: { duration: 0.05 }
                          }}
                          className="p-2 rounded-full bg-venom-purple/20 border border-venom-purple/30 hover:bg-venom-purple/30 transition-all group-hover:border-venom-purple/40"
                          onClick={() => handleAddFriend(friend._id)}
                        >
                          <UserPlus size={18} className="text-venom-purple" />
                        </motion.button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickAddModal; 