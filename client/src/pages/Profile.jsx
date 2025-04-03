import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { 
  User, Github, Mail, Code, Brain, Server, 
  Trophy, ArrowLeft, Heart, Share2, UserPlus, 
  ExternalLink, Star, Zap
} from "lucide-react";

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If no userId provided or it's the current user's profile, use the current user data
        if (!userId || userId === currentUser._id) {
          setProfileUser(currentUser);
          setLoading(false);
          return;
        }
        
        // Fetch other user's profile
        const response = await fetch(`http://localhost:5000/api/user/${userId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }
        
        const data = await response.json();
        setProfileUser(data.user);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.message || "An error occurred while fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, currentUser]);

  const classifyScore = (score) => {
    if (!score && score !== 0) return { level: 'N/A', color: 'text-gray-400' };
    if (score >= 80) return { level: 'Expert', color: 'text-emerald-400' };
    if (score >= 65) return { level: 'Proficient', color: 'text-blue-400' };
    if (score >= 40) return { level: 'Intermediate', color: 'text-yellow-400' };
    if (score >= 25) return { level: 'Amateur', color: 'text-orange-400' };
    return { level: 'Beginner', color: 'text-red-400' };
  };

  const isOwnProfile = !userId || userId === currentUser?._id;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-void-black text-ghost-lilac flex items-center justify-center">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-venom-purple to-symbiote-purple mb-4"
          />
          <p className="text-ghost-lilac/70">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-void-black text-ghost-lilac flex items-center justify-center">
        <div className="p-6 bg-symbiote-purple/10 border border-venom-purple/20 rounded-xl text-center max-w-md">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4 bg-red-500/20 p-4 rounded-full w-fit"
          >
            <User className="w-8 h-8 text-red-400" />
          </motion.div>
          <h2 className="text-xl mb-2">Failed to load profile</h2>
          <p className="text-ghost-lilac/70 mb-4">{error || "User profile not found"}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-venom-purple/30 hover:bg-venom-purple/50 rounded-lg transition-colors duration-300 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black text-ghost-lilac">
      <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
      
      <main className="pt-20 px-4 md:px-8 max-w-7xl mx-auto relative">
        {/* Header with back button */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center"
        >
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-symbiote-purple/20 rounded-full hover:bg-venom-purple/30 transition-colors mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">
            {isOwnProfile ? "Your Profile" : `${profileUser.username}'s Profile`}
          </h1>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{
              boxShadow: "0 0 25px rgba(147, 51, 234, 0.3)",
              transition: { duration: 0 }
            }}
            style={{ borderRadius: "0.75rem" }}
            className="md:col-span-1 h-full overflow-hidden"
          >
            <div className="bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 rounded-xl p-6 shadow-xl shadow-venom-purple/5 h-full hover:border-venom-purple/40 transition-[border-color] duration-0">
              <div className="flex flex-col items-center h-full">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="w-24 h-24 rounded-full bg-venom-purple/20 mb-4 flex items-center justify-center hover:bg-venom-purple/30"
                >
                  <User size={40} className="text-venom-purple" />
                </motion.div>
                
                <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">{profileUser.username || "User"}</h2>
                <p className="text-ghost-lilac/70 mb-6">{profileUser.role || "Student"}</p>
                
                <div className="w-full space-y-4 mt-auto">
                  <motion.a 
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0 }}
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${profileUser.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:text-venom-purple"
                  >
                    <Mail className="w-5 h-5 text-venom-purple" />
                    <span className="text-sm">{profileUser.email}</span>
                  </motion.a>
                  
                  {profileUser.githubLink && (
                    <motion.a 
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0 }}
                      href={profileUser.githubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:text-venom-purple"
                    >
                      <Github className="w-5 h-5 text-venom-purple" />
                      <span className="text-sm">GitHub Profile</span>
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </motion.a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Main content area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 space-y-8 h-full"
          >
            <div className="grid grid-cols-1 gap-8 h-full">
              {/* About Me */}
              <motion.div
                whileHover={{
                  boxShadow: "0 0 25px rgba(147, 51, 234, 0.3)",
                  transition: { duration: 0 }
                }}
                style={{ borderRadius: "0.75rem" }}
                className="bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 rounded-xl p-6 shadow-xl shadow-venom-purple/5 hover:border-venom-purple/40 transition-[border-color] duration-0 overflow-hidden"
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">
                  <Heart className="w-5 h-5 text-venom-purple" />
                  About Me
                </h3>
                <p className="text-ghost-lilac/80 leading-relaxed">
                  {profileUser.aboutMe || "No bio provided."}
                </p>
              </motion.div>
              
              {/* Skills */}
              <motion.div
                whileHover={{
                  boxShadow: "0 0 25px rgba(147, 51, 234, 0.3)",
                  transition: { duration: 0 }
                }}
                style={{ borderRadius: "0.75rem" }}
                className="bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 rounded-xl p-6 shadow-xl shadow-venom-purple/5 hover:border-venom-purple/40 transition-[border-color] duration-0 overflow-hidden"
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">
                  <Zap className="w-5 h-5 text-venom-purple" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skills ? (
                    (() => {
                      try {
                        // Try to parse as JSON
                        const skillsArray = JSON.parse(profileUser.skills);
                        return skillsArray.map((skill, index) => (
                          <motion.span 
                            key={index}
                            whileHover={{ 
                              scale: 1.05,
                              boxShadow: "0 0 15px rgba(147, 51, 234, 0.4)",
                              transition: { duration: 0 }
                            }}
                            className="bg-venom-purple/20 text-ghost-lilac/90 px-3 py-1 rounded-full text-sm border border-venom-purple/30 hover:border-venom-purple/60 hover:bg-venom-purple/30"
                          >
                            {skill}
                          </motion.span>
                        ));
                      } catch (e) {
                        // If parsing fails, treat as comma-separated string
                        return profileUser.skills.split(',').map((skill, index) => (
                          <motion.span 
                            key={index}
                            whileHover={{ 
                              scale: 1.05,
                              boxShadow: "0 0 15px rgba(147, 51, 234, 0.4)",
                              transition: { duration: 0 }
                            }}
                            className="bg-venom-purple/20 text-ghost-lilac/90 px-3 py-1 rounded-full text-sm border border-venom-purple/30 hover:border-venom-purple/60 hover:bg-venom-purple/30"
                          >
                            {skill.trim()}
                          </motion.span>
                        ));
                      }
                    })()
                  ) : (
                    <p className="text-ghost-lilac/60">No skills listed</p>
                  )}
                </div>
              </motion.div>
              
              {/* Social Links (if available) */}
              {profileUser.socialLinks && profileUser.socialLinks.length > 0 && (
                <motion.div
                  whileHover={{
                    boxShadow: "0 0 25px rgba(147, 51, 234, 0.3)",
                    transition: { duration: 0 }
                  }}
                  style={{ borderRadius: "0.75rem" }}
                  className="bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 rounded-xl p-6 shadow-xl shadow-venom-purple/5 hover:border-venom-purple/40 transition-[border-color] duration-0 overflow-hidden"
                >
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 bg-gradient-to-r from-ghost-lilac to-venom-purple bg-clip-text text-transparent">
                    <ExternalLink className="w-5 h-5 text-venom-purple" />
                    Other Links
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {profileUser.socialLinks.map((link, index) => (
                      <motion.a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: "0 0 15px rgba(147, 51, 234, 0.4)",
                          transition: { duration: 0 }
                        }}
                        className="flex items-center gap-2 bg-venom-purple/20 hover:bg-venom-purple/30 px-3 py-2 rounded-lg border border-venom-purple/30 hover:border-venom-purple/60"
                      >
                        <ExternalLink size={16} />
                        <span>Link {index + 1}</span>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
