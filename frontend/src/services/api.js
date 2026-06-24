import axios from 'axios';

const API = axios.create({
    baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
             'https://onrender.com',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
