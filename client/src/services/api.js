const API_BASE_URL = 'http://localhost:5000/api';

export const fetchCompetitions = async (limit = 3) => {
  try {
    const response = await fetch(`${API_BASE_URL}/competitions?limit=${limit}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch competitions');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching competitions:', error);
    throw error;
  }
}; 