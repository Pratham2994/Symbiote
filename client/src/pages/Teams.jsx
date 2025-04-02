import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Trophy, Star, X, ChevronDown } from "lucide-react";
import { Listbox } from "@headlessui/react";
import UserNavbar from "../components/UserNavbar";
import { cardHover } from "../utils/animations";
import { useTeam } from "../context/TeamContext";
import { useAuth } from "../context/AuthContext";

const Teams = () => {
  const { teams, loading } = useTeam();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const filters = [
    { id: "all", name: "All Teams" },
    { id: "myTeams", name: "My Teams" },
    { id: "available", name: "Available Teams" },
  ];

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.competition.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "myTeams") return matchesSearch && team.members.some(member => member._id === user._id);
    if (selectedFilter === "available") return matchesSearch && team.members.length < team.competition.maxTeamSize;
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
      <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
      <UserNavbar />
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
              Teams
            </span>
          </h1>
          <p className="text-ghost-lilac/70 text-lg mb-8">
            Find and join teams for upcoming competitions
          </p>

          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ghost-lilac/50" size={20} />
              <input
                type="text"
                placeholder="Search teams or competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-symbiote-purple/10 border border-venom-purple/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-venom-purple/50 text-ghost-lilac"
              />
            </div>
            <Listbox value={selectedFilter} onChange={setSelectedFilter}>
              <div className="relative">
                <Listbox.Button className="flex items-center gap-2 px-4 py-2 bg-symbiote-purple/10 border border-venom-purple/30 rounded-lg text-ghost-lilac">
                  {filters.find(f => f.id === selectedFilter)?.name}
                  <ChevronDown size={20} />
                </Listbox.Button>
                <Listbox.Options className="absolute right-0 mt-2 w-48 bg-symbiote-purple/90 border border-venom-purple/30 rounded-lg shadow-neon z-10">
                  {filters.map((filter) => (
                    <Listbox.Option
                      key={filter.id}
                      value={filter.id}
                      className={({ active }) =>
                        `px-4 py-2 cursor-pointer ${
                          active ? "bg-venom-purple/20" : ""
                        }`
                      }
                    >
                      {filter.name}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          {/* Teams Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center text-ghost-lilac/70">
                Loading teams...
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="col-span-full text-center text-ghost-lilac/70">
                No teams found matching your criteria
              </div>
            ) : (
              filteredTeams.map((team) => (
                <motion.div
                  key={team._id}
                  className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={cardHover}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{team.name}</h3>
                    <div className="flex items-center gap-2 text-ghost-lilac/60">
                      <Users size={16} />
                      <span>{team.members.length}/{team.competition.maxTeamSize}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-ghost-lilac/80">
                      <Trophy size={16} />
                      <span className="truncate">{team.competition.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-ghost-lilac/80">
                      <Star size={16} />
                      <span>Avg Score: {team.averageFrontendScore + team.averageBackendScore}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {team.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-venom-purple/20 rounded-full text-ghost-lilac/80"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Teams;
