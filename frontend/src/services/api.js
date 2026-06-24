import axios from 'axios';

// Vite strictly reads environment variables through import.meta.env
const API = axios.create({
    baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
             'http://localhost:8080/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
