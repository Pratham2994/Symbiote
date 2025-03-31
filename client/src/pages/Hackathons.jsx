import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHackathon } from "../context/HackathonContext";
import UserNavbar from "../components/UserNavbar";
import { fetchCompetitions } from "../services/api";
import { Github } from "lucide-react";
import { Listbox } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

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
  const navigate = useNavigate();
  const { fetchHackathonById } = useHackathon();
  
  

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
  const getCompetitionStatus = (competition) => {
    const now = new Date();
    const start = new Date(competition.competitionStartDate);
    const end = new Date(competition.competitionEndDate);
    if (now < start) return "Upcoming";
    if (now > end) return "Past";
    return "Ongoing";
  };

  // Filter competitions based on search term and selected status
  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch = comp.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const status = getCompetitionStatus(comp);
    const matchesStatus = filterStatus === "All" || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-void-black text-ghost-lilac">
      <UserNavbar />
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Search and Filter Section */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <input
              type="text"
              placeholder="Search hackathons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 rounded-lg bg-symbiote-purple/20 border border-venom-purple/30 focus:border-venom-purple focus:outline-none"
            />
            <div className="w-full md:w-1/4">
              <Listbox value={filterStatus} onChange={setFilterStatus}>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-lg bg-symbiote-purple/20 py-2 pl-4 pr-10 text-left border border-venom-purple/30 focus:outline-none focus:border-venom-purple">
                    <span className="block truncate text-ghost-lilac">
                      {filterStatus}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown className="w-5 h-5 text-venom-purple" />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-symbiote-purple/20 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    {filterOptions.map((option, idx) => (
                      <Listbox.Option
                        key={idx}
                        value={option}
                        className={({ active }) =>
                          `cursor-default select-none relative py-2 pl-4 pr-4 ${
                            active
                              ? "bg-venom-purple/60 text-ghost-lilac"
                              : "text-ghost-lilac"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                          >
                            {option}
                          </span>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          </div>
        </section>

        {/* Hackathons List Section */}
        <section>
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
          ) : filteredCompetitions.length > 0 ? (
            filteredCompetitions.map((comp) => (
              <div
                key={comp._id}
                onClick={() => {
                  fetchHackathonById(comp._id);
                  navigate(`/dashboard/hackathon/${comp._id}`);
                }}
                className="flex flex-row mb-6 p-4 bg-gradient-to-br from-symbiote-purple/10 to-venom-purple/5 backdrop-blur-sm border border-venom-purple/20 rounded-xl hover:border-venom-purple/40 transition-all cursor-pointer"
              >
                {/* Left side image with date overlay */}
                <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                  <img
                    src={
                      comp.imagePath ||
                      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={comp.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-venom-purple/90 rounded-full text-xs">
                    {formatIndianDate(comp.competitionStartDate)}
                  </div>
                </div>
                {/* Right side information */}
                <div className="ml-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 hover:text-venom-purple transition-colors">
                      {comp.title}
                    </h3>
                    <p className="text-ghost-lilac/70 mb-2 line-clamp-2">
                      {comp.description}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-ghost-lilac/60">
                      {comp.registeredTeams?.length || 0} participants
                    </span>
                    <span className="text-venom-purple font-medium">
                      {comp.prize || "TBA"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-lg">No hackathons found.</p>
          )}
        </section>
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
