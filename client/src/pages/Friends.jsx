import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, Users, Loader2, UserRound, PlusCircle, UserMinus, Github } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import axios from "../utils/axios";
import { toast } from "react-toastify";

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [noUserFound, setNoUserFound] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch all friends
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.post("/searchForFriends/allFriends/", {
          userId: user._id,
        });

        // Ensure we have an array of friends
        if (Array.isArray(response.data)) {
          setFriends(response.data);
        } else if (response.data && Array.isArray(response.data.friends)) {
          setFriends(response.data.friends);
        } else {
          console.error("Unexpected response format:", response.data);
          setFriends([]);
          const errorMsg = "Failed to load friends list";
          setError(errorMsg);
          toast.error(errorMsg, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
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
        console.error("Error fetching friends:", error);
        const errorMsg = error.response?.data?.message || "Failed to load friends";
        setError(errorMsg);
        setFriends([]);
        toast.error(errorMsg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
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
    };

    if (user?._id) {
      fetchFriends();
    }
  }, [user?._id]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        setNoUserFound(false);
        setShowResults(false);
        return;
      }

      try {
        setIsSearching(true);
        setNoUserFound(false);
        const response = await axios.post("/searchForFriends/searchFriend", {
          username: query.trim(),
        });

        // Handle the response format from the server
        if (response.data.success && response.data.user) {
          // Only add the user if they're not already in the friends list
          const isAlreadyFriend = friends.some(friend => friend._id === response.data.user._id);
          if (!isAlreadyFriend) {
            setSearchResults([response.data.user]);
            setShowResults(true);
          } else {
            setSearchResults([]);
            setShowResults(false);
            toast.info('This user is already your friend!', {
              position: "top-right",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
              style: {
                background: '#0B0B0B',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
                color: '#E5E7EB'
              }
            });
          }
        } else if (response.data.success === false) {
          setSearchResults([]);
          setNoUserFound(true);
          setShowResults(true);
        } else {
          console.error("Unexpected search results format:", response.data);
          setSearchResults([]);
          setShowResults(false);
          toast.error('Failed to search for users', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
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
        console.error("Error searching for friends:", error);
        setSearchResults([]);
        setNoUserFound(true);
        setShowResults(true);
        toast.error(error.response?.data?.message || 'Failed to search for users', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          style: {
            background: '#0B0B0B',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
            color: '#E5E7EB'
          }
        });
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [friends]
  );

  // Handle search input change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setNoUserFound(false);
      setShowResults(false);
      return;
    }
    // Only start searching after a short delay
    const timer = setTimeout(() => {
      debouncedSearch(searchQuery);
    }, 300);

    return () => {
      clearTimeout(timer);
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  return (
    <div className="min-h-screen bg-void-black text-ghost-lilac overflow-x-hidden flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative flex-grow w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 mb-8"
        >
          {/* Search Section */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Search className="text-venom-purple" size={24} />
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">
                Find Friends
              </h2>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchQuery(newValue);
                  // Clear results immediately when user modifies search text
                  setShowResults(false);
                  setSearchResults([]);
                  setNoUserFound(false);
                }}
                placeholder="Search by username..."
                className="w-full px-4 py-3 bg-symbiote-purple/10 border border-venom-purple/20 rounded-lg focus:outline-none focus:border-venom-purple/40 text-ghost-lilac placeholder-ghost-lilac/50"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-venom-purple animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showResults && (searchResults.length > 0 || noUserFound) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-2 bg-symbiote-purple/10 backdrop-blur-sm border border-venom-purple/20 rounded-lg shadow-lg"
                >
                  {noUserFound ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 text-center"
                    >
                      <div className="flex items-center justify-center gap-2 text-ghost-lilac/70">
                        <Search className="w-5 h-5" />
                        <p>No user found with username "{searchQuery}"</p>
                      </div>
                    </motion.div>
                  ) : (
                    searchResults.map((result) => (
                      <motion.div
                        key={result._id}
                        whileHover={{
                          backgroundColor: "rgba(147, 51, 234, 0.1)",
                          transition: { duration: 0 },
                        }}
                        className="p-3 flex items-center justify-between cursor-pointer"
                        onClick={() => {
                          navigate(`/dashboard/profile/${result._id}`);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-venom-purple/20 flex items-center justify-center">
                            <UserRound className="w-5 h-5 text-venom-purple" />
                          </div>
                          <div>
                            <p className="text-ghost-lilac">{result.username}</p>
                          </div>
                        </div>
                        <button
                          className="px-4 py-1.5 bg-venom-purple text-white rounded-full text-sm hover:bg-venom-purple/80 transition-colors flex items-center gap-1.5 shadow-md shadow-venom-purple/20"
                          onClick={async (e) => {
                            e.stopPropagation(); // Prevent triggering the parent div's onClick
                            try {
                              const response = await axios.post('/friend-requests/send', {
                                toUsername: result.username
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
                                  style: {
                                    background: '#0B0B0B',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
                                    color: '#E5E7EB'
                                  }
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
                                style: {
                                  background: '#0B0B0B',
                                  border: '1px solid rgba(139, 92, 246, 0.2)',
                                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
                                  color: '#E5E7EB'
                                }
                              });
                            }
                          }}
                        >
                          <PlusCircle className="w-4 h-4" />
                          Add Friend
                        </button>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Friends List */}
          <div className="space-y-6 transition-all duration-300" style={{
            marginTop: showResults && (searchResults.length > 0 || noUserFound)
              ? (noUserFound ? '80px' : searchResults.length === 1 ? '100px' : '120px')
              : '32px'
          }}>
            <div className="flex items-center gap-2">
              <Users className="text-venom-purple" size={24} />
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">
                Your Friends
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-venom-purple animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-400">
                {error}
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-12 text-ghost-lilac/70">
                No friends yet. Start connecting with other users!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friend, index) => (
                  <motion.div
                    key={friend._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 0 25px rgba(147, 51, 234, 0.3)",
                      transition: { duration: 0, scale: { duration: 0 }, boxShadow: { duration: 0 } },
                    }}
                    onClick={() => navigate(`/dashboard/profile/${friend._id}`)}
                    className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 transition-all duration-[50ms] hover:border-venom-purple/40 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-venom-purple/20 flex items-center justify-center">
                          <UserPlus className="w-6 h-6 text-venom-purple" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">
                            {friend.username}
                          </h3>
                          <p className="text-ghost-lilac/70">{friend.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation(); // Prevent card click when clicking delete
                          try {
                            const response = await axios.post('/searchForFriends/remove', {
                              friendId: friend._id
                            });

                            if (response.data.success) {
                              // Remove friend from local state
                              setFriends(prevFriends => prevFriends.filter(f => f._id !== friend._id));
                              
                              toast.success('Friend removed successfully', {
                                position: "top-right",
                                autoClose: 3000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
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
                            toast.error(error.response?.data?.message || 'Failed to remove friend', {
                              position: "top-right",
                              autoClose: 3000,
                              hideProgressBar: false,
                              closeOnClick: true,
                              pauseOnHover: true,
                              draggable: true,
                              progress: undefined,
                              theme: "dark",
                              style: {
                                background: '#0B0B0B',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
                                color: '#E5E7EB'
                              }
                            });
                          }
                        }}
                        className="p-2 rounded-full hover:bg-red-500/10 transition-colors"
                      >
                        <UserMinus className="w-5 h-5 text-red-400 hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
      {/* Footer */}
      <footer className="border-t border-venom-purple/20 py-6 w-full mt-auto relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
          <p className="text-ghost-lilac/60 text-sm">
            © 2025 Symbiote. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-ghost-lilac/60 text-sm">Connect with us</span>
            <a
              href="https://github.com/Pratham2994/Symbiote"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ghost-lilac/60 hover:text-venom-purple transition-colors z-10"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
