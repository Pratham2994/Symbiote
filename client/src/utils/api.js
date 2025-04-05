import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_DOMAIN,
  withCredentials: true, // This is important for sending cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api; 