import axios from 'axios';

// Dynamically use the Vercel environment variable, fallback to local development
const API = axios.create({
    baseURL: (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
             (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
             'http://localhost:8080',
});


API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
