import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHackathon } from "../context/HackathonContext";
import UserNavbar from "../components/UserNavbar";
import { fetchCompetitions } from "../services/api";
import { Github, Search, Trophy, Users, Calendar, Award, Clock, MapPin, Ticket, ArrowUpDown, X } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

// Helper functions to format the competition date in Indian style
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

export default function Hackathons() {
    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const filterOptions = ["All", "Upcoming", "Ongoing", "Past"];
    const [filterStatus, setFilterStatus] = useState("All");
    const [prizeFilter, setPrizeFilter] = useState("all");
    const [feeFilter, setFeeFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const navigate = useNavigate();
    const { fetchHackathonById } = useHackathon();
    // Global style to always reserve scrollbar space
    if (typeof window !== "undefined") {
        const style = document.createElement("style");
        style.innerHTML = `
      html {
        scrollbar-gutter: stable;
      }
    `;
        document.head.appendChild(style);
    }



    useEffect(() => {
        async function loadCompetitions() {
            try {
                // Fetch a high number to get all competitions sorted by date
                const data = await fetchCompetitions(100);
                setCompetitions(data);
            } catch (error) {
                console.error("Error fetching competitions:", error);
            } finally {
                setLoading(false);
            }
        }
        loadCompetitions();
    }, []);


    // Determine the status of a competition based on its start and end dates
    const getCompetitionStatus = (comp) => {
        const now = new Date();
        const startDate = new Date(comp.competitionStartDate);
        const endDate = new Date(comp.competitionEndDate);

        if (now < startDate) return "Upcoming";
        if (now > endDate) return "Past";
        return "Ongoing";
    };

    const getPrizeRange = (prize) => {
        if (!prize) return "low";
        const amount = parseInt(prize.replace(/[^0-9]/g, ""));
        if (amount >= 50000) return "high";
        if (amount >= 20000) return "medium";
        return "low";
    };

    const sortCompetitions = (comps) => {
        return [...comps].sort((a, b) => {
            switch (sortBy) {
                case "date":
                    return new Date(a.competitionStartDate).getTime() - new Date(b.competitionStartDate).getTime();
                case "prize":
                    const aAmount = a.prize ? parseInt(a.prize.replace(/[^0-9]/g, "")) : 0;
                    const bAmount = b.prize ? parseInt(b.prize.replace(/[^0-9]/g, "")) : 0;
                    return bAmount - aAmount;
                case "teams":
                    return (b.registeredTeams?.length || 0) - (a.registeredTeams?.length || 0);
                case "deadline":
                    return new Date(a.registrationDeadline).getTime() - new Date(b.registrationDeadline).getTime();
                default:
                    return 0;
            }
        });
    };

    const filteredCompetitions = competitions.filter((comp) => {
        // Search filter
        const matchesSearch = comp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            comp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            comp.collegeName?.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        const status = getCompetitionStatus(comp);
        const matchesStatus = filterStatus === "All" || status === filterStatus;

        // Prize filter
        const prizeRange = getPrizeRange(comp.prize);
        const matchesPrize = prizeFilter === "all" || prizeRange === prizeFilter;

        // Fee filter
        const matchesFee = feeFilter === "all" ||
            (feeFilter === "free" && (!comp.registrationFee || comp.registrationFee === 0)) ||
            (feeFilter === "paid" && comp.registrationFee > 0);

        return matchesSearch && matchesStatus && matchesPrize && matchesFee;
    });

    const sortedCompetitions = sortCompetitions(filteredCompetitions);

    return (
        <div className="min-h-screen bg-[#0B0B0B] text-ghost-lilac">
            <div className="absolute inset-0 bg-gradient-to-b from-void-black via-symbiote-purple/20 to-void-black"></div>
            <UserNavbar />
            <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto relative">
                {/* Search and Filter Section */}
                <motion.section 
                    className="mb-12 space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Title and Search */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-venom-purple to-symbiote-purple bg-clip-text text-transparent">
                            Explore Hackathons
                        </h1>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-venom-purple" />
                            <input
                                type="text"
                                placeholder="Search hackathons..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-symbiote-purple/10 border border-venom-purple/20 rounded-lg focus:outline-none focus:border-venom-purple/40 focus:shadow-neon transition-all text-ghost-lilac placeholder-ghost-lilac/50"
                            />
                        </div>
                    </div>

                    {/* Filters and Sort */}
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-symbiote-purple/10 border border-venom-purple/20 rounded-xl p-4">
                        {/* Status Filter */}
                        <div className="w-full md:w-auto">
                            <label className="flex items-center gap-2 text-sm mb-2">
                                <Clock className="w-4 h-4 text-venom-purple" />
                                <span>Status</span>
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full md:w-48 px-3 py-2 bg-symbiote-purple/10 border border-venom-purple/20 rounded-lg focus:outline-none focus:border-venom-purple/40 hover:shadow-neon transition-all text-ghost-lilac cursor-pointer [&>option]:bg-[#1F0B33] [&>option]:text-ghost-lilac [&>option]:border-none [&>option:checked]:bg-symbiote-purple/40 [-moz-appearance:none] [&::-moz-focus-inner]:border-0"
                            >
                                <option value="All">All Hackathons</option>
                                <option value="Upcoming">Upcoming</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Past">Past</option>
                            </select>
                        </div>

                        {/* Prize Filter */}
                        <div className="w-full md:w-auto">
                            <label className="flex items-center gap-2 text-sm mb-2">
                                <Award className="w-4 h-4 text-venom-purple" />
                                <span>Prize Pool</span>
                            </label>
                            <select
                                value={prizeFilter}
                                onChange={(e) => setPrizeFilter(e.target.value)}
                                className="w-full md:w-48 px-3 py-2 bg-symbiote-purple/10 border border-venom-purple/20 rounded-lg focus:outline-none focus:border-venom-purple/40 hover:shadow-neon transition-all text-ghost-lilac cursor-pointer [&>option]:bg-[#1F0B33] [&>option]:text-ghost-lilac [&>option]:border-none [&>option:checked]:bg-symbiote-purple/40 [-moz-appearance:none] [&::-moz-focus-inner]:border-0"
                            >
                                <option value="all">All Prizes</option>
                                <option value="high">High (₹50k+)</option>
                                <option value="medium">Medium (₹20k-50k)</option>
                                <option value="low">Low (Less than ₹20k)</option>
                            </select>
                        </div>

                        {/* Registration Fee Filter */}
                        <div className="w-full md:w-auto">
                            <label className="flex items-center gap-2 text-sm mb-2">
                                <Ticket className="w-4 h-4 text-venom-purple" />
                                <span>Entry Fee</span>
                            </label>
                            <select
                                value={feeFilter}
                                onChange={(e) => setFeeFilter(e.target.value)}
                                className="w-full md:w-48 px-3 py-2 bg-symbiote-purple/10 border border-venom-purple/20 rounded-lg focus:outline-none focus:border-venom-purple/40 hover:shadow-neon transition-all text-ghost-lilac cursor-pointer [&>option]:bg-[#1F0B33] [&>option]:text-ghost-lilac [&>option]:border-none [&>option:checked]:bg-symbiote-purple/40 [-moz-appearance:none] [&::-moz-focus-inner]:border-0"
                            >
                                <option value="all">All</option>
                                <option value="free">Free</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="w-full md:w-auto md:ml-auto">
                            <label className="flex items-center gap-2 text-sm mb-2">
                                <ArrowUpDown className="w-4 h-4 text-venom-purple" />
                                <span>Sort By</span>
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full md:w-48 px-3 py-2 bg-symbiote-purple/10 border border-venom-purple/20 rounded-lg focus:outline-none focus:border-venom-purple/40 hover:shadow-neon transition-all text-ghost-lilac cursor-pointer [&>option]:bg-[#1F0B33] [&>option]:text-ghost-lilac [&>option]:border-none [&>option:checked]:bg-symbiote-purple/40 [-moz-appearance:none] [&::-moz-focus-inner]:border-0"
                            >
                                <option value="date">Start Date</option>
                                <option value="prize">Prize Pool</option>
                                <option value="teams">Registered Teams</option>
                                <option value="deadline">Registration Deadline</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    <div className="flex flex-wrap gap-2">
                        {filterStatus !== "All" && (
                            <span className="px-3 py-1 bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm text-venom-purple rounded-full text-sm border border-venom-purple/20 flex items-center gap-1 group hover:border-venom-purple/40 hover:shadow-neon transition-all">
                                {filterStatus}
                                <X 
                                    className="w-4 h-4 cursor-pointer group-hover:text-ghost-lilac transition-colors" 
                                    onClick={() => setFilterStatus("All")}
                                />
                            </span>
                        )}
                        {prizeFilter !== "all" && (
                            <span className="px-3 py-1 bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm text-venom-purple rounded-full text-sm border border-venom-purple/20 flex items-center gap-1 group hover:border-venom-purple/40 hover:shadow-neon transition-all">
                                Prize: {prizeFilter}
                                <X 
                                    className="w-4 h-4 cursor-pointer group-hover:text-ghost-lilac transition-colors" 
                                    onClick={() => setPrizeFilter("all")}
                                />
                            </span>
                        )}
                        {feeFilter !== "all" && (
                            <span className="px-3 py-1 bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm text-venom-purple rounded-full text-sm border border-venom-purple/20 flex items-center gap-1 group hover:border-venom-purple/40 hover:shadow-neon transition-all">
                                {feeFilter === "free" ? "Free Entry" : "Paid Entry"}
                                <X 
                                    className="w-4 h-4 cursor-pointer group-hover:text-ghost-lilac transition-colors" 
                                    onClick={() => setFeeFilter("all")}
                                />
                            </span>
                        )}
                    </div>
                </motion.section>

                {/* Hackathons List Section */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {loading ? (
                        [...Array(5)].map((_, index) => (
                            <div
                                key={index}
                                className="flex flex-row mb-6 p-4 bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 rounded-xl animate-pulse"
                            >
                                <div className="w-48 h-32 bg-venom-purple/20 rounded-lg"></div>
                                <div className="flex-1 ml-4">
                                    <div className="h-6 bg-venom-purple/20 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-venom-purple/20 rounded w-full mb-2"></div>
                                    <div className="h-4 bg-venom-purple/20 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))
                    ) : sortedCompetitions.length > 0 ? (
                        sortedCompetitions.map((comp, index) => (
                            <motion.div
                                key={comp._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                onClick={() => {
                                    fetchHackathonById(comp._id);
                                    navigate(`/dashboard/hackathons/${comp._id}`);
                                }}
                                className="flex flex-row mb-6 p-4 bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 rounded-xl hover:border-venom-purple/60 hover:shadow-neon-lg transition-all cursor-pointer group"
                            >
                                {/* Left side image with date overlay */}
                                <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                                    <div className="absolute inset-0 border-2 border-venom-purple/40 rounded-lg group-hover:border-venom-purple/60 transition-all"></div>
                                    <div className="absolute inset-0 group-hover:shadow-[0_0_30px_10px_rgba(167,68,195,0.4)] transition-all duration-300"></div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-symbiote-purple/20 to-venom-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <img
                                        src={
                                            comp.imagePath ||
                                            "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80"
                                        }
                                        alt={comp.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-void-black/80 to-transparent" />
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-venom-purple/90 rounded-full text-xs flex items-center gap-1 shadow-neon-sm">
                                        <Calendar className="w-3 h-3" />
                                        {formatIndianDate(comp.competitionStartDate)}
                                    </div>
                                </div>
                                {/* Right side information */}
                                <div className="ml-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 group-hover:text-venom-purple transition-colors">
                                            {comp.title}
                                        </h3>
                                        <p className="text-ghost-lilac/70 mb-2 line-clamp-2 group-hover:text-ghost-lilac/90 transition-colors">
                                            {comp.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <span className="text-sm text-ghost-lilac/60 flex items-center gap-1 group-hover:text-ghost-lilac/80 transition-colors">
                                                <MapPin className="w-3 h-3" />
                                                {comp.competitionLocation}
                                            </span>
                                            <span className="text-sm text-ghost-lilac/60 flex items-center gap-1 group-hover:text-ghost-lilac/80 transition-colors">
                                                <Clock className="w-3 h-3" />
                                                {comp.timing}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-ghost-lilac/60 flex items-center gap-1 group-hover:text-ghost-lilac/80 transition-colors">
                                            <Users className="w-3 h-3" />
                                            {comp.registeredTeams?.length || 0} participants
                                        </span>
                                        <span className="text-venom-purple font-medium flex items-center gap-1 group-hover:text-venom-purple/90 group-hover:shadow-neon-sm transition-all">
                                            <Award className="w-3 h-3" />
                                            Prizepool: {comp.prize || "TBA"}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <Trophy className="w-16 h-16 text-venom-purple mx-auto mb-4" />
                            <p className="text-lg text-ghost-lilac/70">No hackathons found matching your criteria.</p>
                        </div>
                    )}
                </motion.section>
            </main>
            {/* Footer */}
            <footer className="border-t border-venom-purple/20 py-6 mt-8">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
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
        </div>
    );
}
