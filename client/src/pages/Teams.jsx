import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Users, Trophy, Star, ChevronDown, Plus, Calendar, User } from "lucide-react";
import { Listbox } from "@headlessui/react";
import UserNavbar from "../components/UserNavbar";
import { cardHover } from "../utils/animations";
import { useTeam } from "../context/TeamContext";
import { useAuth } from "../context/AuthContext";

const Teams = () => {
  const { teams = [], loading, fetchTeamById, fetchTeams } = useTeam();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    if (user?._id) {
      fetchTeams();
    }
  }, [user?._id, fetchTeams]);

  const handleCreateTeam = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `${user.username}'s Team`,
          createdBy: user._id,
          members: [user._id],
          skills: []
        })
      });

      const data = await response.json();
      if (data.team) {
        await fetchTeamById(data.team._id);
        navigate(`/dashboard/teams/${data.team._id}`);
      }
    } catch (err) {
      console.error('Error creating team:', err);
    }
  };

  const filters = [
    { id: "all", name: "All Teams" },
    { id: "myTeams", name: "My Teams" },
    { id: "available", name: "Available Teams" },
  ];

  const filteredTeams = teams?.filter((team) => {
    const matchesSearch = team?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team?.competition?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "myTeams") return matchesSearch && team?.members?.some(member => member?._id === user?._id);
    if (selectedFilter === "available") return matchesSearch && team?.members?.length < team?.competition?.maxTeamSize;
    
    return matchesSearch;
  }) || [];

  const handleTeamClick = async (teamId) => {
    try {
      await fetchTeamById(teamId);
      navigate(`/dashboard/teams/${teamId}`);
    } catch (err) {
      console.error('Error fetching team:', err);
    }
  };

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
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
                  Teams
                </span>
              </h1>
              <p className="text-ghost-lilac/70">Find and join teams for your next hackathon</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateTeam}
              className="flex items-center gap-2 px-6 py-3 bg-venom-purple/20 border border-venom-purple/30 rounded-lg hover:bg-venom-purple/30 transition-colors"
            >
              <Plus size={20} />
              Create Team
            </motion.button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-void-black/50 border border-venom-purple/30 rounded-lg focus:outline-none focus:border-venom-purple"
              />
            </div>
            <div className="flex gap-2">
              {filters.map((filter) => (
                <motion.button
                  key={filter.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedFilter === filter.value
                      ? 'bg-venom-purple text-ghost-lilac'
                      : 'bg-void-black/50 text-ghost-lilac/70 hover:bg-void-black/70'
                  }`}
                >
                  {filter.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTeams.map((team) => (
              <motion.div
                key={team._id}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleTeamClick(team._id)}
                className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 cursor-pointer"
              >
                <div className="flex flex-col h-full">
                  {/* Team Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{team.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-venom-purple" />
                      <span className="text-sm">{team.members?.length || 0}/{team.competition?.maxTeamSize || 4}</span>
                    </div>
                  </div>

                  {/* Team Details */}
                  <div className="flex-1 space-y-4">
                    {/* Competition Info */}
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-venom-purple" />
                      <span className="text-sm">{team.competition?.title || 'No competition'}</span>
                    </div>

                    {/* Skills */}
                    {team.skills && team.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {team.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs bg-venom-purple/20 rounded-full text-ghost-lilac/80"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Team Status */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-venom-purple" />
                        <span className="text-ghost-lilac/70">
                          Created {new Date(team.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-venom-purple" />
                        <span className="text-ghost-lilac/70">
                          by {team.createdBy?.username || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Teams;