import React, { createContext, useState, useContext } from "react";

const HackathonContext = createContext();

export const HackathonProvider = ({ children }) => {
  const [selectedHackathon, setSelectedHackathon] = useState(null);

  const fetchHackathonById = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_DOMAIN}/api/competitions/${id}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch hackathon details");
      }
      const data = await response.json();
      setSelectedHackathon(data.data);
    } catch (error) {
      console.error("Error fetching hackathon:", error);
    }
  };

  return (
    <HackathonContext.Provider
      value={{ selectedHackathon, setSelectedHackathon, fetchHackathonById }}
    >
      {children}
    </HackathonContext.Provider>
  );
};

export const useHackathon = () => useContext(HackathonContext);
