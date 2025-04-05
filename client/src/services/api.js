const API_BASE_URL = `${import.meta.env.VITE_API_DOMAIN}/api`;

export const fetchCompetitions = async (limit = 1000) => {
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