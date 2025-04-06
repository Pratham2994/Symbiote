import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Trophy, Star, MessageSquare, UserPlus, ArrowLeft, Calendar, Github, Trash2, LogOut, XCircle } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import { useGroupChat } from '../context/GroupChatContext';
import UserNavbar from '../components/UserNavbar';
import QuickAddModal from '../components/QuickAddModal';
import GroupChatModal from '../components/GroupChatModal';
import { toast } from 'react-toastify';
import axios from 'axios';

const Team = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { fetchTeamById, loading, error } = useTeam();
  const { user } = useAuth();
  const { getUnreadCount, createGroupChat } = useGroupChat();
  const [team, setTeam] = useState(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const handleCompetitionClick = (competitionId) => {
    if (competitionId) {
      navigate(`/dashboard/hackathons/${competitionId}`);
    }
  };

  const handleDeleteTeam = async () => {
    if (!team) return;
    
    setIsDeleting(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_DOMAIN}/api/teams/delete`, {
        teamId: team._id
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      if (response.data.success) {
        toast.success('Team deleted successfully', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        navigate('/dashboard/teams');
      } else {
        toast.error(response.data.message || 'Failed to delete team', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete team', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    
    setIsLeaving(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_DOMAIN}/api/teams/leave`, {
        teamId: team._id
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      if (response.data.success) {
        toast.success('Successfully left the team', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        navigate('/dashboard/teams');
      } else {
        toast.error(response.data.message || 'Failed to leave team', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave team', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLeaving(false);
      setIsLeaveConfirmOpen(false);
    }
  };

  const openRemoveMemberModal = (member) => {
    setMemberToRemove(member);
    setIsRemoveMemberModalOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!team || !memberToRemove) return;
    
    setIsRemovingMember(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_DOMAIN}/api/teams/removeMember`, {
        teamId: team._id,
        memberId: memberToRemove._id
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      if (response.data.success) {
        toast.success(`Successfully removed ${memberToRemove.username} from the team`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Refresh team data
        const updatedTeam = await fetchTeamById(teamId);
        setTeam(updatedTeam);
      } else {
        toast.error(response.data.message || 'Failed to remove member', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsRemovingMember(false);
      setIsRemoveMemberModalOpen(false);
      setMemberToRemove(null);
    }
  };

  const handleMemberClick = (memberId) => {
    navigate(`/dashboard/profile/${memberId}`);
  };

  const handleOpenGroupChat = async () => {
    if (!team) return;
    
    try {
      // Create group chat if it doesn't exist
      if (!team.groupChat) {
        const chat = await createGroupChat(team._id);
        setTeam(prevTeam => ({
          ...prevTeam,
          groupChat: chat._id
        }));
      }
      
      setIsGroupChatOpen(true);
    } catch (err) {
      console.error('Failed to open group chat:', err);
      toast.error('Failed to open group chat', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const teamData = await fetchTeamById(teamId);
        setTeam(teamData);
      } catch (err) {
        console.error('Error loading team:', err);
      }
    };

    if (teamId && !team) {
      loadTeam();
    }
  }, [teamId, fetchTeamById, team]);

  // Update unread message count when team changes
  useEffect(() => {
    if (team && team.groupChat) {
      const count = getUnreadCount(team.groupChat);
      setUnreadMessageCount(count);
    }
  }, [team, getUnreadCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
        <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
        <UserNavbar />
        <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center"
          >
            <div className="text-center text-xl">Loading team details...</div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
        <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
        <UserNavbar />
        <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative">
          <div className="text-center text-red-500 text-xl">Error loading team details</div>
        </main>
      </div>
    );
  }

  const isTeamCreator = user && team.createdBy && user._id === team.createdBy._id;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac overflow-x-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
      <UserNavbar />
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative flex-grow w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 mb-8"
        >
          {/* Back Button */}
          <motion.button
            whileHover={{ x: -5 }}
            onClick={() => navigate('/dashboard/teams')}
            className="flex items-center gap-2 text-ghost-lilac/70 hover:text-ghost-lilac transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:text-venom-purple transition-colors" />
            <span>Back to Teams</span>
          </motion.button>

          {/* Team Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
                  {team.name}
                </span>
              </h1>
            </motion.div>
            <div className="flex gap-4">
              {/* Delete Team Button - Only for team creator */}
              {isTeamCreator && (
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 20px rgba(220, 38, 38, 0.3)",
                    transition: { duration: 0, scale: { duration: 0 }, boxShadow: { duration: 0 } }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all duration-[50ms]"
                >
                  <Trash2 size={20} className="text-red-500" />
                  <span>Delete Team</span>
                </motion.button>
              )}
              
              {/* Leave Team Button - Only for team members who are not the creator */}
              {!isTeamCreator && (
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 20px rgba(234, 179, 8, 0.3)",
                    transition: { duration: 0, scale: { duration: 0 }, boxShadow: { duration: 0 } }
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLeaveConfirmOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500/20 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 transition-all duration-[50ms]"
                >
                  <LogOut size={20} className="text-amber-500" />
                  <span>Leave Team</span>
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(147, 51, 234, 0.3)",
                  transition: { duration: 0, scale: { duration: 0 }, boxShadow: { duration: 0 } }
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-venom-purple/20 border border-venom-purple/30 rounded-xl hover:bg-venom-purple/30 transition-all duration-[50ms]"
              >
                <UserPlus size={20} className="text-venom-purple" />
                <span>Quick Add</span>
              </motion.button>
              
              {/* Group Chat Button with Unread Count */}
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(147, 51, 234, 0.3)",
                  transition: { duration: 0, scale: { duration: 0 }, boxShadow: { duration: 0 } }
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenGroupChat}
                className="flex items-center gap-2 px-6 py-3 bg-symbiote-purple/20 border border-symbiote-purple/30 rounded-xl hover:bg-symbiote-purple/30 transition-all duration-[50ms] relative"
              >
                <MessageSquare size={20} className="text-symbiote-purple" />
                <span>Group Chat</span>
                
                {/* Unread Message Count Badge */}
                {unreadMessageCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-venom-purple text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadMessageCount}
                  </div>
                )}
              </motion.button>
            </div>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 0 25px rgba(147, 51, 234, 0.3)",
                transition: { duration: 0, scale: { duration: 0 }, boxShadow: { duration: 0 } }
              }}
              className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 transition-all duration-[50ms] hover:border-venom-purple/40 h-full flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-venom-purple" size={24} />
                <h3 className="text-xl font-semibold bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">
                  Team Members
                </h3>
              </div>
              <div className="flex-1 space-y-3 min-h-0 overflow-y-auto scrollbar-hide relative">
                <div className="space-y-3">
                  {team.members?.map((member) => (
                    <motion.div 
                      key={member._id} 
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-venom-purple/10 transition-colors group relative hover:z-10"
                      whileHover={{ 
                        x: 5,
                        backgroundColor: "rgba(147, 51, 234, 0.1)",
                        transition: { duration: 0.1 }
                      }}
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-grow"
                        onClick={() => handleMemberClick(member._id)}
                      >
                        <div className="w-8 h-8 rounded-full bg-venom-purple/20 flex items-center justify-center border border-venom-purple/30">
                          {member.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex flex-col overflow-visible">
                          <span className="font-medium whitespace-nowrap">{member.username || 'Unknown Member'}</span>
                          <span className="text-sm text-ghost-lilac/60 whitespace-nowrap">{member.email}</span>
                        </div>
                      </div>
                      
                      {/* Remove Member Button - Only for team creator and not for the creator themselves */}
                      {isTeamCreator && member._id !== user._id && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openRemoveMemberModal(member);
                          }}
                          className="p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
                        >
                          <XCircle size={18} className="text-red-500" />
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 0 25px rgba(147, 51, 234, 0.3)",
                transition: { duration: 0, scale: { duration: 0 }, boxShadow: { duration: 0 } }
              }}
              onClick={() => handleCompetitionClick(team.competition?._id)}
              className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 transition-all duration-[50ms] hover:border-venom-purple/40 cursor-pointer h-full flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="text-venom-purple" size={24} />
                <h3 className="text-xl font-semibold bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">
                  Competition
                </h3>
              </div>
              <div className="flex-1 space-y-4 min-h-0 overflow-y-auto">
                <p className="text-lg font-medium group-hover:text-ghost-lilac transition-colors">{team.competition?.title || 'No competition'}</p>
                <p className="text-ghost-lilac/70">{team.competition?.description || 'No description available'}</p>
                <div className="flex items-center gap-2 p-2 bg-venom-purple/10 rounded-lg">
                  <Star size={16} className="text-venom-purple" />
                  <span>Max Team Size: {team.competition?.maxTeamSize || 'N/A'}</span>
                </div>
                {team.competition?.competitionStartDate && (
                  <div className="flex items-center gap-2 p-2 bg-venom-purple/10 rounded-lg">
                    <Calendar size={16} className="text-venom-purple" />
                    <span>Starts: {new Date(team.competition.competitionStartDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 0 25px rgba(147, 51, 234, 0.3)",
                transition: { duration: 0, scale: { duration: 0 }, boxShadow: { duration: 0 } }
              }}
              className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 transition-all duration-[50ms] hover:border-venom-purple/40 h-full flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <Star className="text-venom-purple" size={24} />
                <h3 className="text-xl font-semibold bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">
                  Team Skills
                </h3>
              </div>
              <div className="flex-1 space-y-4 min-h-0 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {team.skills?.map((skill, index) => (
                    <motion.span
                      key={index}
                      whileHover={{ scale: 1 }}
                      className="px-3 py-1 text-sm bg-venom-purple/20 rounded-full text-ghost-lilac/80 hover:bg-venom-purple/30 transition-all duration-300 cursor-default"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
                <div className="pt-4 border-t border-venom-purple/20">
                  <p className="text-ghost-lilac/70 flex items-center gap-2">
                    <Users size={16} className="text-venom-purple" />
                    Created by: {team.createdBy?.username || 'Unknown'}
                  </p>
                  <p className="text-ghost-lilac/70 flex items-center gap-2 mt-2">
                    <Calendar size={16} className="text-venom-purple" />
                    Created on: {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
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
      <QuickAddModal 
        isOpen={isQuickAddOpen} 
        onClose={() => setIsQuickAddOpen(false)} 
        teamId={teamId}
      />
      
      {/* Delete Team Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#0B0B0B] border border-red-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-lg"
          >
            <h3 className="text-xl font-bold mb-4 text-red-500">Delete Team</h3>
            <p className="text-ghost-lilac mb-6">
              Are you sure you want to delete this team? This action cannot be undone and will remove all team members and associated data.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-venom-purple/20 border border-venom-purple/30 hover:bg-venom-purple/30 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTeam}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin">⌛</span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} className="text-red-500" />
                    <span>Delete Team</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Leave Team Confirmation Modal */}
      {isLeaveConfirmOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#0B0B0B] border border-amber-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-lg"
          >
            <h3 className="text-xl font-bold mb-4 text-amber-500">Leave Team</h3>
            <p className="text-ghost-lilac mb-6">
              Are you sure you want to leave this team? You will need to be invited again to rejoin.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsLeaveConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-venom-purple/20 border border-venom-purple/30 hover:bg-venom-purple/30 transition-colors"
                disabled={isLeaving}
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveTeam}
                className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 transition-colors flex items-center gap-2"
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <>
                    <span className="animate-spin">⌛</span>
                    <span>Leaving...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={16} className="text-amber-500" />
                    <span>Leave Team</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Remove Member Confirmation Modal */}
      {isRemoveMemberModalOpen && memberToRemove && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#0B0B0B] border border-red-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-lg"
          >
            <h3 className="text-xl font-bold mb-4 text-red-500">Remove Member</h3>
            <p className="text-ghost-lilac mb-6">
              Are you sure you want to remove <span className="font-semibold">{memberToRemove.username}</span> from the team? They will need to be invited again to rejoin.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsRemoveMemberModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-venom-purple/20 border border-venom-purple/30 hover:bg-venom-purple/30 transition-colors"
                disabled={isRemovingMember}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center gap-2"
                disabled={isRemovingMember}
              >
                {isRemovingMember ? (
                  <>
                    <span className="animate-spin">⌛</span>
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-red-500" />
                    <span>Remove Member</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Group Chat Modal */}
      <GroupChatModal 
        isOpen={isGroupChatOpen}
        onClose={() => setIsGroupChatOpen(false)}
        teamId={team.groupChat}
        teamName={team.name}
      />
      
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Team; 