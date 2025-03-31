import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";
import { Github, Calendar, MapPin, Clock, Users, Award, Building2, Tag, Mail, Phone, Link as LinkIcon, X } from "lucide-react";
import { useHackathon } from "../context/HackathonContext";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const Hackathon = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { selectedHackathon, fetchHackathonById } = useHackathon();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamName, setTeamName] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Always run this useEffect to fetch the hackathon by id
    useEffect(() => {
        if (id) {
            fetchHackathonById(id);
        }
    }, [id, fetchHackathonById]);

    // Always run this useEffect to reset scroll position
    useEffect(() => {
        const scrollContainer = document.querySelector('.simplebar-content-wrapper');
        if (scrollContainer) {
            scrollContainer.scrollTop = 0;
        } else {
            window.scrollTo(0, 0);
        }
    }, [id]);

    const handleCreateTeam = async () => {
        if (!teamName.trim()) {
            toast.error("Team name cannot be empty", {
                style: {
                    background: '#0B0B0B',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
                    color: '#E5E7EB'
                },
                progressStyle: {
                    background: '#8B5CF6'
                }
            });
            return;
        }

        if (teamName.length < 3) {
            toast.error("Team name must be at least 3 characters long", {
                style: {
                    background: '#0B0B0B',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
                    color: '#E5E7EB'
                },
                progressStyle: {
                    background: '#8B5CF6'
                }
            });
            return;
        }

        if (teamName.length > 50) {
            toast.error("Team name cannot exceed 50 characters", {
                style: {
                    background: '#0B0B0B',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
                    color: '#E5E7EB'
                },
                progressStyle: {
                    background: '#8B5CF6'
                }
            });
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:5000/api/teams/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    user_id: user._id,
                    competition_id: id,
                    name: teamName.trim()
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to create team");
            }

            // Close modal and reset form
            setIsModalOpen(false);
            setTeamName("");
            // Refresh hackathon data to show updated teams
            fetchHackathonById(id);
            
            // Show success toast
            toast.success("Team created successfully!", {
                style: {
                    background: '#0B0B0B',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
                    color: '#E5E7EB'
                },
                progressStyle: {
                    background: '#8B5CF6'
                }
            });

            // Navigate to teams page
            navigate(`/teams/${id}`);
        } catch (err) {
            // Show error toast
            toast.error(err.message || "Failed to create team", {
                style: {
                    background: '#0B0B0B',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.1)',
                    color: '#E5E7EB'
                },
                progressStyle: {
                    background: '#8B5CF6'
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Render a loading state while waiting for hackathon details
    if (!selectedHackathon) {
        return (
            <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
                <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
                <UserNavbar />
                <div className="pt-24 flex justify-center items-center h-full relative">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-venom-purple/20 border-t-venom-purple rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg text-ghost-lilac/70">Loading hackathon details...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Destructure hackathon details from context
    const {
        title,
        description,
        competitionStartDate,
        competitionEndDate,
        collegeName,
        competitionLocation,
        timing,
        registrationLink,
        prize,
        registrationDeadline,
        registrationFee,
        contact,
        imagePath,
        tags,
        registeredTeams,
    } = selectedHackathon;

    // Helper functions for date formatting
    const getDaySuffix = (day) => {
        if (day > 3 && day < 21) return "th";
        switch (day % 10) {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
            default:
                return "th";
        }
    };

    const formatIndianDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString("en-US", { month: "long" });
        const year = date.getFullYear();
        return `${day}${getDaySuffix(day)} ${month} ${year}`;
    };

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
            <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
            <UserNavbar />
            <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative">
                <motion.div
                    className="bg-symbiote-purple/20 border border-venom-purple/30 rounded-xl shadow-2xl p-8 flex flex-col md:flex-row gap-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Left Side: Hackathon Image */}
                    <div className="md:w-1/2 relative">
                        <div className="w-full bg-symbiote-purple/20 rounded-xl overflow-hidden relative group shadow-[0_0_15px_2px_rgba(167,68,195,0.2)]">
                            <div className="absolute inset-0 border-2 border-venom-purple/40 rounded-xl group-hover:border-venom-purple/80 transition-all z-10"></div>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-symbiote-purple/20 to-venom-purple/10 z-20"></div>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-[0_0_50px_25px_rgba(167,68,195,0.4)] transition-opacity duration-300 z-10"></div>
                            <img
                                src={imagePath || "https://images.unsplash.com/..."}
                                alt={title}
                                className="w-full object-cover shadow-2xl transform group-hover:scale-105 transition-transform duration-300 relative z-0"
                            />
                        </div>
                    </div>

                    {/* Right Side: Hackathon Details */}
                    <div className="md:w-1/2">
                        <div>
                            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
                                {title}
                            </h1>
                            <p className="text-ghost-lilac/80 mb-6">{description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 rounded-lg bg-symbiote-purple/10 border border-venom-purple/20 hover:shadow-neon hover:border-venom-purple/60 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Building2 className="w-5 h-5 text-venom-purple" />
                                        <h3 className="font-semibold">College</h3>
                                    </div>
                                    <p className="text-ghost-lilac/70">{collegeName}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-symbiote-purple/10 border border-venom-purple/20 hover:shadow-neon hover:border-venom-purple/60 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-5 h-5 text-venom-purple" />
                                        <h3 className="font-semibold">Location</h3>
                                    </div>
                                    <p className="text-ghost-lilac/70">{competitionLocation}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-symbiote-purple/10 border border-venom-purple/20 hover:shadow-neon hover:border-venom-purple/60 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-5 h-5 text-venom-purple" />
                                        <h3 className="font-semibold">Timing</h3>
                                    </div>
                                    <p className="text-ghost-lilac/70">{timing}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-symbiote-purple/10 border border-venom-purple/20 hover:shadow-neon hover:border-venom-purple/60 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award className="w-5 h-5 text-venom-purple" />
                                        <h3 className="font-semibold">Prize Pool</h3>
                                    </div>
                                    <p className="text-ghost-lilac/70">{prize || "TBA"}</p>
                                </div>
                            </div>

                            <div className="space-y-4 p-4 rounded-lg bg-symbiote-purple/10 border border-venom-purple/20 hover:shadow-neon hover:border-venom-purple/60 transition-all">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-venom-purple" />
                                    <span>Dates: {formatIndianDate(competitionStartDate)} - {formatIndianDate(competitionEndDate)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-venom-purple" />
                                    <span>Registration Deadline: {registrationDeadline ? formatIndianDate(registrationDeadline) : "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Award className="w-4 h-4 text-venom-purple" />
                                    <span>Registration Fee: {registrationFee ? `$${registrationFee}` : "Free"}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-venom-purple" />
                                    <span>Registered Teams: {registeredTeams ? registeredTeams.length : 0}</span>
                                </div>
                            </div>

                            {tags && tags.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Tag className="w-4 h-4 text-venom-purple" />
                                        <h3 className="font-semibold">Tags</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-symbiote-purple/10 text-ghost-lilac/70 rounded-full text-sm border border-venom-purple/20 hover:shadow-neon hover:border-venom-purple/60 transition-all cursor-default"
                                            >
                                                {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {contact && (
                                <div className="mt-6 p-4 rounded-lg bg-symbiote-purple/10 border border-venom-purple/20 hover:shadow-neon hover:border-venom-purple/40 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className="w-4 h-4 text-venom-purple" />
                                        <h3 className="font-semibold">Contact</h3>
                                    </div>
                                    <p className="text-ghost-lilac/70">{contact}</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <button className="px-6 py-3 bg-venom-purple rounded-lg shadow-neon hover:shadow-neon-lg hover:bg-venom-purple/90 hover:scale-105 transition-all flex items-center justify-center gap-2">
                                <Users className="w-5 h-5" />
                                View Teams
                            </button>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-3 bg-venom-purple rounded-lg shadow-neon hover:shadow-neon-lg hover:bg-venom-purple/90 hover:scale-105 transition-all flex items-center justify-center gap-2"
                            >
                                <Users className="w-5 h-5" />
                                Create Team
                            </button>
                            {registrationLink && (
                                <a
                                    href={registrationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-venom-purple rounded-lg shadow-neon hover:shadow-neon-lg hover:bg-venom-purple/90 hover:scale-105 transition-all flex items-center justify-center gap-2"
                                >
                                    <LinkIcon className="w-5 h-5" />
                                    Register Now
                                </a>
                            )}
                        </div>
                    </div>
                </motion.div>
            </main>
            <footer className="border-t border-venom-purple/20 py-6 mt-8">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
                    <p className="text-ghost-lilac/60 text-sm">© 2025 Symbiote. All rights reserved.</p>
                    <div className="flex items-center gap-2">
                        <span className="text-ghost-lilac/60 text-sm">Connect with us</span>
                        <a href="https://github.com/Pratham2994/Symbiote" className="text-ghost-lilac/60 hover:text-venom-purple transition-colors">
                            <Github size={20} />
                        </a>
                    </div>
                </div>
            </footer>
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0B0B0B] border border-venom-purple/30 rounded-xl p-6 w-full max-w-md relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-ghost-lilac/60 hover:text-venom-purple transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
                                Create New Team
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-ghost-lilac/80 mb-2">Team Name</label>
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        className="w-full bg-symbiote-purple/10 border border-venom-purple/30 rounded-lg px-4 py-2 text-ghost-lilac focus:outline-none focus:border-venom-purple/60 focus:shadow-neon transition-all"
                                        placeholder="Enter your team name"
                                    />
                                </div>

                                <button
                                    onClick={handleCreateTeam}
                                    disabled={isLoading}
                                    className="w-full px-6 py-3 bg-venom-purple rounded-lg shadow-neon hover:shadow-neon-lg hover:bg-venom-purple/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Team"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Hackathon;
