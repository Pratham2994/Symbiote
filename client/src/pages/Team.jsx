import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Trophy, Star, MessageSquare, UserPlus, ArrowLeft, Calendar } from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import UserNavbar from '../components/UserNavbar';

const Team = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { fetchTeamById, loading, error } = useTeam();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);

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
          <div className="text-center">Loading team details...</div>
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
          <div className="text-center text-red-500">Error loading team details</div>
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
          <button
            onClick={() => navigate('/dashboard/teams')}
            className="flex items-center gap-2 text-ghost-lilac/70 hover:text-ghost-lilac transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Teams
          </button>

          {/* Team Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
                  {team.name}
                </span>
              </h1>
              <p className="text-ghost-lilac/70">{team.description || 'No description available'}</p>
            </div>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-venom-purple/20 border border-venom-purple/30 rounded-lg hover:bg-venom-purple/30 transition-colors"
              >
                <UserPlus size={20} />
                Quick Add
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-symbiote-purple/20 border border-symbiote-purple/30 rounded-lg hover:bg-symbiote-purple/30 transition-colors"
              >
                <MessageSquare size={20} />
                Group Chat
              </motion.button>
            </div>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-venom-purple" size={24} />
                <h3 className="text-xl font-semibold">Team Members</h3>
              </div>
              <div className="space-y-3">
                {team.members?.map((member) => (
                  <div key={member._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-venom-purple/20 flex items-center justify-center">
                      {member.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{member.username || 'Unknown Member'}</span>
                      <span className="text-sm text-ghost-lilac/60">{member.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="text-venom-purple" size={24} />
                <h3 className="text-xl font-semibold">Competition</h3>
              </div>
              <div className="space-y-3">
                <p className="text-lg">{team.competition?.title || 'No competition'}</p>
                <p className="text-ghost-lilac/70">{team.competition?.description || 'No description available'}</p>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-venom-purple" />
                  <span>Max Team Size: {team.competition?.maxTeamSize || 'N/A'}</span>
                </div>
                {team.competition?.competitionStartDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-venom-purple" />
                    <span>Starts: {new Date(team.competition.competitionStartDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <Star className="text-venom-purple" size={24} />
                <h3 className="text-xl font-semibold">Team Skills</h3>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {team.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-venom-purple/20 rounded-full text-ghost-lilac/80"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="pt-4">
                  <p className="text-ghost-lilac/70">Created by: {team.createdBy?.username || 'Unknown'}</p>
                  <p className="text-ghost-lilac/70">Created on: {new Date(team.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Team; 