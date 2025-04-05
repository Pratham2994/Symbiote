import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_DOMAIN}/api/teams/myteams/${user._id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      if (response.data && Array.isArray(response.data)) {
        setTeams(response.data);
        setError(null);
      } else {
        setError('Invalid response format from server');
        setTeams([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const fetchTeamById = useCallback(async (teamId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_DOMAIN}/api/teams/${teamId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      });
      
      if (response.data?.team) {
        const teamData = response.data.team;
        setTeams(prevTeams => {
          const index = prevTeams.findIndex(t => t._id === teamId);
          if (index !== -1) {
            const newTeams = [...prevTeams];
            newTeams[index] = teamData;
            return newTeams;
          }
          return [...prevTeams, teamData];
        });
        setError(null);
        return teamData;
      } else {
        throw new Error('Invalid team data received');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch team');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?._id) {
      fetchTeams();
    } else {
      setTeams([]);
    }
  }, [user?._id, fetchTeams]);

  return (
    <TeamContext.Provider value={{ 
      teams: Array.isArray(teams) ? teams : [],
      loading, 
      error, 
      fetchTeams, 
      fetchTeamById,
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};