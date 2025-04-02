import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/teams/myteams/${user._id}`);
      setTeams(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.response?.data?.error || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamById = async (teamId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/teams/${teamId}`);
      // Update the teams array with the fresh team data
      setTeams(prevTeams => {
        const index = prevTeams.findIndex(t => t._id === teamId);
        if (index !== -1) {
          const newTeams = [...prevTeams];
          newTeams[index] = response.data;
          return newTeams;
        }
        return [...prevTeams, response.data];
      });
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error fetching team:', err);
      setError(err.response?.data?.error || 'Failed to fetch team');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTeamById = (teamId) => {
    return teams.find(team => team._id === teamId);
  };

  useEffect(() => {
    if (user?._id) {
      fetchTeams();
    }
  }, [user?._id]);

  return (
    <TeamContext.Provider value={{ 
      teams, 
      loading, 
      error, 
      fetchTeams, 
      fetchTeamById,
      getTeamById 
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