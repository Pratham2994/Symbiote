import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import UserNavbar from "../components/UserNavbar";
import { Github } from "lucide-react";
import { useHackathon } from "../context/HackathonContext";

const Hackathon = () => {
  const { id } = useParams();
  const { selectedHackathon, fetchHackathonById } = useHackathon();

  useEffect(() => {
    if (id) {
      fetchHackathonById(id);
    }
  }, [id, fetchHackathonById]);

  if (!selectedHackathon) {
    return (
      <div className="min-h-screen bg-void-black text-ghost-lilac">
        <UserNavbar />
        <div className="pt-24 flex justify-center items-center h-full">
          <p>Loading hackathon details...</p>
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
  

  useEffect(() => {
    // Reset scroll when the hackathon id changes
    const scrollContainer = document.querySelector('.simplebar-content-wrapper');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [id]);
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
    <div className="min-h-screen bg-void-black text-ghost-lilac">
      <UserNavbar />
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="bg-symbiote-purple/20 border border-venom-purple/30 rounded-xl shadow-2xl p-8 flex flex-col md:flex-row">
          {/* Left Side: Hackathon Image */}
          <div className="md:w-1/2 relative">
            <img
              src={
                imagePath ||
                "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80"
              }
              alt={title}
              className="w-full h-auto rounded-xl object-cover shadow-2xl transform hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 left-4 bg-venom-purple/80 text-xs px-3 py-1 rounded-full shadow-lg">
              {formatIndianDate(competitionStartDate)}
            </div>
          </div>
          {/* Right Side: Hackathon Details */}
          <div className="mt-8 md:mt-0 md:ml-8 md:w-1/2 flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">{title}</h1>
              <p className="mb-4">{description}</p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">College:</span> {collegeName}
                </p>
                <p>
                  <span className="font-semibold">Location:</span> {competitionLocation}
                </p>
                <p>
                  <span className="font-semibold">Timing:</span> {timing}
                </p>
                <p>
                  <span className="font-semibold">Dates:</span> {formatIndianDate(competitionStartDate)} - {formatIndianDate(competitionEndDate)}
                </p>
                <p>
                  <span className="font-semibold">Registration Deadline:</span>{" "}
                  {registrationDeadline ? formatIndianDate(registrationDeadline) : "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Registration Fee:</span>{" "}
                  {registrationFee ? `$${registrationFee}` : "Free"}
                </p>
                <p>
                  <span className="font-semibold">Prize:</span> {prize || "TBA"}
                </p>
                <p>
                  <span className="font-semibold">Contact:</span> {contact}
                </p>
                <p>
                  <span className="font-semibold">Tags:</span> {tags ? tags.join(", ") : ""}
                </p>
                <p>
                  <span className="font-semibold">Registered Teams:</span>{" "}
                  {registeredTeams ? registeredTeams.length : 0}
                </p>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="mt-6 flex space-x-4">
              <button className="px-6 py-3 bg-venom-purple rounded-lg shadow-neon hover:shadow-xl transition-all">
                View Teams
              </button>
              <button className="px-6 py-3 bg-venom-purple rounded-lg shadow-neon hover:shadow-xl transition-all">
                Create Team
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default Hackathon;
