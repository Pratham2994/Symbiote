import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, Trophy, Calendar, User, Search, Clock, Github, PlusCircle } from "lucide-react";
import UserNavbar from "../components/UserNavbar";
import { useTeam } from "../context/TeamContext";
import { useAuth } from "../context/AuthContext";
import { toast } from 'react-toastify';

const Teams = () => {
  const { teams = [], loading, fetchTeamById, fetchTeams } = useTeam();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?._id) {
      const loadTeams = async () => {
        try {
          await fetchTeams();
        } catch (error) {
          toast.error('Failed to load teams', {
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
      loadTeams();
    }
  }, [user?._id, fetchTeams]);

  const handleTeamClick = async (teamId, isActive) => {
    if (!isActive) return; // Only navigate if team is active
    try {
      await fetchTeamById(teamId);
      navigate(`/dashboard/teams/${teamId}`);
    } catch (err) {
      console.error('Error fetching team:', err);
      toast.error('Failed to load team details', {
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

  const handleCompetitionClick = (e, competitionId) => {
    e.stopPropagation();
    if (competitionId) {
      navigate(`/dashboard/hackathons/${competitionId}`);
    } else {
      toast.info('No competition associated with this team', {
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

  const currentDate = new Date();
  
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.competition?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTeams = filteredTeams.filter(team => {
    const startDate = team.competition?.competitionStartDate ? new Date(team.competition.competitionStartDate) : null;
    return startDate && startDate >= currentDate;
  });

  const pastTeams = filteredTeams.filter(team => {
    const startDate = team.competition?.competitionStartDate ? new Date(team.competition.competitionStartDate) : null;
    return !startDate || startDate < currentDate;
  });

  const TeamCard = ({ team, isActive }) => (
    <motion.div
      key={team._id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={isActive ? { 
        scale: 1.02,
        boxShadow: "0 0 25px rgba(147, 51, 234, 0.3)",
        transition: { duration: 0, scale: { duration: 0 }, boxShadow: { duration: 0 } }
      } : {}}
      onClick={() => handleTeamClick(team._id, isActive)}
      className={`p-6 rounded-xl bg-gradient-to-br ${
        isActive 
          ? "from-symbiote-purple/10 to-venom-purple/5 cursor-pointer" 
          : "from-gray-800/10 to-gray-900/5 opacity-75"
      } backdrop-blur-sm border border-venom-purple/20 transition-all duration-[50ms] hover:border-venom-purple/40`}
    >
      <div className="flex flex-col h-full">
        {/* Team Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`text-xl font-semibold ${
              isActive 
                ? "bg-gradient-to-r from-ghost-lilac to-venom-purple" 
                : "bg-gradient-to-r from-gray-400 to-gray-500"
              } bg-clip-text text-transparent`}>
              {team.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-venom-purple/20 rounded-full">
            <Users size={16} className={isActive ? "text-venom-purple" : "text-gray-500"} />
            <span className="text-sm">{team.members?.length || 0}/{team.competition?.maxTeamSize || 4}</span>
          </div>
        </div>

        {/* Team Details */}
        <div className="flex-1 space-y-4">
          {/* Competition Info */}
          <motion.button
            onClick={(e) => isActive ? handleCompetitionClick(e, team.competition?._id) : e.preventDefault()}
            whileHover={isActive ? { 
              scale: 1.02,
              backgroundColor: "rgba(147, 51, 234, 0.15)",
              transition: { duration: 0 }
            } : {}}
            className={`flex items-center gap-2 px-0 py-2 rounded-lg w-full group transition-all duration-[50ms] ${
              isActive ? "hover:border-venom-purple/40 cursor-pointer" : "cursor-default"
            }`}
          >
            <Trophy size={16} className={`${isActive ? "text-venom-purple group-hover:text-symbiote-purple" : "text-gray-500"} transition-colors`} />
            <span className={`text-sm ${isActive ? "text-ghost-lilac/70 group-hover:text-ghost-lilac" : "text-gray-500"} transition-colors`}>
              {team.competition?.title || 'No competition'}
            </span>
          </motion.button>

          {/* Skills */}
          {team.skills && team.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {team.skills.map((skill, index) => (
                <span
                  key={index}
                  className={`inline-flex px-3 py-1 text-xs ${
                    isActive 
                      ? "bg-venom-purple/20 text-ghost-lilac/80 hover:bg-venom-purple/30" 
                      : "bg-gray-700/20 text-gray-400"
                  } rounded-full transition-colors`}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Team Status */}
          <div className="flex items-center justify-between text-sm pt-4 border-t border-venom-purple/20">
            <div className="flex items-center gap-2">
              <Calendar size={16} className={isActive ? "text-venom-purple" : "text-gray-500"} />
              <span className="text-ghost-lilac/70">
                {new Date(team.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} className={isActive ? "text-venom-purple" : "text-gray-500"} />
              <span className="text-ghost-lilac/70">
                {team.createdBy?.username || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Empty state component for when there are no active teams
  const EmptyTeamsState = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 rounded-xl bg-venom-purple/5 border border-venom-purple/20 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-venom-purple/10 flex items-center justify-center mb-4">
        <PlusCircle size={32} className="text-venom-purple" />
      </div>
      <h3 className="text-xl font-semibold text-ghost-lilac mb-2">No Active Teams</h3>
      <p className="text-ghost-lilac/70 mb-6 max-w-md">
        You don't have any active teams yet. Join a competition and create a team to get started!
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/dashboard/hackathons')}
        className="px-4 py-2 bg-venom-purple/20 hover:bg-venom-purple/30 text-venom-purple rounded-lg transition-colors"
      >
        Browse Competitions
      </motion.button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
      <UserNavbar />
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative flex-grow w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 mb-8"
        >
          {/* Header and Search */}
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-bold"
            >
              <span className="bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
                My Teams
              </span>
            </motion.h1>

            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-ghost-lilac/50" />
              </div>
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-void-black/50 border border-venom-purple/30 rounded-xl focus:outline-none focus:border-venom-purple focus:ring-2 focus:ring-venom-purple/20 transition-all duration-300"
              />
            </div>
          </div>

          {/* Active Teams Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="text-venom-purple" size={20} />
              <h2 className="text-xl font-semibold text-ghost-lilac">Active Teams</h2>
            </div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatePresence>
                {loading ? (
                  <div className="col-span-2 text-center py-8 text-ghost-lilac/70">Loading teams...</div>
                ) : activeTeams.length > 0 ? (
                  activeTeams.map((team) => (
                    <TeamCard key={team._id} team={team} isActive={true} />
                  ))
                ) : (
                  <EmptyTeamsState />
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Past Teams Section */}
          {pastTeams.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 pt-8 border-t border-venom-purple/20">
                <Clock className="text-gray-500" size={20} />
                <h2 className="text-xl font-semibold text-ghost-lilac/70">Past Teams</h2>
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <AnimatePresence>
                  {pastTeams.map((team) => (
                    <TeamCard key={team._id} team={team} isActive={false} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
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
};

export default Teams;