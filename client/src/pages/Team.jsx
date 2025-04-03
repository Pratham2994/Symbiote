import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Trophy, Star, MessageSquare, UserPlus, ArrowLeft, Calendar } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import UserNavbar from '../components/UserNavbar';
import QuickAddModal from '../components/QuickAddModal';

const Team = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { fetchTeamById, loading, error } = useTeam();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const handleCompetitionClick = (competitionId) => {
    if (competitionId) {
      navigate(`/dashboard/hackathons/${competitionId}`);
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

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
      <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
      <UserNavbar />
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
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
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(147, 51, 234, 0.3)",
                  transition: { duration: 0, scale: { duration: 0 }, boxShadow: { duration: 0 } }
                }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-symbiote-purple/20 border border-symbiote-purple/30 rounded-xl hover:bg-symbiote-purple/30 transition-all duration-[50ms]"
              >
                <MessageSquare size={20} className="text-symbiote-purple" />
                <span>Group Chat</span>
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
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-venom-purple/10 transition-colors group relative hover:z-10 cursor-pointer"
                      whileHover={{ 
                        x: 5,
                        backgroundColor: "rgba(147, 51, 234, 0.1)",
                        transition: { duration: 0.1 }
                      }}
                      onClick={() => navigate(`/dashboard/profile/${member._id}`)}
                    >
                      <div className="w-8 h-8 rounded-full bg-venom-purple/20 flex items-center justify-center border border-venom-purple/30">
                        {member.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex flex-col overflow-visible">
                        <span className="font-medium whitespace-nowrap">{member.username || 'Unknown Member'}</span>
                        <span className="text-sm text-ghost-lilac/60 whitespace-nowrap">{member.email}</span>
                      </div>
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
                      whileHover={{ scale: 1.05 }}
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
      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
};

export default Team; 