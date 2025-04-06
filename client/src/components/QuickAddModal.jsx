import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Search, Sparkles } from 'lucide-react';
import axios from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { standardGlow } from '../utils/animations';
import { useNavigate } from 'react-router-dom';

const QuickAddModal = ({ isOpen, onClose, teamId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.post("/teams/viewFriends", {
          team_id: teamId,
        });
        
        if (response.data && response.data.success && Array.isArray(response.data.data.friends)) {
          setFriends(response.data.data.friends);
          console.log("friends", response.data.data.friends)
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

    if (isOpen && teamId) {
      fetchFriends();
    }
  }, [isOpen, teamId]);

  const handleAddFriend = async (friendId, e) => {
    e.stopPropagation(); // Prevent card click event
    try {
      console.log('teamId:', teamId);
      console.log('friendId:', friendId);
      
      // Create the team invite
      const inviteResponse = await axios.post('/teams/invite', {
        teamId: teamId,
        friendId: friendId
      });

      if (inviteResponse.data.success) {
        toast.success('Team invite sent successfully!', {
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
      console.error('Error in handleAddFriend:', error);
      // Only show error toast if it's not a 403 (since the invite still works)
      if (error.response?.status !== 403) {
        toast.error(error.response?.data?.message || 'Failed to send team invite. Please try again.', {
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
    }
  };

  const handleCardClick = (friendId) => {
    navigate(`/dashboard/profile/${friendId}`);
  };

  const filteredFriends = friends.filter(friend => 
    friend?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort friends by match score in descending order
  const sortedFriends = [...filteredFriends].sort((a, b) => b.matchScore - a.matchScore);

  // Format match score to percentage with 2 decimal places
  const formatMatchScore = (score) => {
    if (score === null || score === undefined) return 'N/A';
    // The score is already in percentage format, so we don't need to multiply by 100
    return `${score.toFixed(2)}%`;
  };

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
                  ) : sortedFriends.length === 0 ? (
                    <div className="text-center text-ghost-lilac/50">
                      {searchQuery ? 'No matching friends found' : 'No friends available'}
                    </div>
                  ) : (
                    sortedFriends.map((friend) => (
                      <motion.div
                        key={friend._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-venom-purple/5 border border-venom-purple/20 group hover:border-venom-purple/40 transition-all cursor-pointer"
                        onClick={() => handleCardClick(friend._id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-venom-purple/20 flex items-center justify-center border border-venom-purple/30">
                            {friend.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <h3 className="font-medium text-ghost-lilac">{friend.username || 'Unknown User'}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Match Score Display */}
                          <motion.div 
                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-venom-purple/10 border border-venom-purple/20"
                            whileHover={{ 
                              scale: 1.05,
                              boxShadow: "0 0 15px rgba(147, 51, 234, 0.3)",
                              transition: { duration: 0.05 }
                            }}
                            variants={standardGlow}
                            initial="initial"
                            animate="animate"
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Sparkles size={16} className="text-venom-purple" />
                            <span className="text-sm font-medium text-venom-purple">
                              Team Match: {formatMatchScore(friend.matchScore)}
                            </span>
                          </motion.div>
                          
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
                            onClick={(e) => handleAddFriend(friend._id, e)}
                          >
                            <UserPlus size={18} className="text-venom-purple" />
                          </motion.button>
                        </div>
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