import React, { useState, useEffect } from "react";
import { Github, Trophy, Users, Calendar, Award } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cardHover } from "../utils/animations";
import { useAuth } from "../context/AuthContext";
import { fetchCompetitions } from "../services/api";
import { useHackathon } from "../context/HackathonContext";
import { motion } from "framer-motion";
import UserNavbar from "../components/UserNavbar";
  
// Helper function to format date in Indian style
const getDaySuffix = (day) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const formatIndianDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  return `${day}${getDaySuffix(day)} ${month} ${year}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { fetchHackathonById } = useHackathon();

  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        const data = await fetchCompetitions();
        // Filter out past competitions and sort by start date
        const currentDate = new Date();
        const sortedCompetitions = [...data]
          .filter(comp => new Date(comp.competitionStartDate) > currentDate)
          .sort((a, b) => new Date(a.competitionStartDate).getTime() - new Date(b.competitionStartDate).getTime())
          .slice(0, 3);
        setCompetitions(sortedCompetitions);
      } catch (error) {
        console.error('Error loading competitions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompetitions();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
      <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
      <UserNavbar />
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative">
        {/* Welcome Section */}
        <motion.section 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
              {user.username}
            </span>
          </h1>
          <p className="text-ghost-lilac/70 text-lg">
            Ready to build something amazing?
          </p>
        </motion.section>


  
        {/* Upcoming Hackathons Section */}
        <motion.section 
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-venom-purple" />
              Upcoming Hackathons
            </h2>
            <NavLink
              to="/dashboard/hackathons"
              className="px-4 py-2 text-sm bg-venom-purple rounded-lg shadow-neon hover:shadow-lg hover:bg-venom-purple/90 transition-all flex items-center gap-2"
            >
              Explore All
              <Trophy className="w-4 h-4" />
            </NavLink>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {loading ? (
              [...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 animate-pulse"
                >
                  <div className="h-48 bg-venom-purple/20 rounded-lg mb-4"></div>
                  <div className="h-6 bg-venom-purple/20 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-venom-purple/20 rounded w-full mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-venom-purple/20 rounded w-1/3"></div>
                    <div className="h-4 bg-venom-purple/20 rounded w-1/4"></div>
                  </div>
                </div>
              ))
            ) : (
              competitions.map((competition) => (
                <motion.div
                  key={competition._id}
                  onClick={() => {
                    fetchHackathonById(competition._id);
                    navigate(`/dashboard/hackathons/${competition._id}`);
                  }}
                  className="p-6 rounded-xl bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 hover:border-venom-purple/40 hover:shadow-neon group cursor-pointer transition-all"
                  whileHover={cardHover}
                >
                  <div className="relative mb-4 rounded-lg overflow-hidden">
                    <img
                      src={competition.imagePath}
                      alt={competition.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-void-black/80 to-transparent" />
                    <span className="absolute bottom-2 left-2 px-3 py-1 bg-venom-purple/90 rounded-full text-sm flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatIndianDate(competition.competitionStartDate)}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-venom-purple transition-colors">
                    {competition.title}
                  </h3>
                  <p className="text-ghost-lilac/70 mb-4 line-clamp-2">
                    {competition.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-ghost-lilac/60 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {competition.registeredTeams?.length || 0} participants
                    </span>
                    <span className="text-sm font-medium text-venom-purple flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {competition.prize || "TBA"}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>
  
        {/* Footer */}
        <footer className="border-t border-venom-purple/20 py-6">
          <div className="flex justify-between items-center">
            <p className="text-ghost-lilac/60 text-sm">
              © 2025 Symbiote. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-ghost-lilac/60 text-sm">Connect with us</span>
              <a
                href="https://github.com/Pratham2994/Symbiote"
                className="text-ghost-lilac/60 hover:text-venom-purple transition-colors"
              >
                <Github size={20} />
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
