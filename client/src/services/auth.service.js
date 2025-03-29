import axios from 'axios';

const API_URL = '/api/auth';

export const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password
    }, {
      withCredentials: true
    });
    return response.data;
  },

  signup: async (email, password, otp) => {
    const response = await axios.post(`${API_URL}/signup`, {
      email,
      password,
      otp
    }, {
      withCredentials: true
    });
    return response.data;
  },

  sendOtp: async (email) => {
    const response = await axios.post(`${API_URL}/send-otp`, {
      email
    });
    return response.data;
  },

  logout: async () => {
    const response = await axios.post(`${API_URL}/logout`, {}, {
      withCredentials: true
    });
    return response.data;
  },

  fetchProfile: async () => {
    const response = await axios.get(`${API_URL}/profile`, {
      withCredentials: true
    });
    return response.data;
  }
}; 